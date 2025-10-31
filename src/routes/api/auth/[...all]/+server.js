/**
 * @fileoverview Better-Auth API endpoint handler
 * This catches all /api/auth/* requests and routes them to Better-Auth
 */

import { auth } from "$lib/server/auth.js";

// Export all HTTP methods that Better-Auth needs
export const GET = auth.handler;
export const POST = auth.handler;
