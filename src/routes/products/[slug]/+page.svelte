<script>
	import { invalidateAll } from "$app/navigation";
	import { Zap, Clock, BookOpen, Headphones, ChevronRight, Star, Check, Package } from '@lucide/svelte';
	
	const publicUrl = "https://pub-ddafa2dcdc11430f8cec35c3cad0b062.r2.dev/";

	let { data } = $props();
	
	// Helper: Check if product has specific type
	const hasType = (type) => data.product.type.includes(type);
	
	// Check what types this product has
	const isSummary = hasType('SUMMARY');
	const isAudiobook = hasType('AUDIOBOOK');
	const isEbook = hasType('EBOOK');
	const canBuyBundle = isEbook && isAudiobook; // Has both formats
	
	// Available formats for selection
	const availableFormats = $derived.by(() => {
		const formats = [];
		if (isEbook) formats.push('PDF');
		if (isAudiobook) formats.push('AUDIO');
		if (isSummary) formats.push('SUMMARY');
		if (canBuyBundle) formats.push('BUNDLE');
		return formats;
	});
	
	// Default format selection
	let selectedFormat = $state(
		canBuyBundle ? "BUNDLE" :
		isSummary ? "SUMMARY" :
		isAudiobook ? "AUDIO" : "PDF"
	);

	let addingToCart = $state(false);
	let cartMessage = $state("");

	/**
	 * Get price for selected format
	 */
	function getPrice() {
		if (selectedFormat === "SUMMARY") {
			return data.product.summaryPrice || data.product.audioPrice;
		}
		if (selectedFormat === "BUNDLE") {
			return data.product.bundlePrice || (data.product.pdfPrice + data.product.audioPrice);
		}
		if (selectedFormat === "AUDIO") return data.product.audioPrice;
		return data.product.pdfPrice;
	}
	
	/**
	 * Get savings amount for bundle
	 */
	function getSavings() {
		if (selectedFormat === "BUNDLE" && data.product.bundlePrice) {
			const fullPrice = data.product.pdfPrice + data.product.audioPrice;
			return fullPrice - data.product.bundlePrice;
		}
		return 0;
	}

	/**
	 * Add to cart
	 */
	async function addToCart() {
		if (addingToCart) return;

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
				cartMessage = "✓ Added to cart!";
				await invalidateAll();
				setTimeout(() => cartMessage = "", 3000);
			} else {
				cartMessage = result.error || "Failed to add to cart";
			}
		} catch (error) {
			console.error("Add to cart error:", error);
			cartMessage = "Failed to add to cart";
		} finally {
			addingToCart = false;
		}
	}

	/**
	 * Format duration
	 */
	function formatDuration(seconds) {
		if (!seconds) return null;
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		if (hours > 0) return `${hours}h ${minutes}m`;
		return `${minutes}m`;
	}
	
	// Get display duration based on selected format
	const displayDuration = $derived.by(() => {
		if (selectedFormat === 'SUMMARY' && data.product.summaryDuration) {
			return data.product.summaryDuration;
		}
		return data.product.duration;
	});
</script>

<svelte:head>
	<title>{data.product.title} - Klarify</title>
	<meta name="description" content={data.product.description} />
</svelte:head>

<div class="min-h-screen bg-background">
	<section class="bg-card border-b border-border">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
			<div class="grid grid-cols-1 md:grid-cols-5 gap-8">
				<div class="md:col-span-2">
					<div class="sticky top-24">
						<div class="aspect-[2/3] bg-muted rounded-lg overflow-hidden shadow-lg relative">
							<img 
								src={publicUrl + data.product.coverImage} 
								alt="{data.product.title} cover"
								class="w-full h-full object-cover"
							/>
							
							<div class="absolute top-4 left-4 flex flex-col gap-2">
								{#if isSummary}
									<span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-sm font-semibold rounded-lg shadow-lg">
										<Zap class="w-4 h-4" />
										Audio Summary
									</span>
								{/if}
								{#if canBuyBundle}
									<span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg shadow-lg">
										<Package class="w-4 h-4" />
										Bundle Available
									</span>
								{/if}
							</div>
						</div>
					</div>
				</div>

				<div class="md:col-span-3 space-y-6">
					<nav class="flex items-center gap-2 text-sm text-muted-foreground">
						<a href="/products" class="hover:text-foreground">Products</a>
						<ChevronRight class="w-4 h-4" />
						{#if isSummary}
							<a href="/products?type=SUMMARY" class="hover:text-foreground">Summaries</a>
							<ChevronRight class="w-4 h-4" />
						{/if}
						<span class="text-foreground truncate">{data.product.title}</span>
					</nav>

					<div>
						<div class="flex flex-wrap gap-2 mb-3">
							{#if data.product.featured}
								<span class="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
									<Star class="w-3.5 h-3.5 fill-current" />
									Featured
								</span>
							{/if}
							{#each data.product.type as productType}
								<span class="px-3 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">
									{productType}
								</span>
							{/each}
						</div>

						<h1 class="text-3xl md:text-4xl font-bold text-foreground mb-2">
							{data.product.title}
						</h1>
						
						<p class="text-lg text-muted-foreground mb-4">
							by <span class="text-foreground font-medium">{data.product.author}</span>
							{#if data.product.narrator}
								<span class="hidden sm:inline">
									• Narrated by <span class="text-foreground">{data.product.narrator}</span>
								</span>
							{/if}
						</p>

						<div class="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
							{#if data.product.rating > 0}
								<div class="flex items-center gap-1">
									<Star class="w-5 h-5 text-yellow-500 fill-current" />
									<span class="font-medium">{data.product.rating.toFixed(1)}</span>
									<span>({data.product.reviewCount} reviews)</span>
								</div>
							{/if}
							
							{#if displayDuration}
								<span class="flex items-center gap-1">
									<Clock class="w-4 h-4" />
									{formatDuration(displayDuration)}
								</span>
							{:else if data.product.pageCount}
								<span class="flex items-center gap-1">
									<BookOpen class="w-4 h-4" />
									{data.product.pageCount} pages
								</span>
							{/if}
							
							<span>{data.product.downloads} downloads</span>
						</div>

						{#if isSummary && data.product.keyTakeaways}
							<div class="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
								<Zap class="w-5 h-5" />
								<span class="font-medium">{data.product.keyTakeaways} Key Insights</span>
							</div>
						{/if}
					</div>

					{#if data.product.categories.length > 0}
						<div class="flex flex-wrap gap-2">
							{#each data.product.categories as category}
								<a
									href="/products?category={category.slug}"
									class="px-3 py-1.5 bg-accent text-accent-foreground text-sm rounded-md hover:bg-accent/80 transition-colors"
								>
									{category.icon} {category.name}
								</a>
							{/each}
						</div>
					{/if}

					<div class="prose prose-sm md:prose max-w-none">
						<p class="text-foreground leading-relaxed">{data.product.description}</p>
					</div>

					<div class="bg-accent/30 rounded-lg p-6 space-y-4">
						<h3 class="text-lg font-semibold text-foreground">Choose Your Format</h3>
						
						<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
							{#if isEbook}
								<button
									onclick={() => selectedFormat = "PDF"}
									class="p-4 rounded-lg border-2 transition-all text-left {selectedFormat === 'PDF' ? 'border-primary bg-primary/5 shadow-md' : 'border-border hover:border-primary/50'}"
								>
									<div class="flex items-center justify-between mb-2">
										<div class="flex items-center gap-2">
											<BookOpen class="w-5 h-5 {selectedFormat === 'PDF' ? 'text-primary' : 'text-muted-foreground'}" />
											<span class="font-semibold">PDF eBook</span>
										</div>
										{#if selectedFormat === 'PDF'}
											<Check class="w-5 h-5 text-primary" />
										{/if}
									</div>
									<div class="text-2xl font-bold text-primary mb-1">
										KSh {data.product.pdfPrice}
									</div>
									<div class="text-xs text-muted-foreground">
										Digital PDF file
									</div>
								</button>
							{/if}

							{#if isAudiobook}
								<button
									onclick={() => selectedFormat = "AUDIO"}
									class="p-4 rounded-lg border-2 transition-all text-left {selectedFormat === 'AUDIO' ? 'border-primary bg-primary/5 shadow-md' : 'border-border hover:border-primary/50'}"
								>
									<div class="flex items-center justify-between mb-2">
										<div class="flex items-center gap-2">
											<Headphones class="w-5 h-5 {selectedFormat === 'AUDIO' ? 'text-primary' : 'text-muted-foreground'}" />
											<span class="font-semibold">Audiobook</span>
										</div>
										{#if selectedFormat === 'AUDIO'}
											<Check class="w-5 h-5 text-primary" />
										{/if}
									</div>
									<div class="text-2xl font-bold text-primary mb-1">
										KSh {data.product.audioPrice}
									</div>
									<div class="text-xs text-muted-foreground">
										{data.product.duration ? formatDuration(data.product.duration) : 'Full narration'}
									</div>
								</button>
							{/if}

							{#if isSummary}
								<button
									onclick={() => selectedFormat = "SUMMARY"}
									class="p-4 rounded-lg border-2 transition-all text-left {selectedFormat === 'SUMMARY' ? 'border-amber-500 bg-amber-500/5 shadow-md' : 'border-amber-500/30 hover:border-amber-500'}"
								>
									<div class="flex items-center justify-between mb-2">
										<div class="flex items-center gap-2">
											<Zap class="w-5 h-5 text-amber-600 dark:text-amber-400" />
											<span class="font-semibold text-amber-600 dark:text-amber-400">Audio Summary</span>
										</div>
										{#if selectedFormat === 'SUMMARY'}
											<Check class="w-5 h-5 text-amber-600" />
										{/if}
									</div>
									<div class="text-2xl font-bold text-amber-600 dark:text-amber-400 mb-1">
										KSh {data.product.summaryPrice || data.product.audioPrice}
									</div>
									<div class="text-xs text-amber-600/70 dark:text-amber-400/70">
										{data.product.summaryDuration ? formatDuration(data.product.summaryDuration) : '15-20 minutes'}
									</div>
								</button>
							{/if}

							{#if canBuyBundle}
								<button
									onclick={() => selectedFormat = "BUNDLE"}
									class="p-4 rounded-lg border-2 transition-all text-left relative {selectedFormat === 'BUNDLE' ? 'border-primary bg-primary/5 shadow-md' : 'border-border hover:border-primary/50'}"
								>
									{#if data.product.bundlePrice && getSavings() > 0}
										<span class="absolute -top-2 -right-2 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg">
											SAVE KSh {getSavings()}
										</span>
									{/if}
									<div class="flex items-center justify-between mb-2">
										<div class="flex items-center gap-2">
											<Package class="w-5 h-5 {selectedFormat === 'BUNDLE' ? 'text-primary' : 'text-muted-foreground'}" />
											<span class="font-semibold">Complete Bundle</span>
										</div>
										{#if selectedFormat === 'BUNDLE'}
											<Check class="w-5 h-5 text-primary" />
										{/if}
									</div>
									<div class="text-2xl font-bold text-primary mb-1">
										KSh {data.product.bundlePrice || (data.product.pdfPrice + data.product.audioPrice)}
									</div>
									<div class="text-xs text-muted-foreground">
										PDF + Audiobook
										{#if !data.product.bundlePrice}
											<span class="block mt-1">
												<span class="line-through">KSh {data.product.pdfPrice + data.product.audioPrice}</span>
											</span>
										{/if}
									</div>
								</button>
							{/if}
						</div>
					</div>

					<div class="bg-accent/50 rounded-lg p-6 space-y-4">
						<div class="flex items-center justify-between">
							<div>
								<div class="text-sm text-muted-foreground">
									{selectedFormat === 'BUNDLE' ? 'Bundle Price' :
									 selectedFormat === 'SUMMARY' ? 'Summary Price' :
									 selectedFormat === 'AUDIO' ? 'Audio Price' : 'PDF Price'}
								</div>
								<div class="text-3xl font-bold {selectedFormat === 'SUMMARY' ? 'text-amber-600 dark:text-amber-400' : 'text-primary'}">
									KSh {getPrice()}
								</div>
								{#if selectedFormat === "BUNDLE" && getSavings() > 0}
									<div class="flex items-center gap-2 text-sm mt-1">
										<span class="text-muted-foreground line-through">
											KSh {data.product.pdfPrice + data.product.audioPrice}
										</span>
										<span class="text-green-600 font-medium">
											Save KSh {getSavings()}!
										</span>
									</div>
								{/if}
							</div>
						</div>

						{#if cartMessage}
							<div class="text-sm font-medium {cartMessage.startsWith('✓') ? 'text-green-600' : 'text-destructive'}">
								{cartMessage}
							</div>
						{/if}

						<div class="space-y-3">
							<button
								onclick={addToCart}
								disabled={addingToCart}
								class="w-full px-6 py-3 {selectedFormat === 'SUMMARY' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary hover:bg-primary/90'} text-white font-semibold rounded-lg transition-colors shadow-lg disabled:opacity-50"
							>
								{addingToCart ? "Adding..." : "Add to Cart"}
							</button>
							<a
								href="/cart"
								class="block w-full px-6 py-3 bg-secondary text-secondary-foreground font-medium rounded-lg hover:bg-secondary/80 transition-colors text-center"
							>
								View Cart
							</a>
						</div>

						<div class="pt-4 border-t border-border space-y-2 text-sm text-muted-foreground">
							<div class="flex items-center gap-2">
								<Check class="w-5 h-5 text-primary" />
								<span>Instant download access</span>
							</div>
							<div class="flex items-center gap-2">
								<Check class="w-5 h-5 text-primary" />
								<span>3 downloads within 48 hours</span>
							</div>
							<div class="flex items-center gap-2">
								<Check class="w-5 h-5 text-primary" />
								<span>Secure M-Pesa payment</span>
							</div>
							{#if selectedFormat === 'SUMMARY'}
								<div class="flex items-center gap-2">
									<Check class="w-5 h-5 text-amber-600" />
									<span class="font-medium text-amber-600 dark:text-amber-400">Learn in 15-20 minutes</span>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	{#if data.relatedProducts.length > 0}
		<section class="py-12 md:py-16">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<h2 class="text-2xl md:text-3xl font-bold text-foreground mb-8">You May Also Like</h2>
				
				<div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
					{#each data.relatedProducts as product}
						<a
							href="/products/{product.slug}"
							class="group bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all"
						>
							<div class="aspect-[2/3] bg-muted flex items-center justify-center overflow-hidden">
								<img 
									src={publicUrl + product.coverImage} 
									alt="{product.title} cover"
									class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
								/>
							</div>
							<div class="p-3 md:p-4">
								<h3 class="font-semibold text-sm md:text-base text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1">
									{product.title}
								</h3>
								<p class="text-xs md:text-sm text-muted-foreground mb-2 truncate">
									{product.author}
								</p>
								<div class="text-sm md:text-base font-bold text-primary">
									KSh {product.type.includes("AUDIOBOOK") ? product.audioPrice : product.pdfPrice}
								</div>
							</div>
						</a>
					{/each}
				</div>
			</div>
		</section>
	{/if}
</div>
