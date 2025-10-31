<script>
	import { invalidateAll } from "$app/navigation";

	let { data } = $props();
	
	let selectedFormat = $state(
		data.product.type === "BUNDLE" ? "BUNDLE" : 
		data.product.type === "AUDIOBOOK" ? "AUDIO" : "PDF"
	);

	let addingToCart = $state(false);
	let cartMessage = $state("");

	/**
	 * Get price for selected format
	 */
	function getPrice() {
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
					format: selectedFormat
				})
			});

			const result = await response.json();

			if (response.ok) {
				cartMessage = "✓ Added to cart!";
				await invalidateAll(); // Refresh cart count in header
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
						<div class="aspect-[2/3] bg-muted rounded-lg overflow-hidden shadow-lg">
							<!-- Placeholder for cover image -->
							<div class="w-full h-full flex items-center justify-center">
								<svg class="w-24 h-24 text-muted-foreground opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
								</svg>
							</div>
						</div>
					</div>
				</div>

				<!-- Product Info -->
				<div class="md:col-span-3 space-y-6">
					<!-- Breadcrumb -->
					<nav class="flex items-center gap-2 text-sm text-muted-foreground">
						<a href="/products" class="hover:text-foreground">Products</a>
						<span>›</span>
						<span class="text-foreground">{data.product.title}</span>
					</nav>

					<!-- Title & Meta -->
					<div>
						{#if data.product.featured}
							<span class="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full mb-3">
								⭐ Featured
							</span>
						{/if}
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
									<svg class="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
										<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
									</svg>
									<span class="font-medium">{data.product.rating.toFixed(1)}</span>
									<span>({data.product.reviewCount} reviews)</span>
								</div>
							{/if}
							<span class="px-3 py-1 bg-secondary rounded-full">
								{data.product.type}
							</span>
							{#if data.product.duration}
								<span>🎧 {formatDuration(data.product.duration)}</span>
							{:else if data.product.pageCount}
								<span>📄 {data.product.pageCount} pages</span>
							{/if}
							<span>{data.product.downloads} downloads</span>
						</div>
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

					<!-- Description -->
					<div class="prose prose-sm md:prose max-w-none">
						<p class="text-foreground leading-relaxed">{data.product.description}</p>
					</div>

					<!-- Format Selection (for bundles) -->
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
								<div class="text-sm text-muted-foreground">Price</div>
								<div class="text-3xl font-bold text-primary">
									KSh {getPrice()}
								</div>
								{#if selectedFormat === "BUNDLE"}
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
								class="w-full px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-lg disabled:opacity-50"
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
								<svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
								<span>Instant download access</span>
							</div>
							<div class="flex items-center gap-2">
								<svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
								<span>3 downloads within 48 hours</span>
							</div>
							<div class="flex items-center gap-2">
								<svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
								<span>Secure M-Pesa payment</span>
							</div>
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
							<div class="aspect-[2/3] bg-muted flex items-center justify-center">
								<svg class="w-12 h-12 text-muted-foreground opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
								</svg>
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
