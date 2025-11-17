<script>
	import { Book, Headphones, Zap, FileText, Star, Package } from '@lucide/svelte';
	
	let { product, publicUrl } = $props();
	
	const isSummary = product.type === 'SUMMARY';
	const isBundle = product.type === 'BUNDLE';
	
	// Get display price
	function getDisplayPrice() {
		if (isSummary) return product.audioPrice;
		if (product.type === 'AUDIOBOOK') return product.audioPrice;
		if (product.type === 'BUNDLE') return product.bundlePrice || (product.pdfPrice + product.audioPrice);
		return product.pdfPrice;
	}
	
	// Format duration
	function formatDuration(seconds) {
		if (!seconds) return null;
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		if (hours > 0) return `${hours}h ${minutes}m`;
		return `${minutes}m`;
	}
</script>

<a
	href="/products/{product.slug}"
	class="group bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all duration-300 flex flex-col"
>
	<!-- Cover Image -->
	<div class="aspect-[2/3] bg-muted flex items-center justify-center overflow-hidden relative">
		{#if product.coverImage}
			<img 
				src={publicUrl + product.coverImage} 
				alt="{product.title} cover"
				class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
			/>
		{:else}
			<Book class="w-12 h-12 md:w-16 md:h-16 text-muted-foreground opacity-50" />
		{/if}
		
		<!-- Type Badge -->
		<div class="absolute top-2 left-2">
			{#if isSummary}
				<span class="inline-flex items-center gap-1 px-2 py-1 bg-amber-500 text-white text-xs font-semibold rounded shadow-lg">
					<Zap class="w-3 h-3" />
					Summary
				</span>
			{:else if isBundle}
				<span class="inline-flex items-center gap-1 px-2 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded shadow-lg">
					<Package class="w-3 h-3" />
					Bundle
				</span>
			{/if}
		</div>

		<!-- Featured Badge -->
		{#if product.featured && !isSummary}
			<div class="absolute top-2 right-2">
				<span class="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500 text-white text-xs font-semibold rounded shadow-lg">
					<Star class="w-3 h-3 fill-current" />
					Featured
				</span>
			</div>
		{/if}
	</div>

	<!-- Content -->
	<div class="p-3 md:p-4 flex-1 flex flex-col">
		<!-- Title -->
		<h3 class="font-semibold text-sm md:text-base text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1 min-h-[2.5rem] md:min-h-[3rem]">
			{product.title}
		</h3>
		
		<!-- Author -->
		<p class="text-xs md:text-sm text-muted-foreground mb-2 truncate">
			{product.author}
		</p>

		<!-- Metadata -->
		<div class="flex flex-wrap items-center gap-2 mb-3 text-xs text-muted-foreground">
			<!-- Format Icons -->
			<div class="flex items-center gap-1">
				{#if isSummary}
					<Headphones class="w-3.5 h-3.5 text-amber-600" />
					<span class="text-amber-600 dark:text-amber-400 font-medium">Audio</span>
				{:else if isBundle}
					<div class="flex items-center gap-0.5">
						<Book class="w-3.5 h-3.5 text-primary" />
						<span class="text-primary">+</span>
						<Headphones class="w-3.5 h-3.5 text-primary" />
					</div>
				{:else if product.type === 'AUDIOBOOK'}
					<Headphones class="w-3.5 h-3.5" />
					<span>Audio</span>
				{:else if product.type === 'EBOOK'}
					<Book class="w-3.5 h-3.5" />
					<span>eBook</span>
				{:else if product.type === 'MAGAZINE'}
					<FileText class="w-3.5 h-3.5" />
					<span>Magazine</span>
				{/if}
			</div>

			<!-- Duration or Page Count -->
			{#if product.duration && formatDuration(product.duration)}
				<span class="text-muted-foreground">• {formatDuration(product.duration)}</span>
			{:else if product.pageCount}
				<span class="text-muted-foreground">• {product.pageCount}p</span>
			{/if}
		</div>

		<!-- Summary-specific info -->
		{#if isSummary && product.keyTakeaways}
			<div class="mb-3 text-xs">
				<span class="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full font-medium">
					<Zap class="w-3 h-3" />
					{product.keyTakeaways} Key Insights
				</span>
			</div>
		{/if}

		<!-- Rating -->
		{#if product.rating > 0}
			<div class="flex items-center gap-1 mb-3 text-xs">
				<Star class="w-3.5 h-3.5 text-yellow-500 fill-current" />
				<span class="font-medium text-foreground">{product.rating.toFixed(1)}</span>
				<span class="text-muted-foreground">({product.reviewCount})</span>
			</div>
		{/if}

		<!-- Spacer -->
		<div class="flex-1"></div>

		<!-- Price -->
		<div class="flex items-center justify-between pt-2 border-t border-border">
			<div>
				<div class="text-sm md:text-base font-bold {isSummary ? 'text-amber-600 dark:text-amber-400' : 'text-primary'}">
					KSh {getDisplayPrice()}
				</div>
				{#if isBundle}
					<div class="text-xs text-muted-foreground">Audio + PDF</div>
				{/if}
			</div>
			<div class="text-xs text-primary group-hover:translate-x-1 transition-transform">
				View →
			</div>
		</div>
	</div>
</a>
