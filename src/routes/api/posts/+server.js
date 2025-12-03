
/** @type {import('./$types').RequestHandler}*/
import { json, text } from '@sveltejs/kit';

async function getPosts(limit=10) {
  let posts = [];

  const paths = import.meta.glob('/src/posts/*.md', { eager: true });

  for (const path in paths) {
    const file = paths[path];
    const slug = path.split('/').at(-1)?.replace('.md', '');
    const metadata = file.metadata;
    const post = { ...metadata, slug };
    post.published && posts.push(post);
  }

  posts = posts.sort(
    (first, second) =>
      new Date(second.date).getTime() - new Date(first.date).getTime()
  );

  return posts.slice(0,limit);
}

export async function GET({url}, limit=10) {
  if (!limit){
    limit = url.searchParams.get('limit');
  }
  
  const posts = await getPosts(limit);
  return json(posts);
}
