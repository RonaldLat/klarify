<script>
	import ProductCard from '$lib/components/ProductCard.svelte';

	let { data } = $props();
	const publicUrl = "https://pub-ddafa2dcdc11430f8cec35c3cad0b062.r2.dev/";

	const features = [
		{ icon: '⚡', title: 'Quick Learning', desc: 'Grasp key insights in 15-20 minutes' },
		{ icon: '🎧', title: 'Audio & Text', desc: 'Listen or read on the go' },
		{ icon: '📚', title: 'Expert Curated', desc: 'Professionally condensed content' },
		{ icon: '💡', title: 'Key Takeaways', desc: 'Focus on what matters most' }
	];
</script>

<svelte:head>
	<title>Book Summaries - Quick Insights from Best Books | Klarify</title>
	<meta name="description" content="Get key insights from bestselling books in 15-20 minutes. Audio and text summaries professionally curated for busy learners." />
</svelte:head>

<div class="bg-background">
	<!-- Hero Section -->
	<section class="bg-gradient-to-br from-amber-500/10 via-background to-background border-b border-border py-12 sm:py-16">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="text-center max-w-3xl mx-auto">
				<div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm font-medium mb-6">
					⚡ Learn Faster
				</div>
				<h1 class="text-4xl sm:text-5xl font-bold text-foreground mb-6">
					Book Summaries in <span class="text-amber-600 dark:text-amber-400">15 Minutes</span>
				</h1>
				<p class="text-lg sm:text-xl text-muted-foreground mb-8">
					Get the key insights from bestselling books without spending hours reading. Perfect for busy professionals and lifelong learners.
				</p>
				
				<!-- Search -->
				<form method="GET" class="max-w-2xl mx-auto mb-8">
					<div class="relative">
						<input
							type="search"
							name="q"
							value={data.searchQuery}
							placeholder="Search summaries by title, author, or topic..."
							class="w-full px-6 py-4 rounded-full border-2 border-input bg-background text-foreground
								focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-base"
						/>
						<button 
							type="submit"
							class="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full font-medium transition-colors"
						>
							Search
						</button>
					</div>
				</form>
			</div>

			<!-- Features Grid -->
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
				{#each features as feature}
					<div class="bg-card border border-border rounded-lg p-4 text-center">
						<div class="text-3xl mb-2">{feature.icon}</div>
						<h3 class="font-semibold text-foreground mb-1">{feature.title}</h3>
						<p class="text-sm text-muted-foreground">{feature.desc}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Filters Section -->
	<section class="bg-card border-b border-border py-6">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
				<!-- Summary Type Filter -->
				<div class="flex gap-2 flex-wrap">
					<span class="text-sm text-muted-foreground self-center mr-2">Format:</span>
					<a
						href="/summaries"
						class="px-4 py-2 rounded-md text-sm font-medium transition-colors
							{!data.summaryType ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}"
					>
						All Formats
					</a>
					<a
						href="/summaries?format=AUDIO"
						class="px-4 py-2 rounded-md text-sm font-medium transition-colors
							{data.summaryType === 'AUDIO' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}"
					>
						🎧 Audio
					</a>
					<a
						href="/summaries?format=TEXT"
						class="px-4 py-2 rounded-md text-sm font-medium transition-colors
							{data.summaryType === 'TEXT' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}"
					>
						📄 Text
					</a>
					<a
						href="/summaries?format=BOTH"
						class="px-4 py-2 rounded-md text-sm font-medium transition-colors
							{data.summaryType === 'BOTH' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}"
					>
						📚 Both
					</a>
				</div>

				<!-- Sort -->
				<div class="flex gap-2 items-center">
					<span class="text-sm text-muted-foreground">Sort:</span>
					<select 
						name="sort" 
						onchange="window.location.href = `/summaries?sort=${this.value}`"
						class="px-4 py-2 rounded-md border border-input bg-background text-sm"
					>
						<option value="newest" selected={data.sortBy === 'newest'}>Newest First</option>
						<option value="popular" selected={data.sortBy === 'popular'}>Most Popular</option>
						<option value="rating" selected={data.sortBy === 'rating'}>Highest Rated</option>
					</select>
				</div>
			</div>

			<!-- Categories -->
			{#if data.categories.length > 0}
				<div class="mt-4 flex flex-wrap gap-2">
					<span class="text-sm text-muted-foreground">Categories:</span>
					{#each data.categories as category}
						<a
							href="/summaries?category={category.slug}"
							class="px-3 py-1 rounded-full text-xs font-medium transition-colors
								{data.categorySlug === category.slug 
									? 'bg-amber-500 text-white' 
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
				{data.totalCount} {data.totalCount === 1 ? 'summary' : 'summaries'} found
				{#if data.searchQuery}
					for "{data.searchQuery}"
				{/if}
			</p>
		</div>
	</section>

	<!-- Summaries Grid -->
	<section class="pb-20">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			{#if data.summaries.length === 0}
				<!-- Empty State -->
				<div class="text-center py-16">
					<div class="text-6xl mb-6">📚</div>
					<h3 class="text-xl font-semibold text-foreground mb-2">No summaries found</h3>
					<p class="text-muted-foreground mb-6">Try adjusting your search or filters</p>
					<a href="/summaries" class="text-primary hover:underline">Clear filters</a>
				</div>
			{:else}
				<!-- Summaries Grid -->
				<div class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
					{#each data.summaries as summary}
						<ProductCard product={summary} {publicUrl} />
					{/each}
				</div>

				<!-- Pagination -->
				{#if data.totalPages > 1}
					<div class="mt-8 sm:mt-12 flex justify-center gap-2">
						{#if data.currentPage > 1}
							<a
								href="/summaries?page={data.currentPage - 1}{data.searchQuery ? `&q=${data.searchQuery}` : ''}{data.categorySlug ? `&category=${data.categorySlug}` : ''}{data.summaryType ? `&format=${data.summaryType}` : ''}"
								class="px-3 sm:px-4 py-2 rounded-md border border-border bg-card hover:bg-accent transition-colors text-sm sm:text-base"
							>
								Previous
							</a>
						{/if}

						<span class="px-3 sm:px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm sm:text-base">
							Page {data.currentPage} of {data.totalPages}
						</span>

						{#if data.currentPage < data.totalPages}
							<a
								href="/summaries?page={data.currentPage + 1}{data.searchQuery ? `&q=${data.searchQuery}` : ''}{data.categorySlug ? `&category=${data.categorySlug}` : ''}{data.summaryType ? `&format=${data.summaryType}` : ''}"
								class="px-3 sm:px-4 py-2 rounded-md border border-border bg-card hover:bg-accent transition-colors text-sm sm:text-base"
							>
								Next
							</a>
						{/if}
					</div>
				{/if}
			{/if}
		</div>
	</section>

	<!-- CTA Section -->
	<section class="bg-gradient-to-br from-amber-500/10 via-background to-background border-t border-border py-16">
		<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
			<h2 class="text-3xl font-bold text-foreground mb-4">
				Start Learning Smarter Today
			</h2>
			<p class="text-lg text-muted-foreground mb-8">
				Join thousands of learners who are getting more done in less time with our expert-curated book summaries.
			</p>
			<a 
				href="/products"
				class="inline-flex items-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold transition-colors"
			>
				Browse All Products
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
				</svg>
			</a>
		</div>
	</section>
</div>
