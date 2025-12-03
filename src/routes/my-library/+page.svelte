<script>
	import { Book, Headphones, Zap, Download, Search, Heart, Share2 } from '@lucide/svelte';
	
	let { data } = $props();
	const publicUrl = "https://pub-ddafa2dcdc11430f8cec35c3cad0b062.r2.dev/";

	// Search and filter state
	let searchQuery = $state('');
	let activeFilter = $state('ALL');

	// Filter purchases
	const filteredPurchases = $derived(() => {
		let purchases = data.library;
		
		// Filter by type
		if (activeFilter !== 'ALL') {
			purchases = purchases.filter(p => {
				if (activeFilter === 'SUMMARY') return p.product.type.includes('SUMMARY');
				if (activeFilter === 'AUDIOBOOK') return p.product.type.includes('AUDIOBOOK') && p.format !== 'SUMMARY';
				if (activeFilter === 'EBOOK') return p.format === 'PDF';
				return true;
			});
		}
		
		// Search
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			purchases = purchases.filter(p => 
				p.product.title.toLowerCase().includes(query) ||
				p.product.author.toLowerCase().includes(query)
			);
		}
		
		return purchases;
	});

	// Get counts for tabs
	const counts = $derived({
		ALL: data.library.length,
		EBOOK: data.library.filter(p => p.format === 'PDF').length,
		AUDIOBOOK: data.library.filter(p => p.product.type.includes('AUDIOBOOK') && p.format !== 'SUMMARY').length,
		SUMMARY: data.library.filter(p => p.product.type.includes('SUMMARY')).length,
	});

	function formatDate(dateString) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	}

	function getFormatDisplay(format) {
		if (format === 'BUNDLE') return 'Audio + PDF';
		return format;
	}

	function getTypeColor(type) {
		if (type.includes('SUMMARY')) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
		if (type.includes('AUDIOBOOK')) return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
		return 'bg-green-500/10 text-green-600 dark:text-green-400';
	}
</script>

<svelte:head>
	<title>My Library - Klarify</title>
</svelte:head>

<div class="min-h-screen bg-background py-8 md:py-12">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl md:text-4xl font-bold text-foreground mb-2">My Library</h1>
			<p class="text-muted-foreground">
				{data.library.length} {data.library.length === 1 ? 'item' : 'items'} in your collection
			</p>
		</div>

		{#if data.library.length === 0}
			<!-- Empty State with Recommendations -->
			<div class="text-center py-16">
				<div class="w-24 h-24 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
					<Book class="w-12 h-12 text-primary" />
				</div>
				<h3 class="text-2xl font-semibold text-foreground mb-3">Start Your Library</h3>
				<p class="text-muted-foreground mb-8 max-w-md mx-auto">
					Get your first book free and start learning today!
				</p>
				<a
					href="/products"
					class="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-colors"
				>
					Browse Free Books
				</a>
			</div>
		{:else}
			<!-- Search & Filter Bar -->
			<div class="mb-6 flex flex-col sm:flex-row gap-4">
				<!-- Search -->
				<div class="flex-1 relative">
					<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
					<input
						bind:value={searchQuery}
						type="search"
						placeholder="Search your library..."
						class="w-full pl-10 pr-4 py-3 rounded-lg border border-input bg-background text-foreground
							focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
					/>
				</div>
			</div>

			<!-- Filter Tabs - Simplified -->
			<div class="mb-6 border-b border-border overflow-x-auto">
				<div class="flex gap-1 min-w-max">
					<button
						onclick={() => activeFilter = 'ALL'}
						class="px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap
							{activeFilter === 'ALL' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}"
					>
						All ({counts.ALL})
					</button>
					{#if counts.EBOOK > 0}
						<button
							onclick={() => activeFilter = 'EBOOK'}
							class="px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2
								{activeFilter === 'EBOOK' ? 'border-green-500 text-green-600' : 'border-transparent text-muted-foreground hover:text-foreground'}"
						>
							<Book class="w-4 h-4" />
							Books ({counts.EBOOK})
						</button>
					{/if}
					{#if counts.AUDIOBOOK > 0}
						<button
							onclick={() => activeFilter = 'AUDIOBOOK'}
							class="px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2
								{activeFilter === 'AUDIOBOOK' ? 'border-blue-500 text-blue-600' : 'border-transparent text-muted-foreground hover:text-foreground'}"
						>
							<Headphones class="w-4 h-4" />
							Audio ({counts.AUDIOBOOK})
						</button>
					{/if}
					{#if counts.SUMMARY > 0}
						<button
							onclick={() => activeFilter = 'SUMMARY'}
							class="px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2
								{activeFilter === 'SUMMARY' ? 'border-amber-500 text-amber-600' : 'border-transparent text-muted-foreground hover:text-foreground'}"
						>
							<Zap class="w-4 h-4" />
							Summaries ({counts.SUMMARY})
						</button>
					{/if}
				</div>
			</div>

			<!-- Library Grid -->
			{#if filteredPurchases().length === 0}
				<div class="text-center py-12">
					<p class="text-muted-foreground mb-4">No items match your search</p>
					<button
						onclick={() => { searchQuery = ''; activeFilter = 'ALL'; }}
						class="text-primary hover:underline"
					>
						Clear filters
					</button>
				</div>
			{:else}
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{#each filteredPurchases() as purchase}
						{@const isSummary = purchase.product.type.includes('SUMMARY')}
						
						<div class="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all">
							<div class="flex gap-4 p-5">
								<!-- Product Image -->
								<a href="/products/{purchase.product.slug}" class="flex-shrink-0">
									<div class="w-24 h-32 md:w-28 md:h-40 bg-muted rounded overflow-hidden relative group">
										{#if purchase.product.coverImage}
											<img
												src={publicUrl + purchase.product.coverImage}
												alt={purchase.product.title}
												class="w-full h-full object-cover group-hover:scale-110 transition-transform"
												loading="lazy"
											/>
										{:else}
											<div class="w-full h-full flex items-center justify-center">
												<Book class="w-8 h-8 text-muted-foreground opacity-50" />
											</div>
										{/if}
									</div>
								</a>

								<!-- Product Info -->
								<div class="flex-1 min-w-0 flex flex-col">
									<!-- Title & Type Badge -->
									<div class="mb-3">
										<span class="text-xs px-2 py-1 {getTypeColor(purchase.product.type)} rounded font-medium inline-block mb-2">
											{isSummary ? 'SUMMARY' : purchase.format}
										</span>
										<a 
											href="/products/{purchase.product.slug}"
											class="block"
										>
											<h3 class="text-base md:text-lg font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 mb-1">
												{purchase.product.title}
											</h3>
										</a>
										<p class="text-sm text-muted-foreground">
											by {purchase.product.author}
										</p>
									</div>

									<!-- Purchase Info -->
									<div class="text-xs text-muted-foreground mb-4">
										Purchased {formatDate(purchase.createdAt)}
									</div>

									<!-- Spacer -->
									<div class="flex-1"></div>

									<!-- Actions -->
									{#if purchase.downloadStatus.canDownload}
										<div class="flex gap-2">
											<a
												href="/download/{purchase.id}"
												class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 
													{isSummary ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary hover:bg-primary/90'} 
													text-white font-semibold rounded-lg transition-colors text-sm"
											>
												{#if isSummary}
													<Zap class="w-4 h-4" />
													Listen
												{:else}
													<Download class="w-4 h-4" />
													Download
												{/if}
											</a>
											
											<!-- Quick Actions -->
											<button
												title="Add to favorites"
												class="px-3 py-2.5 border border-border hover:bg-accent rounded-lg transition-colors"
											>
												<Heart class="w-4 h-4" />
											</button>
											<button
												title="Share"
												class="px-3 py-2.5 border border-border hover:bg-accent rounded-lg transition-colors"
											>
												<Share2 class="w-4 h-4" />
											</button>
										</div>
									{:else if purchase.downloadStatus.limitReached}
										<div class="p-3 bg-muted border border-border rounded-lg text-xs text-muted-foreground">
											Download limit reached. Contact support for help.
										</div>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Info Card - Simplified -->
			<div class="mt-8 p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 rounded-lg">
				<h3 class="font-semibold text-foreground mb-3 flex items-center gap-2">
					<svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					Your Downloads
				</h3>
				<ul class="text-sm text-muted-foreground space-y-2">
					<li class="flex items-start gap-2">
						<span class="text-primary mt-0.5">•</span>
						<span>You can download each book up to <strong class="text-foreground">100 times</strong></span>
					</li>
					<li class="flex items-start gap-2">
						<span class="text-primary mt-0.5">•</span>
						<span>Download links are valid for <strong class="text-foreground">1 hour</strong></span>
					</li>
					<li class="flex items-start gap-2">
						<span class="text-primary mt-0.5">•</span>
						<span>Your books never expire - download anytime</span>
					</li>
					<li class="flex items-start gap-2">
						<span class="text-primary mt-0.5">•</span>
						<span>Need help? Contact <a href="mailto:support@klarify.com" class="text-primary hover:underline font-medium">support@klarify.com</a></span>
					</li>
				</ul>
			</div>
		{/if}
	</div>
</div>
