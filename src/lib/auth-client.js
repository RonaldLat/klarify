/**
 * @fileoverview Client-side authentication utilities
 * Uses Better-Auth Svelte integration
 */

import { BETTER_AUTH_URL } from "$env/static/private";
import { createAuthClient } from "better-auth/svelte";

export const authClient = createAuthClient({
  baseURL: BETTER_AUTH_URL || "http://localhost:5173", // Will use same domain in production
});

export const { signIn, signUp, signOut, useSession } = authClient;
