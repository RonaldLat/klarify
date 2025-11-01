/**
 * @fileoverview My Library page - user's purchased content
 */
import { redirect } from "@sveltejs/kit";
import {
  getUserLibrary,
  getDownloadStatus,
} from "$lib/server/services/download.js";

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  // Require authentication
  if (!locals.user) {
    throw redirect(303, "/login");
  }

  // Get user's library
  const purchases = await getUserLibrary(locals.user.id);

  // Add download status to each purchase
  const library = purchases.map((purchase) => ({
    ...purchase,
    downloadStatus: getDownloadStatus(purchase),
  }));

  return {
    library,
    user: locals.user,
  };
}
