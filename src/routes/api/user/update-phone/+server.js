// src/routes/api/user/update-phone/+server.js
import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export async function POST({ request, locals }) {
	try {
		const { user } = locals; // ✅ user is already guaranteed to exist
		const { phone } = await request.json();

		if (!phone) {
			return json({ success: false, message: 'Phone number is required' }, { status: 400 });
		}

		await prisma.user.update({
			where: { id: user.id },
			data: { phone },
		});

		return json({ success: true, message: 'Phone number updated successfully' });
	} catch (error) {
		console.error('Phone update error:', error);
		return json({ success: false, message: 'Server error' }, { status: 500 });
	}
}
