/**
 * @fileoverview Client-side authentication utilities
 * Uses Better-Auth Svelte integration
 */

import { env } from "$env/dynamic/private"; // ✅ dynamic import (safe)
import { createAuthClient } from "better-auth/svelte";

export const authClient = createAuthClient({
  baseURL:env.BETTER_AUTH_URL || "http://localhost:5173", // Will use same domain in production
});

export const { signIn, signUp, signOut, useSession } = authClient;
