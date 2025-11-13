<script>
	export let product;
	export let publicUrl;
	
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

<a
	href="/products/{product.slug}"
	class="group bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all"
>
	<!-- Cover Image -->
	<div class="aspect-[2/3] bg-muted flex items-center justify-center overflow-hidden">
		{#if product.coverImage}
			<img 
				src={publicUrl + product.coverImage} 
				alt="{product.title} cover"
				class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"

			/>
		{:else}
			<svg class="w-16 h-16 text-muted-foreground opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
			</svg>
		{/if}
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
