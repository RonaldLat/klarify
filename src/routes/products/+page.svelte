<script>
    import ProductCard from '$lib/components/ProductCard.svelte';

	let { data } = $props();
  const publicUrl ="https://pub-ddafa2dcdc11430f8cec35c3cad0b062.r2.dev/"

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
				<div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{#each data.products as product}
						<ProductCard {product} {publicUrl} />
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
