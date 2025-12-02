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
	
	// NEW: Use server-side data for initial favorite state
	let isFavorite = $state(data.isFavorite);
	let togglingFavorite = $state(false);

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

	// NEW: Updated toggleFavorite with persistent storage
	async function toggleFavorite() {
		// Check if user is authenticated
		if (!data.isAuthenticated) {
			toast.error('Please login to save favorites');
			window.location.href = '/login';
			return;
		}

		if (togglingFavorite) return;
		
		togglingFavorite = true;
		const previousState = isFavorite;
		isFavorite = !isFavorite; // Optimistic update
		
		try {
			const response = await fetch('/api/favorites', {
				method: isFavorite ? 'POST' : 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ productId: data.product.id })
			});
			
			if (!response.ok) {
				throw new Error('Failed to update favorite');
			}
			
			const result = await response.json();
			
			if (result.success) {
				toast.success(isFavorite ? 'Added to favorites ❤️' : 'Removed from favorites');
			} else {
				// Revert on failure
				isFavorite = previousState;
				toast.error(result.error || 'Something went wrong');
			}
		} catch (error) {
			console.error('Favorite toggle error:', error);
			isFavorite = previousState; // Revert on error
			toast.error('Failed to update favorite');
		} finally {
			togglingFavorite = false;
		}
	}

	function formatDuration(seconds) {
		if (!seconds) return null;
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		if (hours > 0) return `${hours}h ${minutes}m`;
		return `${minutes}m`;
	}
	
	// Get duration based on selected format
	const displayDuration = $derived.by(() => {
		if (selectedFormat === 'SUMMARY' && data.product.summaryDuration) {
			return data.product.summaryDuration;
		}
		if ((selectedFormat === 'AUDIO' || selectedFormat === 'BUNDLE') && data.product.duration) {
			return data.product.duration;
		}
		return null;
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
									disabled={togglingFavorite}
									class="p-2 bg-white/90 dark:bg-black/90 rounded-full shadow-lg hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
									title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
								>
									<Heart 
										class="w-5 h-5 transition-colors {isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'} {togglingFavorite ? 'animate-pulse' : ''}" 
									/>
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
								disabled={togglingFavorite}
								class="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
							>
								<Heart 
									class="w-5 h-5 transition-colors {isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'} {togglingFavorite ? 'animate-pulse' : ''}" 
								/>
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

					<!-- Product Info -->
					<div>
						<h1 class="text-3xl md:text-4xl font-bold text-foreground mb-2">
							{data.product.title}
						</h1>
						
						<p class="text-lg text-muted-foreground mb-4">
							by <span class="text-foreground font-medium">{data.product.author}</span>
						</p>

						<!-- Metadata row -->
						<div class="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
							<!-- Downloads -->
							<div class="flex items-center gap-1.5">
								<Download class="w-4 h-4" />
								<span>{data.product.downloads.toLocaleString()} downloads</span>
							</div>
							
							<!-- Rating -->
							{#if data.product.rating > 0}
								<div class="flex items-center gap-1">
									<Star class="w-5 h-5 text-yellow-500 fill-current" />
									<span class="font-medium">{data.product.rating.toFixed(1)}</span>
									<span>({data.product.reviewCount})</span>
								</div>
							{/if}
							
							<!-- Duration - Changes based on selected format -->
							{#if displayDuration}
								<div class="flex items-center gap-1.5 font-medium text-primary">
									<Clock class="w-4 h-4" />
									<span>{formatDuration(displayDuration)}</span>
									{#if selectedFormat === 'SUMMARY'}
										<span class="text-xs text-muted-foreground">(Quick Listen)</span>
									{/if}
								</div>
							{/if}
						</div>
					</div>

					<!-- Format Selector with Duration Info -->
					<div class="bg-secondary/30 rounded-lg p-4">
						<h3 class="text-sm font-semibold mb-3">Choose Format:</h3>
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
							{#if isEbook}
								<button
									onclick={() => selectedFormat = "PDF"}
									class="flex items-center gap-3 p-4 rounded-lg border-2 transition-all
										{selectedFormat === 'PDF' 
											? 'border-primary bg-primary/10' 
											: 'border-border bg-card hover:border-primary/50'}"
								>
									<BookOpen class="w-5 h-5 {selectedFormat === 'PDF' ? 'text-primary' : 'text-muted-foreground'}" />
									<div class="flex-1 text-left">
										<div class="font-medium">PDF eBook</div>
										<div class="text-xs text-muted-foreground">Read on any device</div>
									</div>
									{#if selectedFormat === 'PDF'}
										<Check class="w-5 h-5 text-primary" />
									{/if}
								</button>
							{/if}

							{#if isAudiobook}
								<button
									onclick={() => selectedFormat = "AUDIO"}
									class="flex items-center gap-3 p-4 rounded-lg border-2 transition-all
										{selectedFormat === 'AUDIO' 
											? 'border-primary bg-primary/10' 
											: 'border-border bg-card hover:border-primary/50'}"
								>
									<Headphones class="w-5 h-5 {selectedFormat === 'AUDIO' ? 'text-primary' : 'text-muted-foreground'}" />
									<div class="flex-1 text-left">
										<div class="font-medium">Full Audiobook</div>
										<div class="text-xs text-muted-foreground">
											{#if data.product.duration}
												{formatDuration(data.product.duration)} • Listen anywhere
											{:else}
												Listen anywhere
											{/if}
										</div>
									</div>
									{#if selectedFormat === 'AUDIO'}
										<Check class="w-5 h-5 text-primary" />
									{/if}
								</button>
							{/if}

							{#if isSummary}
								<button
									onclick={() => selectedFormat = "SUMMARY"}
									class="flex items-center gap-3 p-4 rounded-lg border-2 transition-all
										{selectedFormat === 'SUMMARY' 
											? 'border-amber-500 bg-amber-500/10' 
											: 'border-border bg-card hover:border-amber-500/50'}"
								>
									<Zap class="w-5 h-5 {selectedFormat === 'SUMMARY' ? 'text-amber-500' : 'text-muted-foreground'}" />
									<div class="flex-1 text-left">
										<div class="font-medium">Audio Summary</div>
										<div class="text-xs text-muted-foreground">
											{#if data.product.summaryDuration}
												{formatDuration(data.product.summaryDuration)} • Key insights
											{:else}
												15-20 min • Key insights
											{/if}
										</div>
									</div>
									{#if selectedFormat === 'SUMMARY'}
										<Check class="w-5 h-5 text-amber-500" />
									{/if}
								</button>
							{/if}

							{#if canBuyBundle}
								<button
									onclick={() => selectedFormat = "BUNDLE"}
									class="flex items-center gap-3 p-4 rounded-lg border-2 transition-all sm:col-span-2
										{selectedFormat === 'BUNDLE' 
											? 'border-green-500 bg-green-500/10' 
											: 'border-border bg-card hover:border-green-500/50'}"
								>
									<Package class="w-5 h-5 {selectedFormat === 'BUNDLE' ? 'text-green-500' : 'text-muted-foreground'}" />
									<div class="flex-1 text-left">
										<div class="font-medium">Bundle (PDF + Audio)</div>
										<div class="text-xs text-muted-foreground">
											{#if data.product.duration}
												{formatDuration(data.product.duration)} audio • Save KSh {getSavings()}
											{:else}
												Save KSh {getSavings()}
											{/if}
										</div>
									</div>
									{#if selectedFormat === 'BUNDLE'}
										<Check class="w-5 h-5 text-green-500" />
									{/if}
								</button>
							{/if}
						</div>
					</div>

					<!-- Purchase Section -->
					<div class="bg-card border border-border rounded-lg p-6 space-y-4">
						<!-- Price -->
						<div>
							{#if pricing.isFree}
								<div class="text-3xl font-bold text-green-600">FREE!</div>
								{#if pricing.originalPrice > 0}
									<div class="text-sm text-muted-foreground line-through">
										Was KSh {pricing.originalPrice}
									</div>
								{/if}
							{:else if pricing.discount > 0}
								<div class="flex items-baseline gap-3">
									<div class="text-3xl font-bold text-primary">
										KSh {pricing.finalPrice}
									</div>
									<div class="text-lg text-muted-foreground line-through">
										KSh {pricing.originalPrice}
									</div>
								</div>
								<div class="text-sm text-green-600 font-medium mt-1">
									Save KSh {pricing.savings} ({pricing.discount}% off)
								</div>
							{:else}
								<div class="text-3xl font-bold text-primary">
									KSh {getPrice()}
								</div>
							{/if}

							{#if getSavings() > 0 && !pricing.discount}
								<p class="text-sm text-green-600 font-medium mt-1">
									Save KSh {getSavings()} with bundle
								</p>
							{/if}
						</div>

						<!-- Add to Cart Button -->
						<button
							onclick={addToCart}
							disabled={addingToCart || !selectedFormat}
							class="w-full py-4 px-6 font-bold rounded-lg transition-all shadow-lg text-lg
								{pricing.isFree
									? 'bg-green-600 hover:bg-green-700 text-white'
									: 'bg-primary hover:bg-primary/90 text-primary-foreground'}
								disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{#if addingToCart}
								Adding to Cart...
							{:else}
								{pricing.isFree ? '🎁 Get Free' : '🛒 Add to Cart'}
							{/if}
						</button>

						{#if cartMessage}
							<p class="text-sm text-center text-muted-foreground">{cartMessage}</p>
						{/if}
					</div>

					<!-- Description -->
					<div class="prose dark:prose-invert max-w-none">
						<h2 class="text-2xl font-bold mb-4">About This {isSummary ? 'Summary' : 'Book'}</h2>
						<p class="text-muted-foreground whitespace-pre-line">{data.product.description}</p>
					</div>
				</div>
			</div>
		</div>
	</section>
</div>
