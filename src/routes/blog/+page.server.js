// src/routes/blog/+page.server.js
/**
 * @fileoverview Load all blog posts from markdown files
 */

/** @type {import('./$types').PageServerLoad} */
export async function load() {
	try {
		// Import all .md files from the blog posts directory
		const allPostFiles = import.meta.glob('/src/posts/*.md');
		
		const iterablePostFiles = Object.entries(allPostFiles);
		
		const allPosts = await Promise.all(
			iterablePostFiles.map(async ([path, resolver]) => {
				const { metadata } = await resolver();
				const slug = path.split('/').pop().replace('.md', '');
				
				return {
					slug,
					...metadata
				};
			})
		);
		
		// Sort by date (newest first)
		const sortedPosts = allPosts.sort((a, b) => {
			return new Date(b.date) - new Date(a.date);
		});
		
		return {
			posts: sortedPosts
		};
	} catch (error) {
		console.error('Error loading blog posts:', error);
		return {
			posts: []
		};
	}
}
