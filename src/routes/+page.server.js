/**
 * @fileoverview Home page server-side data loading
 */

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  return {
    user: locals.user,
    session: locals.session,
  };
}
