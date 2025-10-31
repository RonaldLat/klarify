// $lib/server/auth.ts

import { prisma } from "$lib/server/prisma";
import { env } from "$env/dynamic/private"; // ✅ dynamic import (safe)

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { getRequestEvent } from "$app/server";

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,  // ✅ access via env object
  baseUrl: env.BETTER_AUTH_URL || "https://kllarify.netlify.app",
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID, // ✅
      clientSecret: env.GOOGLE_CLIENT_SECRET, // ✅
    },
  },
  plugins: [sveltekitCookies(getRequestEvent)],
});

/**
 * Check if user is admin
 */
export async function isAdmin(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role === "admin";
}

/**
 * Get user by ID
 */
export async function getUserById(userId) {
  return await prisma.user.findUnique({
    where: { id: userId },
  });
}

/**
 * Update user phone number
 */
export async function updateUserPhone(userId, phone) {
  const phoneRegex = /^254[17]\d{8}$/;
  if (!phoneRegex.test(phone)) {
    throw new Error("Invalid phone number format");
  }

  const existingPhone = await prisma.user.findUnique({
    where: { phone },
  });

  if (existingPhone && existingPhone.id !== userId) {
    throw new Error("Phone number already in use");
  }

  return await prisma.user.update({
    where: { id: userId },
    data: { phone },
  });
}
