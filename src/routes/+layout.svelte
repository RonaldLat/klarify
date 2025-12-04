<script>
	import Header from "$lib/components/Header.svelte";
  import { Toaster } from "$lib/components/ui/sonner/index.js";
  import ExitIntentModal from '$lib/components/ExitIntentModal.svelte';
  import RecentPurchaseToast from '$lib/components/RecentPurchaseToast.svelte';

	import "../app.css";

	let { children, data } = $props();
  console.log('layout',data)
</script>

<svelte:head>
  <link rel="icon" href="/favicon_io/favicon.ico" sizes="any">
  <!-- <link rel="icon" href="/favicon/favicon.png" type="image/png"> -->
	<title>Klarify - Audiobooks & Ebooks</title>
	<meta name="description" content="Access thousands of audiobooks and ebooks" />
<script defer src="https://cloud.umami.is/script.js" data-website-id="18a7694f-7644-4fc4-9e46-08ff780a00bb"></script>
</svelte:head>

<div class="min-h-screen bg-background">
	<Header user={data?.user} cartCount={data?.cartCount || 0} />
	
	<main>
		{@render children()}
	</main>
</div>
<ExitIntentModal enabled={!data.user} />
<RecentPurchaseToast />
<Toaster />
