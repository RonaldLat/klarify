<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';
	import { Zap, Download, Clock, Check, Headphones, Book, AlertCircle, Loader2, ChevronDown, Copy, CheckCircle, X } from '@lucide/svelte';

	let { data } = $props();
	
	const WORKER_URL = import.meta.env.DEV 
		? "http://localhost:8787" 
		: "https://klarify-audio-worker.ronnlats.workers.dev";
	
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
	let workerError = $state(null);
	let abortController = $state(null); // NEW: For canceling downloads
	
	// Chapter accordion state
	let showChapters = $state(false);
	let copiedChapter = $state(null);

	// Computed
	const isSummary = $derived(data.purchase.product.type === 'SUMMARY');
	const hasAudio = $derived(data.purchase.format === 'AUDIO' || data.purchase.format === 'BUNDLE');
	const hasPdf = $derived(data.purchase.format === 'PDF' || data.purchase.format === 'BUNDLE');
	const hasMultipleChapters = $derived(audioData && audioData.chapters && audioData.chapters.length > 1);

	onMount(() => {
		if (hasAudio) {
			loadAudioPlayer();
		}
		if (data.downloadStatus.canDownload) {
			generateDownloadLinks();
		}
	});

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
				console.error('❌ Failed to load audio:', result.error);
			}
		} catch (err) {
			console.error("❌ Audio load error:", err);
		} finally {
			loadingAudio = false;
		}
	}

	async function generateDownloadLinks() {
		if (downloadUrls || loadingDownloadLinks) return;
		
		loadingDownloadLinks = true;
		downloadError = "";
		
		try {
			const response = await fetch(`/download/${data.purchase.id}`);
			const text = await response.text();
			
			let result;
			try {
				result = JSON.parse(text);
			} catch (parseError) {
				throw new Error('Server returned invalid response');
			}

			if (!response.ok) {
				throw new Error(result.error || 'Failed to generate download links');
			}

			downloadUrls = result.urls;
		} catch (err) {
			console.error('❌ Download link error:', err);
			downloadError = err.message;
		} finally {
			loadingDownloadLinks = false;
		}
	}

	/**
	 * Download complete audiobook with cancel support
	 */
	async function downloadCompleteAudiobook() {
		if (!audioData || isDownloadingComplete) return;
		
		// Create new abort controller
		abortController = new AbortController();
		
		isDownloadingComplete = true;
		downloadProgress = 0;
		downloadError = "";
		workerError = null;

		try {
			const response = await fetch(`${WORKER_URL}/concat-audio`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					chapters: audioData.chapters,
					token: data.purchase.downloadToken,
					productSlug: data.purchase.product.slug,
					format: audioData.chapters[0].url.split('.').pop().split('?')[0],
				}),
				signal: abortController.signal, // Add abort signal
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
					downloadProgress = Math.min(90, Math.round(receivedLength / 100000));
				}
			}

			downloadProgress = 100;

			// Create blob and trigger download
			const blob = new Blob(chunks);
			const url = URL.createObjectURL(blob);
			
			const extension = audioData.chapters[0].url.split('.').pop().split('?')[0];
			const filename = `${data.purchase.product.slug}-complete.${extension}`;
			
			// IMPROVED: Force download instead of playing
			const link = document.createElement('a');
			link.href = url;
			link.download = filename;
			link.style.display = 'none';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			
			// Cleanup
			setTimeout(() => URL.revokeObjectURL(url), 100);
			
			// Record download
			await recordDownload();
			
		} catch (error) {
			if (error.name === 'AbortError') {
				console.log('⏹️ Download canceled by user');
				downloadError = 'Download canceled';
			} else {
				console.error('❌ Download error:', error);
				downloadError = error.message;
			}
		} finally {
			setTimeout(() => {
				isDownloadingComplete = false;
				downloadProgress = 0;
				abortController = null;
			}, 2000);
		}
	}

	/**
	 * Cancel ongoing download
	 */
	function cancelDownload() {
		if (abortController) {
			abortController.abort();
			abortController = null;
		}
	}

	/**
	 * Download single file with proper download attribute
	 */
	async function downloadSingleFile(url, filename) {
		// Create temporary link with download attribute
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		link.style.display = 'none';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		
		await recordDownload();
	}

	/**
	 * Download chapter with proper download prompt
	 */
	// async function downloadChapter(chapter) {
	// 	// Use download attribute to force download
	// 	const link = document.createElement('a');
	// 	link.href = chapter.url;
	// 	link.download = chapter.filename || `chapter-${chapter.number}.opus`;
	// 	link.style.display = 'none';
	// 	document.body.appendChild(link);
	// 	link.click();
	// 	document.body.removeChild(link);
	//
	// 	await recordDownload();
	// }
async function downloadChapter(chapter) {
  const downloadUrl = `/download/${data.purchase.id}?forceDownload=true&chapter=${chapter.number}`;

  const link = document.createElement("a");
  link.href = downloadUrl;
  // filename is set by the server, but we can hint it
  link.download = ""; 
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  await recordDownload();
}

	async function copyChapterLink(chapter) {
		try {
			await navigator.clipboard.writeText(chapter.url);
			copiedChapter = chapter.number;
			setTimeout(() => copiedChapter = null, 2000);
		} catch (err) {
			console.error('❌ Failed to copy:', err);
		}
	}

	async function recordDownload() {
		try {
			await fetch(`/api/record-download`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ purchaseId: data.purchase.id }),
			});
		} catch (error) {
			console.error('❌ Failed to record download:', error);
		}
	}

	function formatSize(bytes) {
		if (!bytes) return '';
		const mb = bytes / (1024 * 1024);
		return `${mb.toFixed(1)} MB`;
	}

	function formatDuration(seconds) {
		const mins = Math.floor(seconds / 60);
		return `${mins} min`;
	}
</script>

<svelte:head>
	<title>Download {data.purchase.product.title} - Klarify</title>
</svelte:head>

<div class="min-h-screen bg-background py-6 sm:py-8 md:py-12">
	<div class="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
		
		<!-- Header with better mobile spacing -->
		<div class="mb-6 sm:mb-8 text-center">
			<div class="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 {isSummary ? 'bg-amber-100 dark:bg-amber-500/20' : 'bg-green-100 dark:bg-green-500/20'} rounded-full mb-3 sm:mb-4">
				{#if isSummary}
					<Zap class="w-7 h-7 sm:w-8 sm:h-8 text-amber-600 dark:text-amber-400" />
				{:else}
					<Check class="w-7 h-7 sm:w-8 sm:h-8 text-green-600 dark:text-green-400" />
				{/if}
			</div>
			<h1 class="text-2xl sm:text-3xl font-bold text-foreground mb-2">
				{isSummary ? 'Summary Ready!' : 'Download Ready!'}
			</h1>
			<p class="text-sm sm:text-base text-muted-foreground px-4">
				{#if data.downloadStatus.canDownload}
					{isSummary ? 'Listen to your summary now.' : 'Your files are ready.'}
				{:else}
					{data.downloadStatus.expired ? 'Download period expired' : 'Download limit reached'}
				{/if}
			</p>
		</div>

		{#if !data.downloadStatus.canDownload}
			<!-- Cannot Download -->
			<div class="bg-destructive/10 border border-destructive/20 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
				<div class="flex items-start gap-3 sm:gap-4">
					<AlertCircle class="w-5 h-5 sm:w-6 sm:h-6 text-destructive flex-shrink-0 mt-0.5" />
					<div>
						<h3 class="text-base sm:text-lg font-semibold text-destructive mb-1 sm:mb-2">Download Not Available</h3>
						<p class="text-sm sm:text-base text-muted-foreground">
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

			<a href="/my-library" class="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors text-sm sm:text-base">
				← Back to Library
			</a>
		{:else}
			<!-- Can Download -->

			<!-- Summary Info Banner -->
			{#if isSummary && data.purchase.product.keyTakeaways}
				<div class="bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-lg p-4 sm:p-5 mb-4 sm:mb-6">
					<div class="flex items-start gap-3 sm:gap-4">
						<Zap class="w-8 h-8 sm:w-10 sm:h-10 text-amber-600 dark:text-amber-400 flex-shrink-0" />
						<div class="flex-1 min-w-0">
							<h3 class="font-semibold text-foreground mb-1 sm:mb-2 text-sm sm:text-base">Audio Summary</h3>
							<div class="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
								{#if data.purchase.product.duration}
									<span class="flex items-center gap-1">
										<Clock class="w-3 h-3 sm:w-4 sm:h-4" />
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
				<div class="mb-4 sm:mb-6 bg-card border border-border rounded-lg p-0.5">
					<div class="flex items-center justify-between p-3 sm:p-4 pb-2">
						<h2 class="text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2">
							<Headphones class="w-5 h-5 sm:w-6 sm:h-6 {isSummary ? 'text-amber-600' : 'text-primary'}" />
							<span class="text-sm sm:text-xl">{isSummary ? 'Listen to Summary' : 'Listen Now'}</span>
						</h2>
						{#if hasMultipleChapters}
							<span class="text-xs sm:text-sm text-muted-foreground">
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
			{/if}

			<!-- Download Section -->
			<div class="bg-card border border-border rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
				<h2 class="text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6 flex items-center gap-2">
					<Download class="w-5 h-5 sm:w-6 sm:h-6" />
					<span>Download Options</span>
				</h2>

				{#if loadingDownloadLinks}
					<div class="text-center py-6 sm:py-8">
						<Loader2 class="w-6 h-6 sm:w-8 sm:h-8 animate-spin mx-auto mb-3 sm:mb-4 text-primary" />
						<p class="text-sm sm:text-base text-muted-foreground">Generating secure download links...</p>
					</div>
				{:else if downloadError && !downloadUrls}
					<div class="p-3 sm:p-4 bg-destructive/10 border border-destructive/20 rounded-lg mb-4">
						<div class="flex items-start gap-2 sm:gap-3">
							<AlertCircle class="w-4 h-4 sm:w-5 sm:h-5 text-destructive flex-shrink-0 mt-0.5" />
							<div class="min-w-0">
								<div class="font-medium text-destructive mb-1 text-sm sm:text-base">Failed to Generate Links</div>
								<div class="text-xs sm:text-sm text-muted-foreground break-words">{downloadError}</div>
							</div>
						</div>
					</div>
				{:else}
					<div class="space-y-3 sm:space-y-4">
						<!-- PDF Download -->
						{#if hasPdf && downloadUrls?.pdf}
							<div class="p-3 sm:p-4 bg-gradient-to-r from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-lg">
								<div class="flex items-center gap-3 mb-3">
									<div class="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
										<Book class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
									</div>
									<div class="min-w-0 flex-1">
										<div class="font-semibold text-foreground text-sm sm:text-base">PDF eBook</div>
										<div class="text-xs text-muted-foreground">Read on any device</div>
									</div>
								</div>
								<button
									onclick={() => downloadSingleFile(downloadUrls.pdf, `${data.purchase.product.slug}.pdf`)}
									class="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
								>
									<Download class="w-4 h-4" />
									Download PDF
								</button>
							</div>
						{/if}

						<!-- Complete Audiobook (Multi-chapter) -->
						{#if hasMultipleChapters}
							<div class="p-3 sm:p-4 bg-gradient-to-r from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-lg">
								<div class="flex items-center gap-3 mb-3">
									<div class="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
										<Headphones class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
									</div>
									<div class="min-w-0 flex-1">
										<div class="font-semibold text-foreground text-sm sm:text-base">
											Complete Audiobook ({audioData.chapters.length} chapters)
										</div>
										<div class="text-xs text-muted-foreground">
											{#if isDownloadingComplete}
												Combining chapters... {downloadProgress}%
											{:else}
												All chapters combined (~30 seconds)
											{/if}
										</div>
									</div>
								</div>
								
								<div class="flex gap-2">
									<button
										onclick={downloadCompleteAudiobook}
										disabled={isDownloadingComplete}
										class="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
									>
										{#if isDownloadingComplete}
											<Loader2 class="w-4 h-4 animate-spin" />
											<span class="hidden sm:inline">{downloadProgress < 100 ? `${downloadProgress}%` : 'Starting...'}</span>
											<span class="sm:hidden">{downloadProgress}%</span>
										{:else}
											<Download class="w-4 h-4" />
											<span class="hidden sm:inline">Download Complete</span>
											<span class="sm:hidden">Download</span>
										{/if}
									</button>
									
									{#if isDownloadingComplete}
										<button
											onclick={cancelDownload}
											class="px-3 sm:px-4 py-2 sm:py-2.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
											title="Cancel download"
										>
											<X class="w-4 h-4" />
											<span class="hidden sm:inline">Cancel</span>
										</button>
									{/if}
								</div>
								
								{#if downloadError}
									<div class="mt-3 p-2 sm:p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
										<div class="flex items-start gap-2">
											<AlertCircle class="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
											<div class="text-xs sm:text-sm text-muted-foreground">{downloadError}</div>
										</div>
									</div>
								{/if}
							</div>

							<!-- Individual Chapters Accordion -->
							<div class="border border-border rounded-lg overflow-hidden">
								<button
									onclick={() => showChapters = !showChapters}
									class="w-full p-3 sm:p-4 bg-secondary hover:bg-secondary/80 transition-colors flex items-center justify-between"
								>
									<div class="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
										<div class="w-6 h-6 sm:w-8 sm:h-8 bg-muted rounded flex items-center justify-center flex-shrink-0">
											<Book class="w-3 h-3 sm:w-4 sm:h-4 text-foreground" />
										</div>
										<div class="text-left min-w-0">
											<div class="font-semibold text-foreground text-sm sm:text-base">Download Individual Chapters</div>
											<div class="text-xs text-muted-foreground hidden sm:block">
												Instant downloads for each chapter
											</div>
										</div>
									</div>
									<ChevronDown class="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground transition-transform flex-shrink-0 {showChapters ? 'rotate-180' : ''}" />
								</button>

								{#if showChapters}
									<div class="border-t border-border">
										<div class="p-3 sm:p-4 bg-muted/30">
											<p class="text-xs text-muted-foreground mb-3 sm:mb-4 px-1">
												💡 Tip: Individual chapters download instantly. Use this if you want specific chapters or if the complete download fails.
											</p>
											<div class="space-y-2 max-h-96 overflow-y-auto">
												{#each audioData.chapters as chapter}
													<div class="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-card rounded-lg hover:bg-accent transition-colors">
														<div class="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-primary/10 rounded flex items-center justify-center">
															<span class="text-xs font-semibold text-primary">{chapter.number}</span>
														</div>
														<div class="flex-1 min-w-0">
															<div class="text-xs sm:text-sm font-medium text-foreground truncate">
																{chapter.title}
															</div>
															<div class="text-xs text-muted-foreground">
																{formatSize(chapter.size)}
															</div>
														</div>
														<div class="flex gap-1 sm:gap-2 flex-shrink-0">
															<button
																onclick={() => downloadChapter(chapter)}
																class="px-2 sm:px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium rounded transition-colors flex items-center gap-1"
																title="Download chapter"
															>
																<Download class="w-3 h-3" />
																<span class="hidden sm:inline">Download</span>
															</button>
															<button
																onclick={() => copyChapterLink(chapter)}
																class="px-2 sm:px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-medium rounded transition-colors"
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
							<!-- Single Audio File -->
							<div class="p-3 sm:p-4 bg-gradient-to-r {isSummary ? 'from-amber-500/10 to-amber-500/5 border-amber-500/20' : 'from-purple-500/10 to-purple-500/5 border-purple-500/20'} border rounded-lg">
								<div class="flex items-center gap-3 mb-3">
									<div class="w-8 h-8 sm:w-10 sm:h-10 {isSummary ? 'bg-amber-500' : 'bg-purple-500'} rounded-lg flex items-center justify-center flex-shrink-0">
										<Headphones class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
									</div>
									<div class="min-w-0 flex-1">
										<div class="font-semibold text-foreground text-sm sm:text-base">
											{isSummary ? 'Audio Summary' : 'Audiobook'}
										</div>
										<div class="text-xs text-muted-foreground">
											Single audio file - instant download
										</div>
									</div>
								</div>
								<button
									onclick={() => downloadSingleFile(downloadUrls.audio, `${data.purchase.product.slug}.opus`)}
									class="w-full px-3 sm:px-4 py-2 sm:py-2.5 {isSummary ? 'bg-amber-500 hover:bg-amber-600' : 'bg-purple-500 hover:bg-purple-600'} text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
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
			<div class="bg-gradient-to-br from-primary/10 to-background border border-primary/20 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
				<div class="flex items-start gap-2 sm:gap-3">
					<svg class="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<div class="text-xs sm:text-sm min-w-0">
						<h3 class="font-semibold text-foreground mb-2">Download Information</h3>
						<ul class="space-y-1.5 text-muted-foreground">
							<li>• Downloads remaining: <strong class="text-foreground">{data.downloadStatus.downloadsRemaining}</strong></li>
							<li>• Links expire in <strong class="text-foreground">1 hour</strong></li>
							<li>• Save files to your device for offline access</li>
							{#if hasMultipleChapters}
								<li>• Complete audiobook takes ~30s to prepare</li>
								<li>• Individual chapters download instantly</li>
							{/if}
						</ul>
					</div>
				</div>
			</div>

			<!-- Actions -->
			<div class="flex flex-col sm:flex-row gap-3 sm:gap-4">
				<a href="/my-library" class="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-secondary text-secondary-foreground font-medium text-center rounded-lg hover:bg-secondary/80 transition-colors text-sm sm:text-base">
					← Back to Library
				</a>
				<a href="/products" class="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary text-primary-foreground font-semibold text-center rounded-lg hover:bg-primary/90 transition-colors text-sm sm:text-base">
					Browse More Products
				</a>
			</div>
		{/if}
	</div>
</div>
