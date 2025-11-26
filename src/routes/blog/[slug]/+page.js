// src/routes/blog/[slug]/+page.js
/**
 * @fileoverview Load individual blog post by slug
 */
export async function load({ params }) {
  try {
    const post = await import(`../../../posts/${params.slug}.md`);

    return {
      content: post.default,
      metadata: post.metadata
    };
  } catch (error) {
    console.error('Error loading blog post:', error);
    throw error;
  }
}
