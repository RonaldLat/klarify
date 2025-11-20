<script>
	import { ChevronRight, ChevronDown, Star, TrendingUp, Sparkles, Zap, BookOpen, Headphones, Clock } from '@lucide/svelte';
	
	let { data } = $props();
	const publicUrl = "https://pub-ddafa2dcdc11430f8cec35c3cad0b062.r2.dev/";
	
	let showAllCategories = $state(false);
	const visibleCategoriesCount = 6;

	function formatDuration(seconds) {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		if (hours > 0) return `${hours}h ${minutes}m`;
		return `${minutes}m`;
	}
	
	// Gradient colors for category pills
	const gradients = [
		'from-blue-500/20 to-cyan-500/20 border-blue-500/30 hover:border-blue-500',
		'from-purple-500/20 to-pink-500/20 border-purple-500/30 hover:border-purple-500',
		'from-green-500/20 to-emerald-500/20 border-green-500/30 hover:border-green-500',
		'from-orange-500/20 to-red-500/20 border-orange-500/30 hover:border-orange-500',
		'from-indigo-500/20 to-blue-500/20 border-indigo-500/30 hover:border-indigo-500',
		'from-rose-500/20 to-pink-500/20 border-rose-500/30 hover:border-rose-500',
	];
</script>

<div class="bg-background">
	<!-- Hero Section -->
	<section class="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background py-12 md:py-20 lg:py-24">
		<!-- Animated Background Elements -->
		<div class="absolute inset-0 overflow-hidden pointer-events-none">
			<div class="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
			<div class="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
		</div>
		
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
			<div class="text-center max-w-4xl mx-auto">
				<!-- Badge -->
				<div class="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-medium mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
					<Sparkles class="w-4 h-4" />
					<span>Kenya's Premier Digital Library</span>
				</div>
				
				<h1 class="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground mb-6 leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700" style="animation-delay: 100ms;">
					Learn Smarter with <br />
					<span class="text-primary">Audiobooks & eBooks</span>
				</h1>
				
				<p class="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700" style="animation-delay: 200ms;">
					Access thousands of books, audiobooks, and quick summaries. 
					<span class="text-foreground font-medium">Learn on the go</span> with affordable digital content starting at just KSh 50.
				</p>
				
				<div class="flex flex-col sm:flex-row justify-center gap-4 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700" style="animation-delay: 300ms;">
					{#if !data.user}
						<a
							href="/signup"
							class="group px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
						>
							Start Learning Free
							<ChevronRight class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
						</a>
						<a
							href="/products"
							class="px-8 py-4 bg-card border-2 border-border text-foreground font-semibold rounded-xl hover:border-primary transition-all flex items-center justify-center gap-2"
						>
							<BookOpen class="w-5 h-5" />
							Browse Library
						</a>
					{:else}
						<a
							href="/products"
							class="group px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
						>
							Explore Library
							<ChevronRight class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
						</a>
					{/if}
				</div>

				<!-- Stats -->
				<div class="grid grid-cols-3 gap-6 md:gap-12 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700" style="animation-delay: 400ms;">
					<div class="text-center">
						<div class="text-3xl md:text-4xl font-bold text-primary mb-2">1000+</div>
						<div class="text-sm md:text-base text-muted-foreground">Digital Books</div>
					</div>
					<div class="text-center border-x border-border">
						<div class="text-3xl md:text-4xl font-bold text-primary mb-2">KSh 50</div>
						<div class="text-sm md:text-base text-muted-foreground">Starting Price</div>
					</div>
					<div class="text-center">
						<div class="text-3xl md:text-4xl font-bold text-primary mb-2">24/7</div>
						<div class="text-sm md:text-base text-muted-foreground">Instant Access</div>
					</div>
				</div>
			</div>
		</div>
	</section>


	<!-- Featured Content Types -->
	<section class="py-12 md:py-16">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="grid md:grid-cols-3 gap-6">
				<!-- eBooks -->
				<a href="/products?type=EBOOK" class="group relative overflow-hidden bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-6 hover:shadow-xl transition-all hover:scale-[1.02]">
					<div class="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
					<BookOpen class="w-12 h-12 text-blue-600 dark:text-blue-400 mb-4 relative z-10" />
					<h3 class="text-xl font-bold text-foreground mb-2 relative z-10">eBooks</h3>
					<p class="text-muted-foreground mb-4 relative z-10">Read anytime, anywhere on any device</p>
					<div class="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium relative z-10">
						Browse eBooks
						<ChevronRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
					</div>
				</a>

				<!-- Audiobooks -->
				<a href="/products?type=AUDIOBOOK" class="group relative overflow-hidden bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-2xl p-6 hover:shadow-xl transition-all hover:scale-[1.02]">
					<div class="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
					<Headphones class="w-12 h-12 text-purple-600 dark:text-purple-400 mb-4 relative z-10" />
					<h3 class="text-xl font-bold text-foreground mb-2 relative z-10">Audiobooks</h3>
					<p class="text-muted-foreground mb-4 relative z-10">Listen while you commute or exercise</p>
					<div class="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium relative z-10">
						Browse Audiobooks
						<ChevronRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
					</div>
				</a>

				<!-- Summaries -->
				<a href="/products?type=SUMMARY" class="group relative overflow-hidden bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-2xl p-6 hover:shadow-xl transition-all hover:scale-[1.02]">
					<div class="absolute top-4 right-4 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
						NEW
					</div>
					<div class="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl"></div>
					<Zap class="w-12 h-12 text-amber-600 dark:text-amber-400 mb-4 relative z-10" />
					<h3 class="text-xl font-bold text-foreground mb-2 relative z-10">Quick Summaries</h3>
					<p class="text-muted-foreground mb-4 relative z-10">Learn key insights in 15-20 minutes</p>
					<div class="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium relative z-10">
						Try Summaries
						<ChevronRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
					</div>
				</a>
			</div>
		</div>
	</section>

	<!-- Featured Products -->
	<section class="py-12 md:py-20 bg-muted/20">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex items-center justify-between mb-8">
				<div>
					<h2 class="text-2xl md:text-3xl font-bold text-foreground mb-2">Featured This Week</h2>
					<p class="text-muted-foreground">Handpicked books our readers love</p>
				</div>
				<a href="/products" class="hidden md:flex items-center gap-2 text-primary hover:underline font-medium">
					View All
					<ChevronRight class="w-4 h-4" />
				</a>
			</div>
			
			{#if data.featuredProducts.length === 0}
				<div class="text-center py-16 text-muted-foreground">
					<BookOpen class="w-16 h-16 mx-auto mb-4 opacity-50" />
					<p class="text-lg">No featured products yet. Check back soon!</p>
				</div>
			{:else}
				<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
					{#each data.featuredProducts as product}
						<a
							href="/products/{product.slug}"
							class="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-xl hover:border-primary/50 transition-all duration-300"
						>
							<!-- Cover -->
							<div class="aspect-[2/3] bg-muted relative overflow-hidden">
								{#if product.coverImage}
									<img 
										src={publicUrl + product.coverImage} 
										alt={product.title}
										class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
									/>
								{:else}
									<div class="w-full h-full flex items-center justify-center">
										<BookOpen class="w-12 md:w-16 h-12 md:h-16 text-muted-foreground opacity-50" />
									</div>
								{/if}
								
								<!-- Featured Badge -->
								<div class="absolute top-2 right-2">
									<span class="flex items-center gap-1 px-2 py-1 bg-yellow-500 text-white text-xs font-bold rounded shadow-lg">
										<Star class="w-3 h-3 fill-current" />
										Featured
									</span>
								</div>
							</div>

							<!-- Content -->
							<div class="p-3 md:p-4">
								<h3 class="font-semibold text-sm md:text-base text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1 min-h-[2.5rem] md:min-h-[3rem]">
									{product.title}
								</h3>
								
								<p class="text-xs md:text-sm text-muted-foreground mb-2 truncate">
									{product.author}
								</p>

								<!-- Meta -->
								<div class="flex items-center gap-2 text-xs text-muted-foreground mb-3">
									<span class="px-2 py-0.5 bg-secondary rounded text-[10px] md:text-xs truncate">
										{product.type}
									</span>
									{#if product.duration}
										<span class="hidden sm:flex items-center gap-1">
											<Clock class="w-3 h-3" />
											{formatDuration(product.duration)}
										</span>
									{:else if product.pageCount}
										<span class="hidden sm:inline">{product.pageCount}p</span>
									{/if}
								</div>

								<!-- Price -->
								<div class="flex items-center justify-between">
									<div class="text-base md:text-lg font-bold text-primary">
										KSh {product.type === "BUNDLE" ? product.bundlePrice : product.type === "AUDIOBOOK" ? product.audioPrice : product.pdfPrice}
									</div>
									{#if product.rating > 0}
										<div class="flex items-center gap-1 text-xs">
											<Star class="w-3 h-3 md:w-4 md:h-4 text-yellow-500 fill-current" />
											<span class="font-medium">{product.rating.toFixed(1)}</span>
										</div>
									{/if}
								</div>
							</div>
						</a>
					{/each}
				</div>

				<!-- Mobile View All -->
				<div class="mt-8 text-center md:hidden">
					<a href="/products" class="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg">
						View All Products
						<ChevronRight class="w-4 h-4" />
					</a>
				</div>


			{/if}
      


	<!-- Categories Section - Compact Gradient Pills -->
	{#if data.categories.length > 0}
		<section class="py-8 mt-6 md:py-12 bg-muted/30 border-y border-border">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="flex items-center justify-between mb-6">
					<h2 class="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
						<TrendingUp class="w-5 h-5 md:w-6 md:h-6 text-primary" />
						Popular Categories
					</h2>
					
					{#if data.categories.length > visibleCategoriesCount}
						<button
							onclick={() => showAllCategories = !showAllCategories}
							class="flex items-center gap-1 text-sm text-primary hover:underline font-medium"
						>
							{showAllCategories ? 'Show Less' : 'View All'}
							<ChevronDown class="w-4 h-4 transition-transform {showAllCategories ? 'rotate-180' : ''}" />
						</button>
					{/if}
				</div>
				
				<!-- Categories Pills with Gradients -->
				<div class="flex flex-wrap gap-2">
					{#each data.categories.slice(0, showAllCategories ? data.categories.length : visibleCategoriesCount) as category, index}
						<a
							href="/products?category={category.slug}"
							class="group inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r {gradients[index % gradients.length]} border rounded-full hover:shadow-md transition-all text-sm"
						>
							<span class="font-medium text-foreground group-hover:text-primary transition-colors">
								{category.name}
							</span>
							<span class="px-1.5 py-0.5 bg-background/80 backdrop-blur-sm text-foreground text-xs font-bold rounded-full">
								{category._count.products}
							</span>
						</a>
					{/each}
				</div>
			</div>
		</section>
	{/if}
		</div>
	</section>

	<!-- CTA Section -->
	{#if !data.user}
		<section class="py-16 md:py-24 bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-primary-foreground relative overflow-hidden">
			<!-- Background Pattern -->
			<div class="absolute inset-0 opacity-10">
				<div class="absolute inset-0" style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 40px 40px;"></div>
			</div>
			
			<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
				<Sparkles class="w-12 h-12 mx-auto mb-6 animate-pulse" />
				<h2 class="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Ready to Start Your Learning Journey?</h2>
				<p class="text-lg md:text-xl opacity-90 mb-8 max-w-2xl mx-auto">
					Join thousands of readers accessing quality books, audiobooks, and summaries at affordable prices. Start learning today!
				</p>
				<div class="flex flex-col sm:flex-row gap-4 justify-center">
					<a
						href="/signup"
						class="group px-8 py-4 bg-background text-foreground font-semibold rounded-xl hover:bg-background/90 transition-all shadow-xl hover:scale-105 flex items-center justify-center gap-2"
					>
						Create Free Account
						<ChevronRight class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
					</a>
					<a
						href="/products"
						class="px-8 py-4 bg-primary-foreground/10 backdrop-blur-sm border-2 border-primary-foreground/20 text-primary-foreground font-semibold rounded-xl hover:bg-primary-foreground/20 transition-all flex items-center justify-center gap-2"
					>
						<BookOpen class="w-5 h-5" />
						Browse Library
					</a>
				</div>


			</div>
		</section>
	{/if}
</div>
