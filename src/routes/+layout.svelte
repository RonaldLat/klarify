<script>
	import Header from "$lib/components/Header.svelte";
  import { Toaster } from "$lib/components/ui/sonner/index.js";
	import "../app.css";

	let { children, data } = $props();
  console.log('layout',data)
</script>

<svelte:head>
  <link rel="icon" href="/favicon_io/favicon.ico" sizes="any">
  <!-- <link rel="icon" href="/favicon/favicon.png" type="image/png"> -->
	<title>Klarify - Audiobooks & Ebooks</title>
	<meta name="description" content="Access thousands of audiobooks and ebooks" />
</svelte:head>

<div class="min-h-screen bg-background">
	<Header user={data?.user} cartCount={data?.cartCount || 0} />
	
	<main>
		{@render children()}
	</main>
</div>
<Toaster />
