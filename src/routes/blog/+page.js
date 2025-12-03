export const load = async ({ fetch }) => {
  const response = await fetch(`/api/posts`);
  const posts = await response.json();
  console.log('posts from blog route: ', posts);

  return {
    posts
  };
};
