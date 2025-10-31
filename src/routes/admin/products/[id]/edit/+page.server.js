/**
 * @fileoverview Edit product page - server load and actions
 */

import { prisma } from "$lib/server/prisma.js";
import { uploadProductFile, deleteFile } from "$lib/server/services/r2.js";
import { fail, redirect } from "@sveltejs/kit";

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, locals }) {
  // Check admin auth
  if (!locals.user || locals.user.role !== "admin") {
    throw redirect(303, "/");
  }

  // Load product with categories
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      categories: true,
    },
  });

  if (!product) {
    throw redirect(303, "/admin/products");
  }

  // Load all categories
  const allCategories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  return {
    product,
    allCategories,
  };
}

/** @type {import('./$types').Actions} */
export const actions = {
  default: async ({ request, params, locals }) => {
    // Check admin auth
    if (!locals.user || locals.user.role !== "admin") {
      return fail(401, { error: "Unauthorized" });
    }

    try {
      const formData = await request.formData();
      const productId = params.id;

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
      const active = formData.get("active") === "on";
      const categoryIds = formData.getAll("categories[]");

      // Extract files (optional on edit)
      const coverFile = formData.get("cover");
      const pdfFile = formData.get("pdf");
      const audioFile = formData.get("audio");
      const samplePdfFile = formData.get("samplePdf");
      const sampleAudioFile = formData.get("sampleAudio");

      // Get existing product
      const existingProduct = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!existingProduct) {
        return fail(404, { error: "Product not found" });
      }

      // Check slug uniqueness (if changed)
      if (slug !== existingProduct.slug) {
        const slugExists = await prisma.product.findUnique({
          where: { slug },
        });
        if (slugExists) {
          return fail(400, { error: "Product with this slug already exists" });
        }
      }

      // Prepare update data
      const updateData = {
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
        active,
      };

      // Handle file uploads (only if new files provided)
      if (coverFile && coverFile.size > 0) {
        // Delete old cover
        if (existingProduct.coverImage) {
          await deleteFile(existingProduct.coverImage);
        }
        // Upload new cover
        const coverBuffer = Buffer.from(await coverFile.arrayBuffer());
        const coverExt = coverFile.name.split(".").pop();
        const coverResult = await uploadProductFile(
          coverBuffer,
          productId,
          "cover",
          coverExt,
        );
        if (coverResult.success) updateData.coverImage = coverResult.key;
      }

      if (pdfFile && pdfFile.size > 0) {
        if (existingProduct.pdfFile) await deleteFile(existingProduct.pdfFile);
        const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());
        const pdfResult = await uploadProductFile(
          pdfBuffer,
          productId,
          "pdf",
          "pdf",
        );
        if (pdfResult.success) updateData.pdfFile = pdfResult.key;
      }

      if (audioFile && audioFile.size > 0) {
        if (existingProduct.audioFile)
          await deleteFile(existingProduct.audioFile);
        const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
        const audioExt = audioFile.name.split(".").pop();
        const audioResult = await uploadProductFile(
          audioBuffer,
          productId,
          "audio",
          audioExt,
        );
        if (audioResult.success) updateData.audioFile = audioResult.key;
      }

      if (samplePdfFile && samplePdfFile.size > 0) {
        if (existingProduct.samplePdf)
          await deleteFile(existingProduct.samplePdf);
        const samplePdfBuffer = Buffer.from(await samplePdfFile.arrayBuffer());
        const samplePdfResult = await uploadProductFile(
          samplePdfBuffer,
          productId,
          "sample-pdf",
          "pdf",
        );
        if (samplePdfResult.success) updateData.samplePdf = samplePdfResult.key;
      }

      if (sampleAudioFile && sampleAudioFile.size > 0) {
        if (existingProduct.sampleAudio)
          await deleteFile(existingProduct.sampleAudio);
        const sampleAudioBuffer = Buffer.from(
          await sampleAudioFile.arrayBuffer(),
        );
        const sampleAudioExt = sampleAudioFile.name.split(".").pop();
        const sampleAudioResult = await uploadProductFile(
          sampleAudioBuffer,
          productId,
          "sample-audio",
          sampleAudioExt,
        );
        if (sampleAudioResult.success)
          updateData.sampleAudio = sampleAudioResult.key;
      }

      // Update product
      await prisma.product.update({
        where: { id: productId },
        data: {
          ...updateData,
          categories: {
            set: [], // Clear existing
            connect: categoryIds.map((id) => ({ id: id.toString() })),
          },
        },
      });

      console.log("✅ Product updated:", productId);

      return { success: true };
    } catch (error) {
      console.error("❌ Update product error:", error);
      return fail(500, { error: error.message || "Failed to update product" });
    }
  },
};
