<script>
	let { data } = $props();
  const publicUrl ="https://pub-ddafa2dcdc11430f8cec35c3cad0b062.r2.dev/"

	function formatDuration(seconds) {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		if (hours > 0) return `${hours}h ${minutes}m`;
		return `${minutes}m`;
	}
  console.log(data)
</script>

<div class="bg-background">
	<!-- Hero Section -->
	<section class="bg-gradient-to-b from-primary/10 to-background py-12 md:py-20">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="text-center">
				<h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 md:mb-6">
					Welcome to Klarify
				</h1>
				<p class="text-lg md:text-xl text-muted-foreground mb-6 md:mb-8 max-w-2xl mx-auto">
					Discover thousands of audiobooks, ebooks, and magazines. 
					Learn on the go with affordable digital content.
				</p>
				
				{#if !data.user}
					<div class="flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
						<a
							href="/signup"
							class="px-6 md:px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
						>
							Get Started
						</a>
						<a
							href="/products"
							class="px-6 md:px-8 py-3 bg-secondary text-secondary-foreground font-semibold rounded-lg hover:bg-secondary/80 transition-colors"
						>
							Browse Content
						</a>
					</div>
				{:else}
					<a
						href="/products"
						class="inline-block px-6 md:px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
					>
						Browse Content
					</a>
				{/if}
			</div>
		</div>
	</section>

	<!-- Stats Section -->
	<section class="py-8 md:py-16 bg-card border-y border-border">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="grid grid-cols-3 gap-4 md:gap-8 text-center">
				<div>
					<div class="text-3xl md:text-4xl font-bold text-primary mb-2">1000+</div>
					<div class="text-sm md:text-base text-muted-foreground">Books Available</div>
				</div>
				<div>
					<div class="text-3xl md:text-4xl font-bold text-primary mb-2">KSh 50</div>
					<div class="text-sm md:text-base text-muted-foreground">Starting From</div>
				</div>
				<div>
					<div class="text-3xl md:text-4xl font-bold text-primary mb-2">24/7</div>
					<div class="text-sm md:text-base text-muted-foreground">Instant Access</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Categories Section -->
	{#if data.categories.length > 0}
		<section class="py-12 md:py-16 bg-muted/50">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<h2 class="text-2xl md:text-3xl font-bold text-foreground mb-6 md:mb-8">Browse by Category</h2>
				
				<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
					{#each data.categories as category}
						<a
							href="/products?category={category.slug}"
							class="group bg-card border border-border rounded-lg p-4 md:p-6 hover:shadow-lg hover:border-primary transition-all text-center"
						>
							<div class="text-3xl md:text-4xl mb-2 md:mb-3 hidden">{category.icon}</div>
							<h3 class="font-semibold text-sm md:text-base text-foreground group-hover:text-primary transition-colors mb-1">
								{category.name}
							</h3>
							<p class="text-xs md:text-sm text-muted-foreground">
								{category._count.products} books
							</p>
						</a>
					{/each}
				</div>
			</div>
		</section>
	{/if}

	<!-- Featured Products Section -->
	<section class="py-12 md:py-20">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex items-center justify-between mb-6 md:mb-8">
				<h2 class="text-2xl md:text-3xl font-bold text-foreground">Featured Content</h2>
				<a href="/products" class="text-sm md:text-base text-primary hover:underline">View All →</a>
			</div>
			
			{#if data.featuredProducts.length === 0}
				<div class="text-center py-12 md:py-16 text-muted-foreground">
					<svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
					</svg>
					<p class="text-base md:text-lg">No featured products yet. Check back soon!</p>
				</div>
			{:else}
				<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
					{#each data.featuredProducts as product}
						<a
							href="/products/{product.slug}"
							class="group bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all"
						>
							<!-- Cover Image Placeholder -->
							<div class="aspect-[2/3] bg-muted flex items-center justify-center">
                <img src={publicUrl+product.coverImage} alt="">
								<svg class="w-12 md:w-16 h-12 md:h-16 text-muted-foreground opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
								</svg>
							</div>

							<div class="p-3 md:p-4">
								<!-- Featured Badge -->
								<span class="inline-block px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded mb-2">
									⭐ Featured
								</span>

								<!-- Title -->
								<h3 class="font-semibold text-sm md:text-base text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1">
									{product.title}
								</h3>

								<!-- Author -->
								<p class="text-xs md:text-sm text-muted-foreground mb-2 truncate">
									by {product.author}
								</p>

								<!-- Type & Info -->
								<div class="flex items-center gap-2 text-xs text-muted-foreground mb-3">
									<span class="px-2 py-0.5 bg-secondary rounded truncate">
										{product.type}
									</span>
									{#if product.duration}
										<span class="hidden sm:inline">{formatDuration(product.duration)}</span>
									{:else if product.pageCount}
										<span class="hidden sm:inline">{product.pageCount}p</span>
									{/if}
								</div>

								<!-- Price -->
								<div class="flex items-center justify-between">
									<div>
										{#if product.type === "BUNDLE"}
											<div class="text-base md:text-lg font-bold text-primary">
												KSh {product.bundlePrice}
											</div>
										{:else if product.type === "AUDIOBOOK"}
											<div class="text-base md:text-lg font-bold text-primary">
												KSh {product.audioPrice}
											</div>
										{:else}
											<div class="text-base md:text-lg font-bold text-primary">
												KSh {product.pdfPrice}
											</div>
										{/if}
									</div>

									<!-- Rating -->
									{#if product.rating > 0}
										<div class="flex items-center gap-1">
											<svg class="w-3 h-3 md:w-4 md:h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
												<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
											</svg>
											<span class="text-xs md:text-sm">{product.rating.toFixed(1)}</span>
										</div>
									{/if}
								</div>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	</section>

	<!-- CTA Section -->
	{#if !data.user}
		<section class="py-12 md:py-20 bg-primary text-primary-foreground">
			<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
				<h2 class="text-3xl md:text-4xl font-bold mb-4">Start Reading Today</h2>
				<p class="text-lg md:text-xl opacity-90 mb-8">
					Join thousands of readers accessing quality content at affordable prices
				</p>
				<a
					href="/signup"
					class="inline-block px-8 py-3 bg-background text-foreground font-semibold rounded-lg hover:bg-background/90 transition-colors shadow-lg"
				>
					Create Free Account
				</a>
			</div>
		</section>
	{/if}
</div>
