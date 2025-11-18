<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';
	import { Zap, Download, Clock, Check, Headphones, Book, AlertCircle, Loader2, ChevronDown, Copy, CheckCircle } from '@lucide/svelte';

	let { data } = $props();
	
	// Worker URL - update with your deployed worker
const WORKER_URL = import.meta.env.DEV 
  ? "http://localhost:8787"  // Local worker
  : "https://klarify-audio-worker.ronnlats.workers.dev";  // Production worker
	const publicUrl = "https://pub-ddafa2dcdc11430f8cec35c3cad0b062.r2.dev/";

	// State
	let downloadUrls = $state(null);
	let audioData = $state(null);
	let showPlayer = $state(false);
	let loadingDownloadLinks = $state(false);
	let loadingAudio = $state(false);
	let downloadError = $state("");
	
	// Complete audiobook download state
	let isDownloadingComplete = $state(false);
	let downloadProgress = $state(0);
	
	// Chapter accordion state
	let showChapters = $state(false);
	let copiedChapter = $state(null);

	// Computed
	const isSummary = $derived(data.purchase.product.type === 'SUMMARY');
	const hasAudio = $derived(data.purchase.format === 'AUDIO' || data.purchase.format === 'BUNDLE');
	const hasPdf = $derived(data.purchase.format === 'PDF' || data.purchase.format === 'BUNDLE');
	const hasMultipleChapters = $derived(audioData && audioData.chapters && audioData.chapters.length > 1);

	// Auto-load audio player and download links
	onMount(() => {
		if (hasAudio) {
			loadAudioPlayer();
		}
		if (data.downloadStatus.canDownload) {
			generateDownloadLinks();
		}
	});

	/**
	 * Load audio player data (for streaming)
	 */
	async function loadAudioPlayer() {
		if (audioData || loadingAudio) return;
		
		loadingAudio = true;
		try {
			const response = await fetch(`/api/audio/stream/${data.purchase.id}`);
			const result = await response.json();

			if (response.ok) {
				audioData = result;
				showPlayer = true;
			} else {
				console.error('Failed to load audio:', result.error);
			}
		} catch (err) {
			console.error("Audio load error:", err);
		} finally {
			loadingAudio = false;
		}
	}

	/**
	 * Generate download links
	 */
	async function generateDownloadLinks() {
		if (downloadUrls || loadingDownloadLinks) return;
		
		loadingDownloadLinks = true;
		downloadError = "";
		
		try {
			const response = await fetch(`/download/${data.purchase.id}`);
			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to generate download links');
			}

			downloadUrls = result.urls;
		} catch (err) {
			console.error('Download link error:', err);
			downloadError = err.message;
		} finally {
			loadingDownloadLinks = false;
		}
	}

	/**
	 * Download complete audiobook via worker (multi-chapter only)
	 * This triggers immediate streaming - NO download link!
	 */
	async function downloadCompleteAudiobook() {
		if (!audioData || isDownloadingComplete) return;
		
		isDownloadingComplete = true;
		downloadProgress = 0;
		downloadError = "";

		try {
			console.log('📦 Starting complete audiobook download...');
			
			const response = await fetch(`${WORKER_URL}/concat-audio`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					chapters: audioData.chapters,
					token: data.purchase.downloadToken,
					productSlug: data.purchase.product.slug,
					format: audioData.chapters[0].url.split('.').pop().split('?')[0],
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Download failed');
			}

			// Stream the response
			const reader = response.body.getReader();
			const contentLength = +response.headers.get('Content-Length') || 0;
			
			let receivedLength = 0;
			const chunks = [];

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				
				chunks.push(value);
				receivedLength += value.length;
				
				if (contentLength > 0) {
					downloadProgress = Math.round((receivedLength / contentLength) * 100);
				} else {
					// Estimate progress based on received data
					downloadProgress = Math.min(90, Math.round(receivedLength / 100000));
				}
			}

			downloadProgress = 100;

			// Create blob and trigger browser download
			const blob = new Blob(chunks);
			const url = URL.createObjectURL(blob);
			
			const extension = audioData.chapters[0].url.split('.').pop().split('?')[0];
			const filename = `${data.purchase.product.slug}-complete.${extension}`;
			
			const link = document.createElement('a');
			link.href = url;
			link.download = filename;
			link.click();
			
			URL.revokeObjectURL(url);
			
			console.log('✅ Complete audiobook downloaded');
			
			// Record download
			await recordDownload();
			
		} catch (error) {
			console.error('❌ Download error:', error);
			downloadError = error.message;
		} finally {
			setTimeout(() => {
				isDownloadingComplete = false;
				downloadProgress = 0;
			}, 2000);
		}
	}

	/**
	 * Download single file (PDF or single-chapter audio or summary)
	 */
	async function downloadSingleFile(url, filename) {
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		link.click();
		
		await recordDownload();
	}

	/**
	 * Download individual chapter
	 */
	async function downloadChapter(chapter) {
		window.open(chapter.url, '_blank');
		await recordDownload();
	}

	/**
	 * Copy chapter link to clipboard
	 */
	async function copyChapterLink(chapter) {
		try {
			await navigator.clipboard.writeText(chapter.url);
			copiedChapter = chapter.number;
			setTimeout(() => copiedChapter = null, 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}

	/**
	 * Record download in database
	 */
	async function recordDownload() {
		try {
			await fetch(`/api/record-download`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ purchaseId: data.purchase.id }),
			});
		} catch (error) {
			console.error('Failed to record download:', error);
		}
	}

	/**
	 * Format file size
	 */
	function formatSize(bytes) {
		if (!bytes) return '';
		const mb = bytes / (1024 * 1024);
		return `${mb.toFixed(1)} MB`;
	}

	/**
	 * Format duration
	 */
	function formatDuration(seconds) {
		const mins = Math.floor(seconds / 60);
		return `${mins} min`;
	}
</script>

<svelte:head>
	<title>Download {data.purchase.product.title} - Klarify</title>
</svelte:head>

<div class="min-h-screen bg-background py-8 md:py-12">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
		<!-- Header -->
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
				{#if data.downloadStatus.canDownload}
					{isSummary ? 'Listen to your summary now.' : 'Your files are ready.'}
				{:else}
					{data.downloadStatus.expired ? 'Download period expired' : 'Download limit reached'}
				{/if}
			</p>
		</div>

		{#if !data.downloadStatus.canDownload}
			<!-- Cannot Download -->
			<div class="bg-destructive/10 border border-destructive/20 rounded-lg p-6 mb-8">
				<div class="flex items-start gap-4">
					<AlertCircle class="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
					<div>
						<h3 class="text-lg font-semibold text-destructive mb-2">Download Not Available</h3>
						<p class="text-muted-foreground">
							{#if data.downloadStatus.expired}
								This download has expired (48 hours from purchase).
							{:else if data.downloadStatus.limitReached}
								You've reached the maximum number of downloads (3).
							{:else}
								Payment not completed or download unavailable.
							{/if}
						</p>
					</div>
				</div>
			</div>

			<a href="/my-library" class="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors">
				← Back to Library
			</a>
		{:else}
			<!-- Can Download -->

			<!-- Summary Info Banner -->
			{#if isSummary && data.purchase.product.keyTakeaways}
				<div class="bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-lg p-5 mb-6">
					<div class="flex items-start gap-4">
						<Zap class="w-10 h-10 text-amber-600 dark:text-amber-400 flex-shrink-0" />
						<div class="flex-1">
							<h3 class="font-semibold text-foreground mb-2">Audio Summary</h3>
							<div class="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
								{#if data.purchase.product.duration}
									<span class="flex items-center gap-1">
										<Clock class="w-4 h-4" />
										{formatDuration(data.purchase.product.duration)}
									</span>
								{/if}
								<span>📌 {data.purchase.product.keyTakeaways} key insights</span>
								<span>🎧 Single audio file</span>
							</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- Audio Player Section -->
			{#if showPlayer && audioData}
				<div class="mb-6 bg-card border border-border rounded-lg p-0.5">
					<div class="flex items-center justify-between p-4 pb-2">
						<h2 class="text-xl font-semibold text-foreground flex items-center gap-2">
							<Headphones class="w-6 h-6 {isSummary ? 'text-amber-600' : 'text-primary'}" />
							{isSummary ? 'Listen to Summary' : 'Listen Now'}
						</h2>
						{#if hasMultipleChapters}
							<span class="text-sm text-muted-foreground">
								{audioData.chapters.length} chapters
							</span>
						{/if}
					</div>
					<AudioPlayer 
						chapters={audioData.chapters}
						productTitle={data.purchase.product.title}
						productAuthor={data.purchase.product.author}
						coverImage={data.purchase.product.coverImage}
						{publicUrl}
					/>
				</div>
			{:else if hasAudio && !showPlayer && loadingAudio}
				<div class="mb-6 p-8 bg-card border border-border rounded-lg text-center">
					<Loader2 class="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
					<p class="text-muted-foreground">Loading audio player...</p>
				</div>
			{/if}

			<!-- Download Section -->
			<div class="bg-card border border-border rounded-lg p-6 mb-6">
				<h2 class="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
					<Download class="w-6 h-6" />
					Download Options
				</h2>

				{#if loadingDownloadLinks}
					<div class="text-center py-8">
						<Loader2 class="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
						<p class="text-muted-foreground">Generating secure download links...</p>
					</div>
				{:else if downloadError && !downloadUrls}
					<div class="p-4 bg-destructive/10 border border-destructive/20 rounded-lg mb-4">
						<div class="flex items-start gap-3">
							<AlertCircle class="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
							<div>
								<div class="font-medium text-destructive mb-1">Failed to Generate Links</div>
								<div class="text-sm text-muted-foreground">{downloadError}</div>
							</div>
						</div>
					</div>
					<button
						onclick={() => { downloadUrls = null; generateDownloadLinks(); }}
						class="w-full px-6 py-3 bg-secondary text-secondary-foreground font-medium rounded-lg hover:bg-secondary/80 transition-colors"
					>
						Try Again
					</button>
				{:else}
					<div class="space-y-4">
						<!-- PDF Download -->
						{#if hasPdf && downloadUrls?.pdf}
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
								<button
									onclick={() => downloadSingleFile(downloadUrls.pdf, `${data.purchase.product.slug}.pdf`)}
									class="w-full px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
								>
									<Download class="w-4 h-4" />
									Download PDF
								</button>
							</div>
						{/if}

						<!-- Complete Audiobook (Multi-chapter only) -->
						{#if hasMultipleChapters}
							<div class="p-4 bg-gradient-to-r from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-lg">
								<div class="flex items-center justify-between mb-3">
									<div class="flex items-center gap-3">
										<div class="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
											<Headphones class="w-5 h-5 text-white" />
										</div>
										<div>
											<div class="font-semibold text-foreground">
												Complete Audiobook ({audioData.chapters.length} chapters)
											</div>
											<div class="text-xs text-muted-foreground">
												{#if isDownloadingComplete}
													Combining all chapters... {downloadProgress}%
												{:else}
													All chapters combined into one file (~30 seconds)
												{/if}
											</div>
										</div>
									</div>
								</div>
								<button
									onclick={downloadCompleteAudiobook}
									disabled={isDownloadingComplete}
									class="w-full px-4 py-2.5 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
								>
									{#if isDownloadingComplete}
										<Loader2 class="w-4 h-4 animate-spin" />
										{downloadProgress < 100 ? `Combining... ${downloadProgress}%` : 'Starting download...'}
									{:else}
										<Download class="w-4 h-4" />
										Download Complete Audiobook
									{/if}
								</button>
							</div>

							<!-- Individual Chapters Accordion -->
							<div class="border border-border rounded-lg overflow-hidden">
								<button
									onclick={() => showChapters = !showChapters}
									class="w-full p-4 bg-secondary hover:bg-secondary/80 transition-colors flex items-center justify-between"
								>
									<div class="flex items-center gap-3">
										<div class="w-8 h-8 bg-muted rounded flex items-center justify-center">
											<Book class="w-4 h-4 text-foreground" />
										</div>
										<div class="text-left">
											<div class="font-semibold text-foreground">Download Individual Chapters</div>
											<div class="text-xs text-muted-foreground">
												Instant downloads for each chapter
											</div>
										</div>
									</div>
									<ChevronDown class="w-5 h-5 text-muted-foreground transition-transform {showChapters ? 'rotate-180' : ''}" />
								</button>

								{#if showChapters}
									<div class="border-t border-border">
										<div class="p-4 bg-muted/30">
											<p class="text-xs text-muted-foreground mb-4">
												💡 Tip: Individual chapters download instantly. Use this if you want specific chapters or if the complete download fails.
											</p>
											<div class="space-y-2 max-h-96 overflow-y-auto">
												{#each audioData.chapters as chapter}
													<div class="flex items-center gap-3 p-3 bg-card rounded-lg hover:bg-accent transition-colors">
														<div class="flex-shrink-0 w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
															<span class="text-xs font-semibold text-primary">{chapter.number}</span>
														</div>
														<div class="flex-1 min-w-0">
															<div class="text-sm font-medium text-foreground truncate">
																{chapter.title}
															</div>
															<div class="text-xs text-muted-foreground">
																{formatSize(chapter.size)}
															</div>
														</div>
														<div class="flex gap-2">
															<button
																onclick={() => downloadChapter(chapter)}
																class="px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium rounded transition-colors flex items-center gap-1"
																title="Download chapter"
															>
																<Download class="w-3 h-3" />
																Download
															</button>
															<button
																onclick={() => copyChapterLink(chapter)}
																class="px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-medium rounded transition-colors"
																title="Copy download link"
															>
																{#if copiedChapter === chapter.number}
																	<CheckCircle class="w-3 h-3 text-green-600" />
																{:else}
																	<Copy class="w-3 h-3" />
																{/if}
															</button>
														</div>
													</div>
												{/each}
											</div>
										</div>
									</div>
								{/if}
							</div>
						{:else if hasAudio && downloadUrls?.audio}
							<!-- Single Audio File (Summary or single-chapter audiobook) -->
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
												Single audio file - instant download
											</div>
										</div>
									</div>
								</div>
								<button
									onclick={() => downloadSingleFile(downloadUrls.audio, `${data.purchase.product.slug}.opus`)}
									class="w-full px-4 py-2.5 {isSummary ? 'bg-amber-500 hover:bg-amber-600' : 'bg-purple-500 hover:bg-purple-600'} text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
								>
									<Download class="w-4 h-4" />
									Download Audio
								</button>
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Download Info -->
			<div class="bg-gradient-to-br from-primary/10 to-background border border-primary/20 rounded-lg p-6 mb-6">
				<div class="flex items-start gap-3">
					<svg class="w-6 h-6 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<div class="text-sm">
						<h3 class="font-semibold text-foreground mb-2">Download Information</h3>
						<ul class="space-y-1.5 text-muted-foreground">
							<li>• Downloads remaining: <strong class="text-foreground">{data.downloadStatus.downloadsRemaining}</strong></li>
							<li>• Links expire in <strong class="text-foreground">1 hour</strong></li>
							<li>• Save files to your device for offline access</li>
							{#if hasMultipleChapters}
								<li>• <strong class="text-foreground">Complete audiobook</strong>: All chapters combined (takes ~30s)</li>
								<li>• <strong class="text-foreground">Individual chapters</strong>: Instant downloads</li>
							{/if}
						</ul>
					</div>
				</div>
			</div>

			<!-- Actions -->
			<div class="flex flex-col sm:flex-row gap-4">
				<a href="/my-library" class="flex-1 px-6 py-3 bg-secondary text-secondary-foreground font-medium text-center rounded-lg hover:bg-secondary/80 transition-colors">
					← Back to Library
				</a>
				<a href="/products" class="flex-1 px-6 py-3 bg-primary text-primary-foreground font-semibold text-center rounded-lg hover:bg-primary/90 transition-colors">
					Browse More Products
				</a>
			</div>
		{/if}
	</div>
</div>
