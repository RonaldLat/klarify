// src/routes/api/user/phone/+server.js
import  {prisma}  from "$lib/server/prisma";
import { json } from "@sveltejs/kit";

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
  const session = await locals.auth.getSession();
  if (!session?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const { phone } = await request.json();

  if (!phone || !phone.startsWith("+254")) {
    return json({ error: "Invalid phone number" }, { status: 400 });
  }

  // Optional: Check uniqueness
  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing && existing.id !== session.user.id) {
    return json({ error: "Phone already in use" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { phone },
  });

  return json({ success: true });
}
