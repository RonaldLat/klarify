import { auth } from "$lib/server/auth.js";
import { fail, redirect } from "@sveltejs/kit";

/** @type {import('./$types').Actions} */
export const actions = {
	default: async ({ request }) => {
		const formData = await request.formData();

		const name = formData.get("name")?.toString().trim();
		const email = formData.get("email")?.toString().trim();
		const password = formData.get("password")?.toString();

		if (!name || !email || !password) {
			return fail(400, {
				error: "Please enter your name, email, and password.",
				name,
				email
			});
		}

		if (password.length < 8) {
			return fail(400, {
				error: "Password must be at least 8 characters long.",
				name,
				email
			});
		}

		try {
			const response = await auth.api.signUpEmail({
				body: {
					email,
					password,
					name,
					callbackURL: "/complete-profile"
				}
			});

			if (response.error) {
				return fail(400, {
					error: response.error.message || "Signup failed.",
					name,
					email
				});
			}

			throw redirect(303, "/complete-profile");
		} catch (error) {
			console.error("Signup error:", error);
			return fail(500, {
				error: "An unexpected error occurred during signup.",
				name,
				email
			});
		}
	}
};

export const load = async () => {
	return { form: {} };
};
