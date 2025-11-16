<script>
	import { Clock, Zap, Headphones, Star, Book } from '@lucide/svelte';
	
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

	// Check if this is a summary
	const isSummary = product.type === 'SUMMARY';
</script>

<a
	href="/products/{product.slug}"
	class="group bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all flex flex-col h-full
		{isSummary ? 'hover:border-amber-500/50' : ''}"
>
	<!-- Cover Image -->
	<div class="aspect-[2/3] bg-muted flex items-center justify-center overflow-hidden relative">
		{#if product.coverImage}
			<img 
				src={publicUrl + product.coverImage} 
				alt="{product.title} cover"
				class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
			/>
		{:else}
			<Book class="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground opacity-50" />
		{/if}

		<!-- Summary Badge - Top Left -->
		{#if isSummary}
			<div class="absolute top-2 left-2">
				<span class="inline-flex items-center gap-1 px-2 py-1 bg-amber-500 text-white text-xs font-semibold rounded-md shadow-lg">
					<Zap class="w-3 h-3" />
					Summary
				</span>
			</div>
		{/if}

		<!-- Duration Badge - Bottom Right (for summaries & audiobooks) -->
		{#if product.duration && (isSummary || product.type === 'AUDIOBOOK')}
			<div class="absolute bottom-2 right-2">
				<span class="inline-flex items-center gap-1 px-2 py-1 bg-black/80 text-white text-xs font-medium rounded backdrop-blur-sm">
					<Clock class="w-3 h-3" />
					{formatDuration(product.duration)}
				</span>
			</div>
		{/if}

		<!-- Featured Badge - Top Right -->
		{#if product.featured}
			<div class="absolute top-2 right-2">
				<span class="inline-flex items-center gap-1 px-2 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-md shadow-lg">
					<Star class="w-3 h-3 fill-current" />
					Featured
				</span>
			</div>
		{/if}
	</div>

	<div class="p-3 sm:p-4 flex flex-col flex-grow">
		<!-- Title -->
		<h3 class="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1 text-sm sm:text-base">
			{product.title}
		</h3>

		<!-- Author -->
		<p class="text-xs sm:text-sm text-muted-foreground mb-2">
			by {product.author}
		</p>

		<!-- Summary-Specific Info -->
		{#if isSummary}
			<div class="flex flex-col gap-1.5 mb-3">
				<!-- Key Takeaways -->
				{#if product.keyTakeaways}
					<div class="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
						<Zap class="w-3.5 h-3.5" />
						<span class="font-medium">{product.keyTakeaways} key insights</span>
					</div>
				{/if}

				<!-- Audio Format -->
				<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
					<Headphones class="w-3.5 h-3.5" />
					<span>Audio Summary</span>
				</div>

				<!-- Original Book Link (if available) -->
				{#if product.originalProduct}
					<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
						<Book class="w-3.5 h-3.5" />
						<span class="truncate">From: {product.originalProduct.title}</span>
					</div>
				{/if}
			</div>
		{:else}
			<!-- Regular Product Info -->
			<div class="flex items-center gap-2 text-xs text-muted-foreground mb-3">
				<span class="px-2 py-0.5 bg-secondary rounded">
					{product.type}
				</span>
				{#if product.duration}
					<span class="flex items-center gap-1">
						<Clock class="w-3 h-3" />
						{formatDuration(product.duration)}
					</span>
				{:else if product.pageCount}
					<span>{product.pageCount} pages</span>
				{/if}
			</div>
		{/if}

		<!-- Spacer to push price to bottom -->
		<div class="flex-grow"></div>

		<!-- Price & Rating -->
		<div class="flex items-center justify-between mt-auto pt-3 border-t border-border">
			<div>
				{#if product.type === 'BUNDLE'}
					<div class="text-base sm:text-lg font-bold text-primary">
						KSh {product.bundlePrice}
					</div>
					<div class="text-xs text-muted-foreground line-through">
						KSh {product.pdfPrice + product.audioPrice}
					</div>
				{:else if product.type === 'AUDIOBOOK' || isSummary}
					<div class="text-base sm:text-lg font-bold {isSummary ? 'text-amber-600 dark:text-amber-400' : 'text-primary'}">
						KSh {product.audioPrice}
					</div>
				{:else}
					<div class="text-base sm:text-lg font-bold text-primary">
						KSh {product.pdfPrice}
					</div>
				{/if}
			</div>

			<!-- Rating -->
			{#if product.rating > 0}
				<div class="flex items-center gap-1">
					<Star class="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 fill-current" />
					<span class="text-xs sm:text-sm font-medium">{product.rating.toFixed(1)}</span>
				</div>
			{/if}
		</div>
	</div>
</a>
