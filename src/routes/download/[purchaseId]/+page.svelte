<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';
	import { Zap, Download, Clock, Check, Headphones, Book, AlertCircle } from '@lucide/svelte';

	let loading = $state(true);
	let error = $state("");
	let downloadData = $state(null);
	let audioData = $state(null);
	let showPlayer = $state(false);
	let loadingAudio = $state(false);
	const publicUrl = "https://pub-ddafa2dcdc11430f8cec35c3cad0b062.r2.dev/";

	// Check if this is a summary
	const isSummary = $derived(audioData?.isSummary || downloadData?.purchase?.productType === 'SUMMARY');

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
			
			// Auto-load audio player if purchase includes audio
			if (data.purchase?.format === 'AUDIO' || data.purchase?.format === 'BUNDLE') {
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
			} else {
				console.error('Failed to load audio:', data.error);
			}
		} catch (err) {
			console.error("Audio load error:", err);
		} finally {
			loadingAudio = false;
		}
	}

	function copyToClipboard(text) {
		navigator.clipboard.writeText(text);
	}

	function formatDuration(seconds) {
		const mins = Math.floor(seconds / 60);
		return `${mins} min`;
	}
</script>

<svelte:head>
	<title>Download - Klarify</title>
</svelte:head>

<div class="min-h-screen bg-background py-8 md:py-12">
	<div class="max-w-4xl mx-auto px-1 sm:px-6 lg:px-8">
		{#if loading}
			<!-- Loading State -->
			<div class="text-center py-16">
				<div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
				<p class="text-muted-foreground">Generating download links...</p>
			</div>
		{:else if error}
			<!-- Error State -->
			<div class="text-center py-16">
				<div class="w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center">
					<AlertCircle class="w-8 h-8 text-destructive" />
				</div>
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
				<div class="inline-flex items-center justify-center w-16 h-16 {isSummary ? 'bg-amber-100 dark:bg-amber-500/20' : 'bg-green-100 dark:bg-green-500/20'} rounded-full mb-4">
					{#if isSummary}
						<Zap class="w-8 h-8 text-amber-600 dark:text-amber-400" />
					{:else}
						<Check class="w-8 h-8 text-green-600 dark:text-green-400" />
					{/if}
				</div>
				<h1 class="text-3xl font-bold text-foreground mb-2">
					{isSummary ? 'Summary Ready!' : 'Download Ready!'}
				</h1>
				<p class="text-muted-foreground">
					{#if isSummary}
						Listen to your summary now. Link expires in 1 hour.
					{:else}
						Your files are ready. Download links expire in 1 hour.
					{/if}
				</p>
			</div>

			<!-- Summary Info Banner -->
			{#if isSummary && audioData?.product}
				<div class="bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-lg p-5 mb-6">
					<div class="flex items-start gap-4">
						<Zap class="w-10 h-10 text-amber-600 dark:text-amber-400 flex-shrink-0" />
						<div class="flex-1">
							<h3 class="font-semibold text-foreground mb-2">Audio Summary</h3>
							<div class="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
								{#if audioData.product.duration}
									<span class="flex items-center gap-1">
										<Clock class="w-4 h-4" />
										{formatDuration(audioData.product.duration)}
									</span>
								{/if}
								{#if audioData.product.keyTakeaways}
									<span>📌 {audioData.product.keyTakeaways} key insights</span>
								{/if}
								<span>🎧 Single audio file</span>
							</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- Audio Player Section -->
			{#if showPlayer && audioData}
				<div class="mb-6 bg-card border border-border rounded-lg p-0.5">
					<div class="flex items-center justify-between mb-4">
						<h2 class="text-xl font-semibold text-foreground flex items-center gap-2">
							<Headphones class="w-6 h-6 {isSummary ? 'text-amber-600' : 'text-primary'}" />
							{isSummary ? 'Listen to Summary' : 'Listen Now'}
						</h2>
						{#if !isSummary && audioData.chapters}
							<span class="text-sm text-muted-foreground">
								{audioData.chapters.length} {audioData.chapters.length === 1 ? 'chapter' : 'chapters'}
							</span>
						{/if}
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
					class="w-full mb-6 p-5 {isSummary ? 'bg-gradient-to-r from-amber-500/10 to-amber-500/5 border-amber-500/20 hover:from-amber-500/20 hover:to-amber-500/10' : 'bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 hover:from-primary/20 hover:to-primary/10'} border rounded-lg transition-all text-left group"
				>
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-4">
							<div class="w-12 h-12 {isSummary ? 'bg-amber-500' : 'bg-primary'} rounded-lg flex items-center justify-center flex-shrink-0">
								<Headphones class="w-6 h-6 text-white" />
							</div>
							<div>
								<div class="font-semibold text-foreground text-lg mb-1">
									{isSummary ? 'Stream Audio Summary' : 'Stream Audiobook'}
								</div>
								<div class="text-sm text-muted-foreground">
									{isSummary ? 'Listen to the full summary online' : 'Listen online with chapter navigation'}
								</div>
							</div>
						</div>
						{#if loadingAudio}
							<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
						{:else}
							<div class="text-primary group-hover:translate-x-1 transition-transform">
								<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
								</svg>
							</div>
						{/if}
					</div>
				</button>
			{/if}

			<!-- Download Links Section -->
			<div class="bg-card border border-border rounded-lg p-6 mb-6">
				<h2 class="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
					<Download class="w-6 h-6" />
					Download Files
				</h2>
				
				<div class="space-y-4">
					{#if downloadData.urls.pdf}
						<div class="p-4 bg-gradient-to-r from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-lg">
							<div class="flex items-center justify-between mb-3">
								<div class="flex items-center gap-3">
									<div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
										<Book class="w-5 h-5 text-white" />
									</div>
									<div>
										<div class="font-semibold text-foreground">PDF eBook</div>
										<div class="text-xs text-muted-foreground">Read on any device</div>
									</div>
								</div>
							</div>
							<div class="flex gap-2">
								<a
									href={downloadData.urls.pdf}
									download
									class="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium text-center rounded-lg transition-colors flex items-center justify-center gap-2"
								>
									<Download class="w-4 h-4" />
									Download PDF
								</a>
								<button
									onclick={() => copyToClipboard(downloadData.urls.pdf)}
									class="px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
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
						<div class="p-4 bg-gradient-to-r {isSummary ? 'from-amber-500/10 to-amber-500/5 border-amber-500/20' : 'from-purple-500/10 to-purple-500/5 border-purple-500/20'} border rounded-lg">
							<div class="flex items-center justify-between mb-3">
								<div class="flex items-center gap-3">
									<div class="w-10 h-10 {isSummary ? 'bg-amber-500' : 'bg-purple-500'} rounded-lg flex items-center justify-center">
										<Headphones class="w-5 h-5 text-white" />
									</div>
									<div>
										<div class="font-semibold text-foreground">
											{isSummary ? 'Audio Summary' : 'Audiobook'}
										</div>
										<div class="text-xs text-muted-foreground">
											{isSummary ? 'MP3/Opus format' : 'Complete audio content'}
										</div>
									</div>
								</div>
							</div>
							<div class="flex gap-2">
								<a
									href={downloadData.urls.audio}
									download
									class="flex-1 px-4 py-2.5 {isSummary ? 'bg-amber-500 hover:bg-amber-600' : 'bg-purple-500 hover:bg-purple-600'} text-white font-medium text-center rounded-lg transition-colors flex items-center justify-center gap-2"
								>
									<Download class="w-4 h-4" />
									Download Audio
								</a>
								<button
									onclick={() => copyToClipboard(downloadData.urls.audio)}
									class="px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
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
			<div class="bg-gradient-to-br {isSummary ? 'from-amber-500/10 to-background border-amber-500/20' : 'from-primary/10 to-background border-primary/20'} border rounded-lg p-6 mb-6">
				<div class="flex items-start gap-3">
					<svg class="w-6 h-6 {isSummary ? 'text-amber-600' : 'text-primary'} flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<div class="text-sm">
						<h3 class="font-semibold text-foreground mb-2">Download Information</h3>
						<ul class="space-y-1.5 text-muted-foreground">
							<li class="flex items-start gap-2">
								<span class="{isSummary ? 'text-amber-600' : 'text-primary'}">•</span>
								<span>Downloads remaining: <strong class="text-foreground">{downloadData.purchase.maxDownloads - downloadData.purchase.downloadCount}</strong></span>
							</li>
							<li class="flex items-start gap-2">
								<span class="{isSummary ? 'text-amber-600' : 'text-primary'}">•</span>
								<span>Links expire in <strong class="text-foreground">1 hour</strong></span>
							</li>
							<li class="flex items-start gap-2">
								<span class="{isSummary ? 'text-amber-600' : 'text-primary'}">•</span>
								<span>Save files to your device for offline access</span>
							</li>
							{#if isSummary}
								<li class="flex items-start gap-2">
									<span class="text-amber-600">•</span>
									<span><strong class="text-foreground">Summary audio</strong> is a single file - perfect for quick learning</span>
								</li>
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
					← Back to Library
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
