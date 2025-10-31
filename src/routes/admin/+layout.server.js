/**
 * @fileoverview Admin layout - protects all admin routes
 */

import { redirect } from "@sveltejs/kit";

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ locals }) {
	// Check if user is authenticated
	if (!locals.user) {
		throw redirect(303, "/login");
	}

	// Check if user is admin
	if (locals.user.role !== "admin") {
		throw redirect(303, "/");
	}

	return {
		user: locals.user
	};
}
