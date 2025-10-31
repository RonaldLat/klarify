// src/routes/complete-profile/+page.server.js
import { redirect, fail } from "@sveltejs/kit";
import { prisma } from "$lib/server/prisma";

export const actions = {
	default: async ({ request, locals }) => {
		const session = await locals.auth.validate();

		if (!session) {
			throw redirect(303, "/login");
		}

		const user = session.user;
		const data = await request.formData();

		const name = data.get("name")?.trim();
		const phone = data.get("phone")?.trim();

		if (!name && !phone) {
			return fail(400, { error: "Please fill in at least one field." });
		}

		try {
			await prisma.user.update({
				where: { id: user.id },
				data: {
					...(name ? { name } : {}),
					...(phone ? { phone } : {})
				}
			});

			throw redirect(303, "/dashboard");
		} catch (err) {
			console.error("Update error:", err);
			return fail(500, { error: err.message });
		}
	}
};
