<script>
	import { invalidateAll } from "$app/navigation";
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { Zap, Clock, BookOpen, Headphones, ChevronRight, Star, Check, Package, Share2, Heart, Download } from '@lucide/svelte';
	import { calculatePrice } from '$lib/utils/pricing';
	
	const publicUrl = "https://pub-ddafa2dcdc11430f8cec35c3cad0b062.r2.dev/";

	let { data } = $props();
	
	const hasType = (type) => data.product.type.includes(type);
	
	const isSummary = hasType('SUMMARY');
	const isAudiobook = hasType('AUDIOBOOK');
	const isEbook = hasType('EBOOK');
	const canBuyBundle = isEbook && isAudiobook;
	
	const BUNDLE_DISCOUNT_PERCENT = 15;
	
	const calculateBundlePrice = () => {
		const fullPrice = data.product.pdfPrice + data.product.audioPrice;
		if (data.product.bundlePrice) return data.product.bundlePrice;
		return Math.round(fullPrice * (1 - BUNDLE_DISCOUNT_PERCENT / 100));
	};
	
	const bundlePrice = canBuyBundle ? calculateBundlePrice() : 0;
	
	let selectedFormat = $state(
		canBuyBundle ? "BUNDLE" :
		isSummary ? "SUMMARY" :
		isAudiobook ? "AUDIO" :
		isEbook ? "PDF" : null
	);

	let addingToCart = $state(false);
	let cartMessage = $state("");
	let isFavorite = $state(false);

	function getPrice() {
		if (selectedFormat === "SUMMARY") {
			return data.product.summaryPrice || data.product.audioPrice;
		}
		if (selectedFormat === "BUNDLE") {
			return bundlePrice;
		}
		if (selectedFormat === "AUDIO") return data.product.audioPrice;
		return data.product.pdfPrice;
	}
	
	function getSavings() {
		if (selectedFormat === "BUNDLE") {
			const fullPrice = data.product.pdfPrice + data.product.audioPrice;
			return fullPrice - bundlePrice;
		}
		return 0;
	}

	async function addToCart() {
		if (addingToCart || !selectedFormat) return;

		addingToCart = true;
		cartMessage = "";

		try {
			const response = await fetch("/api/cart", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					productId: data.product.id,
					format: selectedFormat
				})
			});

			const result = await response.json();

			if (response.ok) {
				toast.success('Added to cart!', {
					description: `${data.product.title} - ${selectedFormat}`
				});
				await invalidateAll();
			} else {
				toast.error('Failed to add to cart', {
					description: result.error
				});
			}
		} catch (error) {
			console.error("Add to cart error:", error);
			toast.error('Failed to add to cart');
		} finally {
			addingToCart = false;
		}
	}

	async function shareProduct() {
		const shareData = {
			title: data.product.title,
			text: `Check out "${data.product.title}" by ${data.product.author} on Klarify!`,
			url: window.location.href
		};

		try {
			if (navigator.share) {
				await navigator.share(shareData);
				toast.success('Shared successfully!');
			} else {
				// Fallback: copy to clipboard
				await navigator.clipboard.writeText(window.location.href);
				toast.success('Link copied to clipboard!');
			}
		} catch (error) {
			if (error.name !== 'AbortError') {
				console.error('Share error:', error);
			}
		}
	}

	function toggleFavorite() {
		isFavorite = !isFavorite;
		toast.success(isFavorite ? 'Added to favorites' : 'Removed from favorites');
	}

	function formatDuration(seconds) {
		if (!seconds) return null;
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		if (hours > 0) return `${hours}h ${minutes}m`;
		return `${minutes}m`;
	}
	
	const displayDuration = $derived.by(() => {
		if (selectedFormat === 'SUMMARY' && data.product.summaryDuration) {
			return data.product.summaryDuration;
		}
		return data.product.duration;
	});

	// Get pricing
	const pricing = $derived(calculatePrice(data.product, selectedFormat));
</script>

<svelte:head>
	<title>{data.product.title} - Klarify</title>
	<meta name="description" content={data.product.description} />
	<meta property="og:title" content={data.product.title} />
	<meta property="og:description" content={data.product.description} />
	<meta property="og:image" content={publicUrl + data.product.coverImage} />
</svelte:head>

<div class="min-h-screen bg-background">
	<section class="bg-card border-b border-border">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
			<div class="grid grid-cols-1 md:grid-cols-5 gap-8">
				<div class="md:col-span-2">
					<div class="sticky top-24">
						<div class="aspect-[2/3] bg-muted rounded-lg overflow-hidden shadow-lg relative group">
							<img 
								src={publicUrl + data.product.coverImage} 
								alt="{data.product.title} cover"
								class="w-full h-full object-cover"
							/>
							
							<!-- Action buttons overlay -->
							<div class="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
								<button
									onclick={shareProduct}
									class="p-2 bg-white/90 dark:bg-black/90 rounded-full shadow-lg hover:scale-110 transition-transform"
									title="Share"
								>
									<Share2 class="w-5 h-5" />
								</button>
								<button
									onclick={toggleFavorite}
									class="p-2 bg-white/90 dark:bg-black/90 rounded-full shadow-lg hover:scale-110 transition-transform"
									title="Add to favorites"
								>
									<Heart class="w-5 h-5 {isFavorite ? 'fill-red-500 text-red-500' : ''}" />
								</button>
							</div>
							
							<div class="absolute top-4 left-4 flex flex-col gap-2">
								{#if isSummary}
									<span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-sm font-semibold rounded-lg shadow-lg">
										<Zap class="w-4 h-4" />
										Audio Summary
									</span>
								{/if}
								{#if canBuyBundle}
									<span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-sm font-semibold rounded-lg shadow-lg">
										<Package class="w-4 h-4" />
										{BUNDLE_DISCOUNT_PERCENT}% OFF Bundle
									</span>
								{/if}
								{#if pricing.isFree}
									<span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-sm font-bold rounded-lg shadow-lg animate-pulse">
										🎁 FREE
									</span>
								{/if}
							</div>
						</div>
						
						<!-- Quick actions -->
						<div class="mt-4 flex gap-2">
							<button
								onclick={shareProduct}
								class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
							>
								<Share2 class="w-4 h-4" />
								<span class="text-sm">Share</span>
							</button>
							<button
								onclick={toggleFavorite}
								class="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
								title="Add to favorites"
							>
								<Heart class="w-5 h-5 {isFavorite ? 'fill-red-500 text-red-500' : ''}" />
							</button>
						</div>
					</div>
				</div>

				<div class="md:col-span-3 space-y-6">
					<!-- Breadcrumbs -->
					<nav class="flex items-center gap-2 text-sm text-muted-foreground">
						<a href="/products" class="hover:text-foreground">Products</a>
						<ChevronRight class="w-4 h-4" />
						{#if isSummary}
							<a href="/products?type=SUMMARY" class="hover:text-foreground">Summaries</a>
							<ChevronRight class="w-4 h-4" />
						{/if}
						<span class="text-foreground truncate">{data.product.title}</span>
					</nav>

					<!-- Product Info (rest of your existing code...) -->
					<!-- Your existing product details code remains the same -->
					<div>
						<h1 class="text-3xl md:text-4xl font-bold text-foreground mb-2">
							{data.product.title}
						</h1>
						
						<p class="text-lg text-muted-foreground mb-4">
							by <span class="text-foreground font-medium">{data.product.author}</span>
						</p>

						<!-- Downloads counter -->
						<div class="flex items-center gap-4 text-sm text-muted-foreground">
							<div class="flex items-center gap-1">
								<Download class="w-4 h-4" />
								<span>{data.product.downloads.toLocaleString()} downloads</span>
							</div>
							{#if data.product.rating > 0}
								<div class="flex items-center gap-1">
									<Star class="w-5 h-5 text-yellow-500 fill-current" />
									<span class="font-medium">{data.product.rating.toFixed(1)}</span>
									<span>({data.product.reviewCount})</span>
								</div>
							{/if}
						</div>
					</div>

					<!-- Rest of your product page code -->
				</div>
			</div>
		</div>
	</section>
</div>
