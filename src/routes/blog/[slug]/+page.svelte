<script>
  // src/routes/blog/[slug]/+page.svelte
  import BlogLayout from "$lib/components/BlogLayout.svelte";

  let { data } = $props();
</script>

<BlogLayout {...data.metadata}>
  <svelte:component this={data.content} />
</BlogLayout>
