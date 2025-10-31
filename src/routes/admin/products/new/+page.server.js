/**
 * @fileoverview Add product page - server load and actions
 */

import { prisma } from "$lib/server/prisma.js";
import { uploadProductFile } from "$lib/server/services/r2.js";
import { fail, redirect } from "@sveltejs/kit";

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  // Check admin auth
  if (!locals.user || locals.user.role !== "admin") {
    throw redirect(303, "/");
  }

  // Load categories for selection
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  return {
    categories,
  };
}

/** @type {import('./$types').Actions} */
export const actions = {
  default: async ({ request, locals }) => {
    // Check admin auth
    if (!locals.user || locals.user.role !== "admin") {
      return fail(401, { error: "Unauthorized" });
    }

    try {
      const formData = await request.formData();

      // Extract form fields
      const title = formData.get("title")?.toString();
      const slug = formData.get("slug")?.toString();
      const description = formData.get("description")?.toString();
      const author = formData.get("author")?.toString();
      const narrator = formData.get("narrator")?.toString() || null;
      const language = formData.get("language")?.toString();
      const type = formData.get("type")?.toString();
      const pdfPrice = parseFloat(formData.get("pdfPrice")?.toString() || "50");
      const audioPrice = parseFloat(
        formData.get("audioPrice")?.toString() || "99",
      );
      const bundlePrice =
        parseFloat(formData.get("bundlePrice")?.toString() || "0") || null;
      const pageCount = formData.get("pageCount")
        ? parseInt(formData.get("pageCount").toString())
        : null;
      const duration = formData.get("duration")
        ? parseInt(formData.get("duration").toString())
        : null;
      const featured = formData.get("featured") === "on";
      const categoryIds = formData.getAll("categories[]");

      // Extract files
      const coverFile = formData.get("cover");
      const pdfFile = formData.get("pdf");
      const audioFile = formData.get("audio");
      const samplePdfFile = formData.get("samplePdf");
      const sampleAudioFile = formData.get("sampleAudio");

      // Validate required fields
      if (!title || !slug || !description || !author || !coverFile) {
        return fail(400, { error: "Missing required fields" });
      }

      // Check slug uniqueness
      const existingProduct = await prisma.product.findUnique({
        where: { slug },
      });

      if (existingProduct) {
        return fail(400, { error: "Product with this slug already exists" });
      }

      // Create product in database first to get ID
      const product = await prisma.product.create({
        data: {
          title,
          slug,
          description,
          author,
          narrator,
          language,
          type,
          pdfPrice,
          audioPrice,
          bundlePrice,
          pageCount,
          duration,
          featured,
          active: true,
          r2BasePath: `products/temp-${Date.now()}`, // Temporary
          coverImage: "", // Will update after upload
          publishedAt: new Date(),
          ...(categoryIds.length > 0 && {
            categories: {
              connect: categoryIds.map((id) => ({ id: id.toString() })),
            },
          }),
        },
      });

      // Update r2BasePath with actual product ID
      const r2BasePath = `products/${product.id}`;
      await prisma.product.update({
        where: { id: product.id },
        data: { r2BasePath },
      });

      // Upload files to R2
      const uploadResults = {};

      try {
        // 1. Upload cover image (required)
        const coverBuffer = Buffer.from(await coverFile.arrayBuffer());
        const coverExt = coverFile.name.split(".").pop();
        const coverResult = await uploadProductFile(
          coverBuffer,
          product.id,
          "cover",
          coverExt,
        );

        if (!coverResult.success) {
          throw new Error("Failed to upload cover image");
        }
        uploadResults.coverImage = coverResult.key;

        // 2. Upload PDF if provided
        if (pdfFile && pdfFile.size > 0) {
          const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());
          const pdfResult = await uploadProductFile(
            pdfBuffer,
            product.id,
            "pdf",
            "pdf",
          );
          if (pdfResult.success) uploadResults.pdfFile = pdfResult.key;
        }

        // 3. Upload audio if provided
        if (audioFile && audioFile.size > 0) {
          const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
          const audioExt = audioFile.name.split(".").pop();
          const audioResult = await uploadProductFile(
            audioBuffer,
            product.id,
            "audio",
            audioExt,
          );
          if (audioResult.success) uploadResults.audioFile = audioResult.key;
        }

        // 4. Upload sample PDF if provided
        if (samplePdfFile && samplePdfFile.size > 0) {
          const samplePdfBuffer = Buffer.from(
            await samplePdfFile.arrayBuffer(),
          );
          const samplePdfResult = await uploadProductFile(
            samplePdfBuffer,
            product.id,
            "sample-pdf",
            "pdf",
          );
          if (samplePdfResult.success)
            uploadResults.samplePdf = samplePdfResult.key;
        }

        // 5. Upload sample audio if provided
        if (sampleAudioFile && sampleAudioFile.size > 0) {
          const sampleAudioBuffer = Buffer.from(
            await sampleAudioFile.arrayBuffer(),
          );
          const sampleAudioExt = sampleAudioFile.name.split(".").pop();
          const sampleAudioResult = await uploadProductFile(
            sampleAudioBuffer,
            product.id,
            "sample-audio",
            sampleAudioExt,
          );
          if (sampleAudioResult.success)
            uploadResults.sampleAudio = sampleAudioResult.key;
        }

        // Update product with file paths
        await prisma.product.update({
          where: { id: product.id },
          data: {
            coverImage: uploadResults.coverImage,
            pdfFile: uploadResults.pdfFile || null,
            audioFile: uploadResults.audioFile || null,
            samplePdf: uploadResults.samplePdf || null,
            sampleAudio: uploadResults.sampleAudio || null,
          },
        });

        console.log("✅ Product created successfully:", product.id);

        // Success - redirect handled by client
        return { success: true, productId: product.id };
      } catch (uploadError) {
        // Rollback: delete product if upload fails
        await prisma.product.delete({ where: { id: product.id } });
        console.error("❌ Upload failed, product rolled back:", uploadError);
        return fail(500, { error: `Upload failed: ${uploadError.message}` });
      }
    } catch (error) {
      console.error("❌ Create product error:", error);
      return fail(500, { error: error.message || "Failed to create product" });
    }
  },
};
