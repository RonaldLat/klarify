/**
 * @fileoverview Seed script for Klarify database
 * Run with: npx prisma db seed
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // 1. Create admin user
  console.log("Creating admin user...");
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@klarify.com" },
    update: {},
    create: {
      id: "admin_seed_001",
      name: "Admin User",
      email: "admin@klarify.com",
      emailVerified: true,
      phone: "254712000001",
      role: "admin",
      accounts: {
        create: {
          id: "admin_account_001",
          accountId: "admin@klarify.com",
          providerId: "credential",
          password: hashedPassword,
        },
      },
    },
  });
  console.log("✅ Admin user created:", admin.email);

  // 2. Create sample customer
  console.log("Creating sample customer...");
  const customerPassword = await bcrypt.hash("customer123", 10);

  const customer = await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: {},
    create: {
      id: "customer_seed_001",
      name: "John Doe",
      email: "customer@example.com",
      emailVerified: true,
      phone: "254712000002",
      role: "user",
      accounts: {
        create: {
          id: "customer_account_001",
          accountId: "customer@example.com",
          providerId: "credential",
          password: customerPassword,
        },
      },
    },
  });
  console.log("✅ Sample customer created:", customer.email);

  // 3. Create categories
  console.log("Creating categories...");
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "fiction" },
      update: {},
      create: {
        name: "Fiction",
        slug: "fiction",
        icon: "📚",
      },
    }),
    prisma.category.upsert({
      where: { slug: "non-fiction" },
      update: {},
      create: {
        name: "Non-Fiction",
        slug: "non-fiction",
        icon: "📖",
      },
    }),
    prisma.category.upsert({
      where: { slug: "business" },
      update: {},
      create: {
        name: "Business",
        slug: "business",
        icon: "💼",
      },
    }),
    prisma.category.upsert({
      where: { slug: "self-help" },
      update: {},
      create: {
        name: "Self Help",
        slug: "self-help",
        icon: "🌟",
      },
    }),
    prisma.category.upsert({
      where: { slug: "technology" },
      update: {},
      create: {
        name: "Technology",
        slug: "technology",
        icon: "💻",
      },
    }),
  ]);
  console.log("✅ Categories created:", categories.length);

  // 4. Create sample products (without actual files - you'll upload these via admin)
  console.log("Creating sample products...");

  const product1 = await prisma.product.upsert({
    where: { slug: "atomic-habits" },
    update: {},
    create: {
      title: "Atomic Habits",
      slug: "atomic-habits",
      description:
        "An Easy & Proven Way to Build Good Habits & Break Bad Ones. Tiny changes, remarkable results.",
      author: "James Clear",
      narrator: "James Clear",
      language: "en",
      type: "BUNDLE",
      pdfPrice: 50,
      audioPrice: 99,
      bundlePrice: 120,
      pageCount: 320,
      duration: 18000, // 5 hours in seconds
      r2BasePath: "products/placeholder-atomic-habits",
      coverImage: "products/placeholder-atomic-habits/cover.jpg",
      pdfFile: "products/placeholder-atomic-habits/book.pdf",
      audioFile: "products/placeholder-atomic-habits/audiobook.mp3",
      featured: true,
      active: false, // Set to false until actual files are uploaded
      publishedAt: new Date(),
      categories: {
        connect: [{ slug: "self-help" }, { slug: "non-fiction" }],
      },
    },
  });

  const product2 = await prisma.product.upsert({
    where: { slug: "the-lean-startup" },
    update: {},
    create: {
      title: "The Lean Startup",
      slug: "the-lean-startup",
      description:
        "How Today's Entrepreneurs Use Continuous Innovation to Create Radically Successful Businesses.",
      author: "Eric Ries",
      language: "en",
      type: "EBOOK",
      pdfPrice: 50,
      audioPrice: 99,
      bundlePrice: 140,
      pageCount: 336,
      r2BasePath: "products/placeholder-lean-startup",
      coverImage: "products/placeholder-lean-startup/cover.jpg",
      pdfFile: "products/placeholder-lean-startup/book.pdf",
      featured: true,
      active: false,
      publishedAt: new Date(),
      categories: {
        connect: [{ slug: "business" }, { slug: "non-fiction" }],
      },
    },
  });

  const product3 = await prisma.product.upsert({
    where: { slug: "deep-work" },
    update: {},
    create: {
      title: "Deep Work",
      slug: "deep-work",
      description:
        "Rules for Focused Success in a Distracted World. Learn to focus without distraction.",
      author: "Cal Newport",
      narrator: "Jeff Bottoms",
      language: "en",
      type: "AUDIOBOOK",
      pdfPrice: 50,
      audioPrice: 99,
      bundlePrice: 130,
      duration: 21600, // 6 hours
      r2BasePath: "products/placeholder-deep-work",
      coverImage: "products/placeholder-deep-work/cover.jpg",
      audioFile: "products/placeholder-deep-work/audiobook.mp3",
      featured: false,
      active: false,
      publishedAt: new Date(),
      categories: {
        connect: [{ slug: "self-help" }, { slug: "business" }],
      },
    },
  });

  console.log(
    "✅ Sample products created:",
    product1.title,
    product2.title,
    product3.title,
  );

  console.log("\n🎉 Database seeded successfully!");
  console.log("\n📝 Login credentials:");
  console.log("Admin: admin@klarify.com / admin123");
  console.log("Customer: customer@example.com / customer123");
  console.log(
    "\n⚠️  Note: Sample products are inactive. Upload actual files via admin panel to activate them.",
  );
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
