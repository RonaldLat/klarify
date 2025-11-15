<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';

	let loading = $state(true);
	let error = $state("");
	let downloadData = $state(null);
	let audioData = $state(null);
	let showPlayer = $state(false);
	let loadingAudio = $state(false);
	let showIndividualChapters = $state(false); // Accordion state
	const publicUrl = "https://pub-ddafa2dcdc11430f8cec35c3cad0b062.r2.dev/";

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
			
			// Check if purchase includes audio
			if (data.purchase?.format === 'AUDIO' || data.purchase?.format === 'BUNDLE') {
				// Auto-load audio player
				await loadAudioPlayer();
			}
		} catch (err) {
			console.error("Download error:", err);
			error = "Failed to load download links";
			loading = false;
		}
	});

	async function loadAudioPlayer() {
		if (audioData || loadingAudio) return;
		
		loadingAudio = true;
		try {
			const purchaseId = $page.params.purchaseId;
			const response = await fetch(`/api/audio/stream/${purchaseId}`);
			const data = await response.json();

			if (response.ok) {
				audioData = data;
				showPlayer = true;
			}
		} catch (err) {
			console.error("Audio load error:", err);
		} finally {
			loadingAudio = false;
		}
	}

	function copyToClipboard(text) {
		navigator.clipboard.writeText(text);
		// Could add toast notification here
	}

	function formatSize(bytes) {
		if (!bytes) return '';
		const mb = bytes / (1024 * 1024);
		return `${mb.toFixed(1)} MB`;
	}
</script>

<svelte:head>
	<title>Download - Klarify</title>
</svelte:head>

<div class="min-h-screen bg-background py-8 md:py-12">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
					Your files are ready. Download links expire in 1 hour.
				</p>
			</div>

			<!-- Audio Player (for audiobooks) -->
			{#if showPlayer && audioData}
				<div class="mb-6">
					<div class="flex items-center justify-between mb-3">
						<h2 class="text-xl font-semibold text-foreground">Listen Now</h2>
						<span class="text-sm text-muted-foreground">{audioData.chapters?.length || 0} chapters</span>
					</div>
					<AudioPlayer 
						chapters={audioData.chapters}
						productTitle={audioData.product.title}
						productAuthor={audioData.product.author}
						coverImage={audioData.product.coverImage}
						{publicUrl}
					/>
				</div>
			{:else if (downloadData.purchase?.format === 'AUDIO' || downloadData.purchase?.format === 'BUNDLE') && !showPlayer}
				<button
					onclick={loadAudioPlayer}
					disabled={loadingAudio}
					class="w-full mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors text-left"
				>
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							<div>
								<div class="font-semibold text-foreground">Stream Audiobook</div>
								<div class="text-sm text-muted-foreground">Listen online with chapter navigation</div>
							</div>
						</div>
						{#if loadingAudio}
							<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
						{:else}
							<svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
							</svg>
						{/if}
					</div>
				</button>
			{/if}

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
										<div class="font-semibold text-foreground">Audio File (Single File)</div>
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

					<!-- Zipped Audio (if available) -->
					{#if audioData?.zipUrl}
						<div class="p-4 bg-accent/50 rounded-lg">
							<div class="flex items-center justify-between mb-2">
								<div class="flex items-center gap-3">
									<svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
									</svg>
									<div>
										<div class="font-semibold text-foreground">All Chapters (ZIP)</div>
										<div class="text-xs text-muted-foreground">{audioData.chapters?.length || 0} audio files</div>
									</div>
								</div>
							</div>
							<div class="flex gap-2">
								<a
									href={audioData.zipUrl}
									download
									class="flex-1 px-4 py-2 bg-primary text-primary-foreground font-medium text-center rounded-md hover:bg-primary/90 transition-colors"
								>
									Download ZIP
								</a>
								<button
									onclick={() => copyToClipboard(audioData.zipUrl)}
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

					<!-- Individual Chapters Accordion -->
					{#if audioData?.chapters && audioData.chapters.length > 0}
						<div class="border border-border rounded-lg overflow-hidden">
							<button
								onclick={() => showIndividualChapters = !showIndividualChapters}
								class="w-full p-4 bg-muted/30 flex items-center justify-between hover:bg-muted/50 transition-colors"
							>
								<div class="flex items-center gap-3">
									<svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
									</svg>
									<div class="text-left">
										<div class="font-semibold text-foreground">Individual Chapters</div>
										<div class="text-xs text-muted-foreground">Download chapters separately ({audioData.chapters.length} files)</div>
									</div>
								</div>
								<svg 
									class="w-5 h-5 text-foreground transition-transform duration-300 ease-in-out"
									style="transform: rotate({showIndividualChapters ? 180 : 0}deg);"
									fill="none" 
									stroke="currentColor" 
									viewBox="0 0 24 24"
								>
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
								</svg>
							</button>

							<div 
								class="accordion-content"
								style="max-height: {showIndividualChapters ? '24rem' : '0'}; overflow: hidden; transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1);"
							>
								<div class="border-t border-border bg-card">
									<div class="max-h-96 overflow-y-auto">
										{#each audioData.chapters as chapter, index}
											<div class="p-3 border-b border-border last:border-b-0 hover:bg-accent/30 transition-colors">
												<div class="flex items-center justify-between gap-3">
													<div class="flex items-center gap-3 flex-1 min-w-0">
														<span class="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
															{chapter.number}
														</span>
														<div class="flex-1 min-w-0">
															<div class="font-medium text-foreground text-sm truncate">{chapter.title}</div>
															<div class="text-xs text-muted-foreground">{formatSize(chapter.size)}</div>
														</div>
													</div>
													<a
														href={chapter.url}
														download={chapter.filename}
														class="flex-shrink-0 px-3 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
													>
														<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
														</svg>
														Download
													</a>
												</div>
											</div>
										{/each}
									</div>
								</div>
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
							{#if audioData}
								<li>• Stream online anytime during download period</li>
							{/if}
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
