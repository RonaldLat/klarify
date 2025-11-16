<script>
	import { invalidateAll } from "$app/navigation";
	import { Zap, Clock, BookOpen, Headphones, ChevronRight, Star, Check } from '@lucide/svelte';
	
	const publicUrl = "https://pub-ddafa2dcdc11430f8cec35c3cad0b062.r2.dev/";

	let { data } = $props();
	
	// Check if this is a summary
	const isSummary = $derived(data.product.type === 'SUMMARY');
	
	let selectedFormat = $state(
		data.product.type === "BUNDLE" ? "BUNDLE" : 
		data.product.type === "AUDIOBOOK" || isSummary ? "AUDIO" : "PDF"
	);

	let addingToCart = $state(false);
	let cartMessage = $state("");

	/**
	 * Get price for selected format
	 */
	function getPrice() {
		if (isSummary) return data.product.audioPrice; // Summaries only have audio
		if (selectedFormat === "BUNDLE") return data.product.bundlePrice || (data.product.pdfPrice + data.product.audioPrice);
		if (selectedFormat === "AUDIO") return data.product.audioPrice;
		return data.product.pdfPrice;
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
					format: isSummary ? "AUDIO" : selectedFormat // Summaries always AUDIO
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
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		if (hours > 0) return `${hours}h ${minutes}m`;
		return `${minutes}m`;
	}
</script>

<svelte:head>
	<title>{data.product.title} - Klarify</title>
	<meta name="description" content={data.product.description} />
</svelte:head>

<div class="min-h-screen bg-background">
	<!-- Product Hero Section -->
	<section class="bg-card border-b border-border">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
			<div class="grid grid-cols-1 md:grid-cols-5 gap-8">
				<!-- Cover Image -->
				<div class="md:col-span-2">
					<div class="sticky top-24">
						<div class="aspect-[2/3] bg-muted rounded-lg overflow-hidden shadow-lg relative">
							<img 
								src={publicUrl + data.product.coverImage} 
								alt="{data.product.title} cover"
								class="w-full h-full object-cover"
							/>
							
							<!-- Summary Badge on Cover -->
							{#if isSummary}
								<div class="absolute top-4 left-4">
									<span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-sm font-semibold rounded-lg shadow-lg">
										<Zap class="w-4 h-4" />
										Audio Summary
									</span>
								</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Product Info -->
				<div class="md:col-span-3 space-y-6">
					<!-- Breadcrumb -->
					<nav class="flex items-center gap-2 text-sm text-muted-foreground">
						<a href="/products" class="hover:text-foreground">Products</a>
						<ChevronRight class="w-4 h-4" />
						{#if isSummary}
							<a href="/products?type=SUMMARY" class="hover:text-foreground">Summaries</a>
							<ChevronRight class="w-4 h-4" />
						{/if}
						<span class="text-foreground truncate">{data.product.title}</span>
					</nav>

					<!-- Title & Meta -->
					<div>
						<!-- Badges -->
						<div class="flex flex-wrap gap-2 mb-3">
							{#if data.product.featured}
								<span class="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
									<Star class="w-3.5 h-3.5 fill-current" />
									Featured
								</span>
							{/if}
							{#if isSummary}
								<span class="inline-flex items-center gap-1 px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm font-medium rounded-full">
									<Zap class="w-3.5 h-3.5" />
									Quick Summary
								</span>
							{/if}
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

						<!-- Rating & Meta -->
						<div class="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
							{#if data.product.rating > 0}
								<div class="flex items-center gap-1">
									<Star class="w-5 h-5 text-yellow-500 fill-current" />
									<span class="font-medium">{data.product.rating.toFixed(1)}</span>
									<span>({data.product.reviewCount} reviews)</span>
								</div>
							{/if}
							
							{#if !isSummary}
								<span class="px-3 py-1 bg-secondary rounded-full">
									{data.product.type}
								</span>
							{/if}
							
							{#if data.product.duration}
								<span class="flex items-center gap-1">
									<Clock class="w-4 h-4" />
									{formatDuration(data.product.duration)}
								</span>
							{:else if data.product.pageCount}
								<span class="flex items-center gap-1">
									<BookOpen class="w-4 h-4" />
									{data.product.pageCount} pages
								</span>
							{/if}
							
							<span>{data.product.downloads} downloads</span>
						</div>

						<!-- Summary-Specific Info -->
						{#if isSummary && data.product.keyTakeaways}
							<div class="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
								<Zap class="w-5 h-5" />
								<span class="font-medium">{data.product.keyTakeaways} Key Insights</span>
							</div>
						{/if}
					</div>

					<!-- Categories -->
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

					<!-- Original Book Section (for summaries) -->
					{#if isSummary && data.product.originalProduct}
						<div class="bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-lg p-5">
							<div class="flex items-start gap-4">
								<div class="flex-shrink-0">
									<BookOpen class="w-8 h-8 text-amber-600 dark:text-amber-400" />
								</div>
								<div class="flex-1">
									<h3 class="text-lg font-semibold text-foreground mb-2">
										📚 Full Book Available
									</h3>
									<p class="text-sm text-muted-foreground mb-3">
										Want to dive deeper? Get the complete experience with the full {data.product.originalProduct.type === 'AUDIOBOOK' ? 'audiobook' : 'book'}.
									</p>
									
									<div class="bg-background/80 backdrop-blur-sm rounded-lg p-4 border border-border/50">
										<div class="flex gap-4">
											<a href="/products/{data.product.originalProduct.slug}" class="flex-shrink-0">
												<img 
													src="{publicUrl}{data.product.originalProduct.coverImage}"
													alt={data.product.originalProduct.title}
													class="w-16 h-24 object-cover rounded shadow-md hover:shadow-lg transition-shadow"
												/>
											</a>
											
											<div class="flex-1 min-w-0">
												<a 
													href="/products/{data.product.originalProduct.slug}"
													class="font-semibold text-foreground hover:text-primary line-clamp-2 mb-1 block"
												>
													{data.product.originalProduct.title}
												</a>
												<p class="text-sm text-muted-foreground mb-2">
													by {data.product.originalProduct.author}
												</p>
												
												<div class="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
													{#if data.product.originalProduct.duration}
														<span class="flex items-center gap-1">
															<Clock class="w-3.5 h-3.5" />
															{formatDuration(data.product.originalProduct.duration)}
														</span>
													{/if}
													{#if data.product.originalProduct.pageCount}
														<span class="flex items-center gap-1">
															<BookOpen class="w-3.5 h-3.5" />
															{data.product.originalProduct.pageCount} pages
														</span>
													{/if}
												</div>

												<div class="flex items-center justify-between">
													<span class="text-base font-bold text-foreground">
														KSh {data.product.originalProduct.audioPrice || data.product.originalProduct.pdfPrice}
													</span>
													<a 
														href="/products/{data.product.originalProduct.slug}"
														class="inline-flex items-center gap-1 text-sm text-primary hover:underline font-medium"
													>
														View Full Book
														<ChevronRight class="w-4 h-4" />
													</a>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					{/if}

					<!-- Available Summaries Section (for full books) -->
					{#if !isSummary && data.product.summaries && data.product.summaries.length > 0}
						<div class="bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-lg p-5">
							<div class="flex items-start gap-4 mb-4">
								<div class="flex-shrink-0">
									<Zap class="w-8 h-8 text-amber-600 dark:text-amber-400" />
								</div>
								<div class="flex-1">
									<h3 class="text-lg font-semibold text-foreground mb-2">
										⚡ Quick Summaries Available
									</h3>
									<p class="text-sm text-muted-foreground mb-4">
										Short on time? Get the key insights in 15-20 minutes with our professionally curated audio summaries.
									</p>
								</div>
							</div>

							<div class="grid gap-3">
								{#each data.product.summaries as summary}
									<a 
										href="/products/{summary.slug}"
										class="bg-background/80 backdrop-blur-sm rounded-lg p-4 border border-border/50 hover:border-amber-500/50 transition-all group"
									>
										<div class="flex gap-3">
											<img 
												src="{publicUrl}{summary.coverImage}"
												alt={summary.title}
												class="w-14 h-20 object-cover rounded shadow group-hover:shadow-md transition-shadow flex-shrink-0"
											/>
											
											<div class="flex-1 min-w-0">
												<div class="flex items-start justify-between gap-2 mb-2">
													<h4 class="font-semibold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 text-sm line-clamp-2 flex-1">
														{summary.title}
													</h4>
													<span class="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex-shrink-0">
														<Headphones class="w-3 h-3" />
														Audio
													</span>
												</div>

												<div class="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-2">
													{#if summary.duration}
														<span class="flex items-center gap-1">
															<Clock class="w-3.5 h-3.5" />
															{formatDuration(summary.duration)}
														</span>
													{/if}
													{#if summary.keyTakeaways}
														<span class="flex items-center gap-1">
															<Zap class="w-3.5 h-3.5" />
															{summary.keyTakeaways} insights
														</span>
													{/if}
												</div>

												<div class="flex items-center justify-between">
													<span class="text-sm font-bold text-foreground">
														KSh {summary.audioPrice}
													</span>
													<span class="inline-flex items-center gap-1 text-xs text-primary group-hover:underline font-medium">
														View Summary
														<ChevronRight class="w-3.5 h-3.5" />
													</span>
												</div>
											</div>
										</div>
									</a>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Description -->
					<div class="prose prose-sm md:prose max-w-none">
						<p class="text-foreground leading-relaxed">{data.product.description}</p>
					</div>

					<!-- Format Selection (for bundles only, not for summaries) -->
					{#if data.product.type === "BUNDLE"}
						<div class="space-y-3">
							<label class="block text-sm font-medium text-foreground">Choose Format:</label>
							<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
								<button
									onclick={() => selectedFormat = "PDF"}
									class="px-4 py-3 rounded-lg border-2 transition-all {selectedFormat === 'PDF' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}"
								>
									<div class="font-medium text-foreground">PDF Only</div>
									<div class="text-sm text-muted-foreground">KSh {data.product.pdfPrice}</div>
								</button>
								<button
									onclick={() => selectedFormat = "AUDIO"}
									class="px-4 py-3 rounded-lg border-2 transition-all {selectedFormat === 'AUDIO' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}"
								>
									<div class="font-medium text-foreground">Audio Only</div>
									<div class="text-sm text-muted-foreground">KSh {data.product.audioPrice}</div>
								</button>
								<button
									onclick={() => selectedFormat = "BUNDLE"}
									class="px-4 py-3 rounded-lg border-2 transition-all relative {selectedFormat === 'BUNDLE' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}"
								>
									<span class="absolute -top-2 -right-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-bold rounded-full">
										SAVE
									</span>
									<div class="font-medium text-foreground">Bundle</div>
									<div class="text-sm text-muted-foreground">KSh {data.product.bundlePrice || (data.product.pdfPrice + data.product.audioPrice)}</div>
								</button>
							</div>
						</div>
					{/if}

					<!-- Purchase Section -->
					<div class="bg-accent/50 rounded-lg p-6 space-y-4">
						<div class="flex items-center justify-between">
							<div>
								<div class="text-sm text-muted-foreground">
									{isSummary ? 'Audio Summary Price' : 'Price'}
								</div>
								<div class="text-3xl font-bold {isSummary ? 'text-amber-600 dark:text-amber-400' : 'text-primary'}">
									KSh {getPrice()}
								</div>
								{#if selectedFormat === "BUNDLE" && !isSummary}
									<div class="text-sm text-muted-foreground line-through">
										KSh {data.product.pdfPrice + data.product.audioPrice}
									</div>
								{/if}
							</div>
						</div>

						<!-- Cart Message -->
						{#if cartMessage}
							<div class="text-sm font-medium {cartMessage.startsWith('✓') ? 'text-green-600' : 'text-destructive'}">
								{cartMessage}
							</div>
						{/if}

						<div class="space-y-3">
							<button
								onclick={addToCart}
								disabled={addingToCart}
								class="w-full px-6 py-3 {isSummary ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary hover:bg-primary/90'} text-white font-semibold rounded-lg transition-colors shadow-lg disabled:opacity-50"
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

						<!-- Features -->
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
							{#if isSummary}
								<div class="flex items-center gap-2">
									<Check class="w-5 h-5 text-primary" />
									<span class="font-medium text-amber-600 dark:text-amber-400">Learn in 15-20 minutes</span>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Related Products -->
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
									KSh {product.type === "AUDIOBOOK" ? product.audioPrice : product.pdfPrice}
								</div>
							</div>
						</a>
					{/each}
				</div>
			</div>
		</section>
	{/if}
</div>
