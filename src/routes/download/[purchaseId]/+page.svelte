<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	let loading = $state(true);
	let error = $state("");
	let downloadData = $state(null);

	onMount(async () => {
		try {
			const purchaseId = $page.params.purchaseId;
			const response = await fetch(`/download/${purchaseId}`);
			const data = await response.json();

			if (!response.ok) {
				error = data.error || "Failed to generate download links";
				loading = false;
				return;
			}

			downloadData = data;
			loading = false;
		} catch (err) {
			console.error("Download error:", err);
			error = "Failed to load download links";
			loading = false;
		}
	});

	function copyToClipboard(text) {
		navigator.clipboard.writeText(text);
		// Could add a toast notification here
	}
</script>

<svelte:head>
	<title>Download - Klarify</title>
</svelte:head>

<div class="min-h-screen bg-background py-8 md:py-12">
	<div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
		{#if loading}
			<!-- Loading State -->
			<div class="text-center py-16">
				<div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
				<p class="text-muted-foreground">Generating download links...</p>
			</div>
		{:else if error}
			<!-- Error State -->
			<div class="text-center py-16">
				<svg class="w-16 h-16 mx-auto mb-4 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<h2 class="text-2xl font-bold text-foreground mb-2">Download Unavailable</h2>
				<p class="text-muted-foreground mb-6">{error}</p>
				<a
					href="/my-library"
					class="inline-block px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
				>
					Back to Library
				</a>
			</div>
		{:else if downloadData}
			<!-- Success State -->
			<div class="mb-8 text-center">
				<div class="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
					<svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
				</div>
				<h1 class="text-3xl font-bold text-foreground mb-2">Download Ready!</h1>
				<p class="text-muted-foreground">
					Your download links are ready. They will expire in 1 hour.
				</p>
			</div>

			<!-- Download Links -->
			<div class="bg-card border border-border rounded-lg p-6 mb-6">
				<h2 class="text-xl font-semibold text-foreground mb-4">Download Files</h2>
				
				<div class="space-y-4">
					{#if downloadData.urls.pdf}
						<div class="p-4 bg-accent/50 rounded-lg">
							<div class="flex items-center justify-between mb-2">
								<div class="flex items-center gap-3">
									<svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
									</svg>
									<div>
										<div class="font-semibold text-foreground">PDF File</div>
										<div class="text-xs text-muted-foreground">Readable on any device</div>
									</div>
								</div>
							</div>
							<div class="flex gap-2">
								<a
									href={downloadData.urls.pdf}
									download
									class="flex-1 px-4 py-2 bg-primary text-primary-foreground font-medium text-center rounded-md hover:bg-primary/90 transition-colors"
								>
									Download PDF
								</a>
								<button
									onclick={() => copyToClipboard(downloadData.urls.pdf)}
									class="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
									title="Copy link"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
									</svg>
								</button>
							</div>
						</div>
					{/if}

					{#if downloadData.urls.audio}
						<div class="p-4 bg-accent/50 rounded-lg">
							<div class="flex items-center justify-between mb-2">
								<div class="flex items-center gap-3">
									<svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
									</svg>
									<div>
										<div class="font-semibold text-foreground">Audio File</div>
										<div class="text-xs text-muted-foreground">MP3 format</div>
									</div>
								</div>
							</div>
							<div class="flex gap-2">
								<a
									href={downloadData.urls.audio}
									download
									class="flex-1 px-4 py-2 bg-primary text-primary-foreground font-medium text-center rounded-md hover:bg-primary/90 transition-colors"
								>
									Download Audio
								</a>
								<button
									onclick={() => copyToClipboard(downloadData.urls.audio)}
									class="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
									title="Copy link"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
									</svg>
								</button>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Download Info -->
			<div class="bg-primary/10 border border-primary/20 rounded-lg p-6 mb-6">
				<div class="flex items-start gap-3">
					<svg class="w-6 h-6 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<div class="text-sm text-muted-foreground">
						<h3 class="font-semibold text-foreground mb-2">Download Information</h3>
						<ul class="space-y-1">
							<li>• Downloads remaining: <strong class="text-foreground">{downloadData.purchase.maxDownloads - downloadData.purchase.downloadCount}</strong></li>
							<li>• Links expire in <strong class="text-foreground">1 hour</strong></li>
							<li>• Save files to your device for offline access</li>
						</ul>
					</div>
				</div>
			</div>

			<!-- Actions -->
			<div class="flex flex-col sm:flex-row gap-4">
				<a
					href="/my-library"
					class="flex-1 px-6 py-3 bg-secondary text-secondary-foreground font-medium text-center rounded-lg hover:bg-secondary/80 transition-colors"
				>
					Back to Library
				</a>
				<a
					href="/products"
					class="flex-1 px-6 py-3 bg-primary text-primary-foreground font-semibold text-center rounded-lg hover:bg-primary/90 transition-colors"
				>
					Browse More Products
				</a>
			</div>
		{/if}
	</div>
</div>
