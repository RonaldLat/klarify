/**
 * @fileoverview Client-side authentication utilities
 * Uses Better-Auth Svelte integration
 */

import { createAuthClient } from "better-auth/svelte";

export const authClient = createAuthClient({
  baseURL: "http://localhost:5173", // Will use same domain in production
});

export const { signIn, signUp, signOut, useSession } = authClient;
