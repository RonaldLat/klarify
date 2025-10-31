/**
 * @fileoverview Complete profile page - require authentication
 */

import { redirect } from "@sveltejs/kit";

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
	// Require authentication
	if (!locals.user) {
		throw redirect(303, "/login");
	}

	// If phone already exists, redirect to home
	if (locals.user.phone) {
		throw redirect(303, "/");
	}

	return {
		user: locals.user
	};
}
