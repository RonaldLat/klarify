<script>
	let { data } = $props();

	/**
	 * Format duration in seconds to readable format
	 */
	function formatDuration(seconds) {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		if (hours > 0) return `${hours}h ${minutes}m`;
		return `${minutes}m`;
	}
</script>

<div class="bg-background">
	<!-- Filters Section -->
	<section class="bg-card border-b border-border py-6">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
				<!-- Search -->
				<form method="GET" class="flex-1 max-w-md">
					<input
						type="search"
						name="q"
						value={data.searchQuery}
						placeholder="Search books, authors..."
						class="w-full px-4 py-2 rounded-md border border-input bg-background text-foreground text-sm
							focus:outline-none focus:ring-2 focus:ring-ring"
					/>
				</form>

				<!-- Type Filter -->
				<div class="flex gap-2">
					<a
						href="/products"
						class="px-4 py-2 rounded-md text-sm font-medium transition-colors
							{!data.type ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}"
					>
						All
					</a>
					<a
						href="/products?type=EBOOK"
						class="px-4 py-2 rounded-md text-sm font-medium transition-colors
							{data.type === 'EBOOK' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}"
					>
						eBooks
					</a>
					<a
						href="/products?type=AUDIOBOOK"
						class="px-4 py-2 rounded-md text-sm font-medium transition-colors
							{data.type === 'AUDIOBOOK' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}"
					>
						Audiobooks
					</a>
					<a
						href="/products?type=MAGAZINE"
						class="px-4 py-2 rounded-md text-sm font-medium transition-colors
							{data.type === 'MAGAZINE' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}"
					>
						Magazines
					</a>
				</div>
			</div>

			<!-- Categories -->
			{#if data.categories.length > 0}
				<div class="mt-4 flex flex-wrap gap-2">
					<span class="text-sm text-muted-foreground">Categories:</span>
					{#each data.categories as category}
						<a
							href="/products?category={category.slug}"
							class="px-3 py-1 rounded-full text-xs font-medium transition-colors
								{data.categorySlug === category.slug 
									? 'bg-primary text-primary-foreground' 
									: 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}"
						>
							{category.icon} {category.name}
						</a>
					{/each}
				</div>
			{/if}
		</div>
	</section>

	<!-- Results Count -->
	<section class="py-6">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<p class="text-muted-foreground">
				{data.totalCount} {data.totalCount === 1 ? 'product' : 'products'} found
				{#if data.searchQuery}
					for "{data.searchQuery}"
				{/if}
			</p>
		</div>
	</section>

	<!-- Products Grid -->
	<section class="pb-20">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			{#if data.products.length === 0}
				<!-- Empty State -->
				<div class="text-center py-16">
					<svg class="w-24 h-24 mx-auto mb-6 text-muted-foreground opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
					</svg>
					<h3 class="text-xl font-semibold text-foreground mb-2">No products found</h3>
					<p class="text-muted-foreground mb-6">Try adjusting your search or filters</p>
					<a href="/products" class="text-primary hover:underline">Clear filters</a>
				</div>
			{:else}
				<!-- Products Grid -->
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{#each data.products as product}
						<a
							href="/products/{product.slug}"
							class="group bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all"
						>
							<!-- Cover Image Placeholder -->
							<div class="aspect-[2/3] bg-muted flex items-center justify-center">
								<svg class="w-16 h-16 text-muted-foreground opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
								</svg>
							</div>

							<div class="p-4">
								<!-- Featured Badge -->
								{#if product.featured}
									<span class="inline-block px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded mb-2">
										⭐ Featured
									</span>
								{/if}

								<!-- Title -->
								<h3 class="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1">
									{product.title}
								</h3>

								<!-- Author -->
								<p class="text-sm text-muted-foreground mb-2">
									by {product.author}
								</p>

								<!-- Type & Info -->
								<div class="flex items-center gap-2 text-xs text-muted-foreground mb-3">
									<span class="px-2 py-0.5 bg-secondary rounded">
										{product.type}
									</span>
									{#if product.duration}
										<span>{formatDuration(product.duration)}</span>
									{:else if product.pageCount}
										<span>{product.pageCount} pages</span>
									{/if}
								</div>

								<!-- Price -->
								<div class="flex items-center justify-between">
									<div>
										{#if product.type === 'BUNDLE'}
											<div class="text-lg font-bold text-primary">
												KSh {product.bundlePrice}
											</div>
											<div class="text-xs text-muted-foreground line-through">
												KSh {product.pdfPrice + product.audioPrice}
											</div>
										{:else if product.type === 'AUDIOBOOK'}
											<div class="text-lg font-bold text-primary">
												KSh {product.audioPrice}
											</div>
										{:else}
											<div class="text-lg font-bold text-primary">
												KSh {product.pdfPrice}
											</div>
										{/if}
									</div>

									<!-- Rating -->
									{#if product.rating > 0}
										<div class="flex items-center gap-1">
											<svg class="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
												<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
											</svg>
											<span class="text-sm">{product.rating.toFixed(1)}</span>
										</div>
									{/if}
								</div>
							</div>
						</a>
					{/each}
				</div>

				<!-- Pagination -->
				{#if data.totalPages > 1}
					<div class="mt-12 flex justify-center gap-2">
						{#if data.currentPage > 1}
							<a
								href="/products?page={data.currentPage - 1}{data.searchQuery ? `&q=${data.searchQuery}` : ''}{data.categorySlug ? `&category=${data.categorySlug}` : ''}{data.type ? `&type=${data.type}` : ''}"
								class="px-4 py-2 rounded-md border border-border bg-card hover:bg-accent transition-colors"
							>
								Previous
							</a>
						{/if}

						<span class="px-4 py-2 rounded-md bg-primary text-primary-foreground">
							Page {data.currentPage} of {data.totalPages}
						</span>

						{#if data.currentPage < data.totalPages}
							<a
								href="/products?page={data.currentPage + 1}{data.searchQuery ? `&q=${data.searchQuery}` : ''}{data.categorySlug ? `&category=${data.categorySlug}` : ''}{data.type ? `&type=${data.type}` : ''}"
								class="px-4 py-2 rounded-md border border-border bg-card hover:bg-accent transition-colors"
							>
								Next
							</a>
						{/if}
					</div>
				{/if}
			{/if}
		</div>
	</section>
</div>
