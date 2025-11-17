<script>
	import { Book, Headphones, Zap, Download, Clock, AlertCircle, Package } from '@lucide/svelte';
	
	let { data } = $props();
	const publicUrl = "https://pub-ddafa2dcdc11430f8cec35c3cad0b062.r2.dev/";

	// Group purchases by product type
	const groupedPurchases = $derived(() => {
		const groups = {
			SUMMARY: [],
			AUDIOBOOK: [],
			EBOOK: [],
			BUNDLE: [],
			MAGAZINE: []
		};
		
		data.library.forEach(purchase => {
			const type = purchase.product.type;
			if (groups[type]) {
				groups[type].push(purchase);
			}
		});
		
		return groups;
	});

	// Get active tab counts
	const counts = $derived({
		SUMMARY: groupedPurchases().SUMMARY.length,
		AUDIOBOOK: groupedPurchases().AUDIOBOOK.length,
		EBOOK: groupedPurchases().EBOOK.length,
		BUNDLE: groupedPurchases().BUNDLE.length,
		MAGAZINE: groupedPurchases().MAGAZINE.length,
		ALL: data.library.length
	});

	let activeTab = $state('ALL');

	// Filter purchases based on active tab
	const displayedPurchases = $derived(() => {
		if (activeTab === 'ALL') return data.library;
		return groupedPurchases()[activeTab];
	});

	/**
	 * Format date
	 */
	function formatDate(dateString) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	}

	/**
	 * Get time remaining
	 */
	function getTimeRemaining(expiresAt) {
		const now = new Date();
		const expiry = new Date(expiresAt);
		const diff = expiry - now;
		
		if (diff <= 0) return "Expired";
		
		const hours = Math.floor(diff / (1000 * 60 * 60));
		if (hours < 24) return `${hours}h remaining`;
		
		const days = Math.floor(hours / 24);
		return `${days}d remaining`;
	}

	/**
	 * Get format display
	 */
	function getFormatDisplay(format) {
		if (format === 'BUNDLE') return 'Audio + PDF';
		return format;
	}

	/**
	 * Get product type badge color
	 */
	function getTypeColor(type) {
		switch(type) {
			case 'SUMMARY': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
			case 'AUDIOBOOK': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
			case 'BUNDLE': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
			case 'EBOOK': return 'bg-green-500/10 text-green-600 dark:text-green-400';
			case 'MAGAZINE': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400';
			default: return 'bg-secondary text-secondary-foreground';
		}
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
			<!-- Empty State -->
			<div class="text-center py-16">
				<div class="w-24 h-24 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
					<Book class="w-12 h-12 text-primary" />
				</div>
				<h3 class="text-xl font-semibold text-foreground mb-2">Your Library is Empty</h3>
				<p class="text-muted-foreground mb-6">Start building your collection today!</p>
				<a
					href="/products"
					class="inline-block px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
				>
					Browse Products
				</a>
			</div>
		{:else}
			<!-- Filter Tabs -->
			<div class="mb-6 border-b border-border overflow-x-auto">
				<div class="flex gap-1 min-w-max">
					<button
						onclick={() => activeTab = 'ALL'}
						class="px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap {activeTab === 'ALL' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}"
					>
						All Items ({counts.ALL})
					</button>
					{#if counts.SUMMARY > 0}
						<button
							onclick={() => activeTab = 'SUMMARY'}
							class="px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 {activeTab === 'SUMMARY' ? 'border-amber-500 text-amber-600' : 'border-transparent text-muted-foreground hover:text-foreground'}"
						>
							<Zap class="w-4 h-4" />
							Summaries ({counts.SUMMARY})
						</button>
					{/if}
					{#if counts.AUDIOBOOK > 0}
						<button
							onclick={() => activeTab = 'AUDIOBOOK'}
							class="px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 {activeTab === 'AUDIOBOOK' ? 'border-blue-500 text-blue-600' : 'border-transparent text-muted-foreground hover:text-foreground'}"
						>
							<Headphones class="w-4 h-4" />
							Audiobooks ({counts.AUDIOBOOK})
						</button>
					{/if}
					{#if counts.BUNDLE > 0}
						<button
							onclick={() => activeTab = 'BUNDLE'}
							class="px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 {activeTab === 'BUNDLE' ? 'border-purple-500 text-purple-600' : 'border-transparent text-muted-foreground hover:text-foreground'}"
						>
							<Package class="w-4 h-4" />
							Bundles ({counts.BUNDLE})
						</button>
					{/if}
					{#if counts.EBOOK > 0}
						<button
							onclick={() => activeTab = 'EBOOK'}
							class="px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 {activeTab === 'EBOOK' ? 'border-green-500 text-green-600' : 'border-transparent text-muted-foreground hover:text-foreground'}"
						>
							<Book class="w-4 h-4" />
							eBooks ({counts.EBOOK})
						</button>
					{/if}
					{#if counts.MAGAZINE > 0}
						<button
							onclick={() => activeTab = 'MAGAZINE'}
							class="px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap {activeTab === 'MAGAZINE' ? 'border-orange-500 text-orange-600' : 'border-transparent text-muted-foreground hover:text-foreground'}"
						>
							Magazines ({counts.MAGAZINE})
						</button>
					{/if}
				</div>
			</div>

			<!-- Library Grid -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{#each displayedPurchases() as purchase}
					{@const isSummary = purchase.product.type === 'SUMMARY'}
					{@const isBundle = purchase.format === 'BUNDLE'}
					
					<div class="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all">
						<div class="flex gap-4 p-5">
							<!-- Product Image -->
							<div class="flex-shrink-0">
								<div class="w-24 h-32 md:w-28 md:h-40 bg-muted rounded overflow-hidden relative group">
									{#if purchase.product.coverImage}
										<img
											src={publicUrl + purchase.product.coverImage}
											alt={purchase.product.title}
											class="w-full h-full object-cover"
										/>
									{:else}
										<div class="w-full h-full flex items-center justify-center">
											<Book class="w-8 h-8 text-muted-foreground opacity-50" />
										</div>
									{/if}
									
									<!-- Quick view link -->
									<a 
										href="/products/{purchase.product.slug}"
										class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
									>
										<span class="text-white text-xs font-medium">View Details</span>
									</a>
								</div>
							</div>

							<!-- Product Info -->
							<div class="flex-1 min-w-0 flex flex-col">
								<!-- Title & badges -->
								<div class="mb-3">
									<div class="flex flex-wrap gap-2 mb-2">
										<span class="text-xs px-2 py-1 {getTypeColor(purchase.product.type)} rounded font-medium">
											{purchase.product.type}
										</span>
										{#if isBundle}
											<span class="text-xs px-2 py-1 bg-primary/10 text-primary rounded font-medium flex items-center gap-1">
												<Package class="w-3 h-3" />
												Bundle
											</span>
										{/if}
									</div>
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

								<!-- Purchase metadata -->
								<div class="grid grid-cols-2 gap-x-4 gap-y-2 mb-4 text-xs">
									<div>
										<div class="text-muted-foreground">Purchased</div>
										<div class="text-foreground font-medium">{formatDate(purchase.createdAt)}</div>
									</div>
									<div>
										<div class="text-muted-foreground">Format</div>
										<div class="text-foreground font-medium">{getFormatDisplay(purchase.format)}</div>
									</div>
									<div>
										<div class="text-muted-foreground">Downloads</div>
										<div class="text-foreground font-medium">
											{purchase.downloadStatus.downloadCount}/{purchase.downloadStatus.maxDownloads}
										</div>
									</div>
									<div>
										<div class="text-muted-foreground">Expires</div>
										<div class="text-foreground font-medium {purchase.downloadStatus.expired ? 'text-destructive' : ''}">
											{getTimeRemaining(purchase.expiresAt)}
										</div>
									</div>
								</div>

								<!-- Spacer -->
								<div class="flex-1"></div>

								<!-- Download Status & Actions -->
								{#if purchase.downloadStatus.canDownload}
									<div class="flex flex-col sm:flex-row gap-2">
										<a
											href="/download/{purchase.id}"
											class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 {isSummary ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary hover:bg-primary/90'} text-white font-semibold rounded-lg transition-colors text-sm"
										>
											{#if isSummary}
												<Zap class="w-4 h-4" />
												Listen Now
											{:else}
												<Download class="w-4 h-4" />
												Download
											{/if}
											<span class="text-xs opacity-90">
												({purchase.downloadStatus.downloadsRemaining} left)
											</span>
										</a>
									</div>
								{:else if purchase.downloadStatus.expired}
									<div class="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-xs">
										<Clock class="w-4 h-4 flex-shrink-0" />
										<span>Download period expired (48 hours)</span>
									</div>
								{:else if purchase.downloadStatus.limitReached}
									<div class="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-xs">
										<AlertCircle class="w-4 h-4 flex-shrink-0" />
										<span>Download limit reached</span>
									</div>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>

			<!-- Help Text -->
			<div class="mt-8 p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 rounded-lg">
				<h3 class="font-semibold text-foreground mb-3 flex items-center gap-2">
					<svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					Download Policy
				</h3>
				<ul class="text-sm text-muted-foreground space-y-2">
					<li class="flex items-start gap-2">
						<span class="text-primary mt-0.5">•</span>
						<span>Each purchase can be downloaded <strong class="text-foreground">3 times</strong></span>
					</li>
					<li class="flex items-start gap-2">
						<span class="text-primary mt-0.5">•</span>
						<span>Downloads expire <strong class="text-foreground">48 hours</strong> after purchase</span>
					</li>
					<li class="flex items-start gap-2">
						<span class="text-primary mt-0.5">•</span>
						<span>Download links are valid for <strong class="text-foreground">1 hour</strong></span>
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
