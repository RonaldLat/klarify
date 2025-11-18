<script>
	import { onMount } from 'svelte';
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';
	import { 
		Zap, Download, Clock, Check, Headphones, Book, 
		AlertCircle, Loader2, ChevronDown, Copy, CheckCircle 
	} from '@lucide/svelte';

	let { data } = $props();

	// CORRECT WORKER URL — DO NOT CHANGE
const WORKER_URL = import.meta.env.DEV 
  ? "http://localhost:8787"  // Local worker
  : "https://klarify-audio-worker.ronnlats.workers.dev";  // Production worker


console.log('🎯 Worker URL:', WORKER_URL);  // Debug log
	const publicUrl = "https://pub-ddafa2dcdc11430f8cec35c3cad0b062.r2.dev/";

	// State
	let downloadUrls = $state(null);
	let audioData = $state(null);
	let showPlayer = $state(false);
	let loadingDownloadLinks = $state(false);
	let loadingAudio = $state(false);
	let downloadError = $state("");
	let workerError = $state(null);

	// Complete audiobook
	let isDownloadingComplete = $state(false);
	let downloadProgress = $state(0);

	// UI
	let showChapters = $state(false);
	let copiedChapter = $state(null);

	// Computed
	const isSummary = $derived(data.purchase.product.type === 'SUMMARY');
	const hasAudio = $derived(['AUDIO', 'BUNDLE'].includes(data.purchase.format));
	const hasPdf = $derived(['PDF', 'BUNDLE'].includes(data.purchase.format));
	const hasMultipleChapters = $derived(audioData?.chapters?.length > 1);

	onMount(() => {
		console.log('Download page loaded');
		console.log('Purchase ID:', data.purchase.id);
		console.log('Product:', data.purchase.product.title);
		console.log('Token:', data.purchase.downloadToken);
		console.log('Worker URL:', WORKER_URL);

		if (hasAudio) loadAudioPlayer();
		if (data.downloadStatus.canDownload) generateDownloadLinks();
	});

	async function loadAudioPlayer() {
		if (audioData || loadingAudio) return;
		loadingAudio = true;

		try {
			const res = await fetch(`/api/audio/stream/${data.purchase.id}`);
			const json = await res.json();

			if (res.ok) {
				audioData = json;
				showPlayer = true;
				console.log('Audio player ready:', json.chapters.length, 'chapters');
			} else {
				console.error('Audio stream failed:', json);
			}
		} catch (e) {
			console.error('Audio load error:', e);
		} finally {
			loadingAudio = false;
		}
	}

	async function generateDownloadLinks() {
		if (downloadUrls || loadingDownloadLinks) return;
		loadingDownloadLinks = true;
		downloadError = "";

		try {
			const res = await fetch(`/download/${data.purchase.id}`);
			const text = await res.text();

			let result;
			try { result = JSON.parse(text); } 
			catch { throw new Error('Server returned invalid response'); }

			if (!res.ok) throw new Error(result.error || 'Unknown error');

			downloadUrls = result.urls;
			console.log('Download links ready');
		} catch (e) {
			console.error('Link generation failed:', e);
			downloadError = e.message;
		} finally {
			loadingDownloadLinks = false;
		}
	}

	async function downloadCompleteAudiobook() {
		if (!audioData || isDownloadingComplete) return;

		isDownloadingComplete = true;
		downloadProgress = 0;
		workerError = null;
		downloadError = "";

		try {
			console.log('Starting complete audiobook download...');

			const payload = {
				chapters: audioData.chapters,
				token: data.purchase.downloadToken,
				productSlug: data.purchase.product.slug,
				format: audioData.chapters[0].url.split('.').pop().split('?')[0]
			};

			const res = await fetch(`${WORKER_URL}/concat-audio`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (!res.ok) {
				const text = await res.text();
				let err;
				try { err = JSON.parse(text); } catch { err = { error: text }; }
				workerError = { status: res.status, message: err.error || 'Worker error' };
				throw new Error(err.error || 'Download failed');
			}

			const reader = res.body.getReader();
			let received = 0;
			const chunks = [];

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				chunks.push(value);
				received += value.length;
				downloadProgress = Math.min(99, Math.round(received / 100000));
			}

			downloadProgress = 100;

			const blob = new Blob(chunks);
			const url = URL.createObjectURL(blob);
			const filename = `${payload.productSlug}-complete.${payload.format}`;

			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			a.click();
			URL.revokeObjectURL(url);

			console.log('Complete audiobook saved:', filename);
			await recordDownload();

		} catch (e) {
			console.error('Download failed:', e);
			downloadError = e.message;
		} finally {
			setTimeout(() => {
				isDownloadingComplete = false;
				downloadProgress = 0;
			}, 2000);
		}
	}

	async function downloadSingleFile(url, filename) {
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		await recordDownload();
	}

	async function downloadChapter(chapter) {
		window.open(chapter.url, '_blank');
		await recordDownload();
	}

	async function copyChapterLink(chapter) {
		await navigator.clipboard.writeText(chapter.url);
		copiedChapter = chapter.number;
		setTimeout(() => copiedChapter = null, 2000);
	}

	async function recordDownload() {
		try {
			await fetch('/api/record-download', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ purchaseId: data.purchase.id })
			});
		} catch (e) {
			console.error('Record download failed:', e);
		}
	}

	function formatSize(bytes) {
		if (!bytes) return '';
		return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
	}

	function formatDuration(seconds) {
		return `${Math.floor(seconds / 60)} min`;
	}
</script>

<svelte:head>
	<title>Download {data.purchase.product.title} - Klarify</title>
</svelte:head>

<!-- The full HTML from the previous working version goes here -->
<!-- (Everything below is identical to the last working version you had) -->

<div class="min-h-screen bg-background py-8 md:py-12">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

		{#if import.meta.env.DEV}
			<div class="mb-6 p-4 bg-muted rounded-lg text-xs font-mono">
				<div>Purchase: {data.purchase.id}</div>
				<div>Product: {data.purchase.product.slug}</div>
				<div>Token: {data.purchase.downloadToken}</div>
				<div>Worker: {WORKER_URL}</div>
			</div>
		{/if}

		<!-- Header, player, download sections, etc. — exactly as in your last working version -->
		<!-- (Copy the full HTML from your previous working file here) -->

		<!-- For brevity, here's just the Complete Audiobook button with error display -->
		{#if hasMultipleChapters}
			<div class="p-6 bg-purple-500/5 border border-purple-500/20 rounded-lg mb-6">
				<h3 class="font-semibold mb-3">Complete Audiobook ({audioData.chapters.length} chapters)</h3>
				<button 
					onclick={downloadCompleteAudiobook} 
					disabled={isDownloadingComplete}
					class="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white rounded-lg font-medium flex items-center justify-center gap-2"
				>
					{#if isDownloadingComplete}
						<Loader2 class="w-5 h-5 animate-spin" />
						{downloadProgress}% 
					{:else}
						<Download class="w-5 h-5" />
						Download Complete Audiobook
					{/if}
				</button>

				{#if workerError}
					<div class="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded">
						<strong>Error {workerError.status}:</strong> {workerError.message}
					</div>
				{/if}
			</div>
		{/if}

		<!-- Paste the rest of your beautiful UI here from your last working version -->
	</div>
</div>
