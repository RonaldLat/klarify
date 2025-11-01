<script>
	let { data } = $props();
	const publicUrl = "https://pub-ddafa2dcdc11430f8cec35c3cad0b062.r2.dev/";

	/**
	 * Format date to readable string
	 */
	function formatDate(dateString) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	}

	/**
	 * Get time remaining until expiry
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
				{data.library.length} {data.library.length === 1 ? 'purchase' : 'purchases'}
			</p>
		</div>

		{#if data.library.length === 0}
			<!-- Empty State -->
			<div class="text-center py-16">
				<svg class="w-24 h-24 mx-auto mb-6 text-muted-foreground opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
				</svg>
				<h3 class="text-xl font-semibold text-foreground mb-2">No purchases yet</h3>
				<p class="text-muted-foreground mb-6">Start building your library today!</p>
				<a
					href="/products"
					class="inline-block px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
				>
					Browse Products
				</a>
			</div>
		{:else}
			<!-- Library Grid -->
			<div class="grid grid-cols-1 gap-6">
				{#each data.library as purchase}
					<div class="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
						<div class="flex flex-col md:flex-row gap-6 p-6">
							<!-- Product Image -->
							<div class="flex-shrink-0">
								<div class="w-32 h-40 bg-muted rounded overflow-hidden">
									{#if purchase.product.coverImage}
										<img
											src={publicUrl + purchase.product.coverImage}
											alt={purchase.product.title}
											class="w-full h-full object-cover"
										/>
									{:else}
										<div class="w-full h-full flex items-center justify-center">
											<svg class="w-12 h-12 text-muted-foreground opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
											</svg>
										</div>
									{/if}
								</div>
							</div>

							<!-- Product Info -->
							<div class="flex-1 min-w-0">
								<div class="flex items-start justify-between mb-3">
									<div class="flex-1">
										<h3 class="text-xl font-semibold text-foreground mb-1">
											{purchase.product.title}
										</h3>
										<p class="text-muted-foreground mb-2">
											by {purchase.product.author}
										</p>
										<div class="flex flex-wrap gap-2">
											<span class="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
												{purchase.format === "BUNDLE" ? "PDF + Audio" : purchase.format}
											</span>
											<span class="text-xs px-2 py-1 bg-secondary text-secondary-foreground rounded">
												{purchase.product.type}
											</span>
										</div>
									</div>
								</div>

								<!-- Purchase Info -->
								<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
									<div>
										<div class="text-muted-foreground">Purchased</div>
										<div class="text-foreground font-medium">{formatDate(purchase.createdAt)}</div>
									</div>
									<div>
										<div class="text-muted-foreground">Amount</div>
										<div class="text-foreground font-medium">KSh {purchase.amount}</div>
									</div>
									<div>
										<div class="text-muted-foreground">Downloads</div>
										<div class="text-foreground font-medium">
											{purchase.downloadStatus.downloadCount}/{purchase.downloadStatus.maxDownloads}
										</div>
									</div>
									<div>
										<div class="text-muted-foreground">Expires</div>
										<div class="text-foreground font-medium">
											{getTimeRemaining(purchase.expiresAt)}
										</div>
									</div>
								</div>

								<!-- Download Status & Actions -->
								{#if purchase.downloadStatus.canDownload}
									<div class="flex flex-col sm:flex-row gap-3">
										<a
											href="/download/{purchase.id}"
											class="inline-flex items-center justify-center px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
										>
											<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
											</svg>
											Download ({purchase.downloadStatus.downloadsRemaining} left)
										</a>
										<a
											href="/products/{purchase.product.slug}"
											class="inline-flex items-center justify-center px-6 py-2.5 bg-secondary text-secondary-foreground font-medium rounded-lg hover:bg-secondary/80 transition-colors"
										>
											View Details
										</a>
									</div>
								{:else if purchase.downloadStatus.expired}
									<div class="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm">
										<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										<span>Download period expired (48 hours)</span>
									</div>
								{:else if purchase.downloadStatus.limitReached}
									<div class="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm">
										<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
										</svg>
										<span>Download limit reached ({purchase.downloadStatus.maxDownloads} downloads)</span>
									</div>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>

			<!-- Help Text -->
			<div class="mt-8 p-6 bg-primary/10 border border-primary/20 rounded-lg">
				<h3 class="font-semibold text-foreground mb-2">Download Policy</h3>
				<ul class="text-sm text-muted-foreground space-y-1">
					<li>• Each purchase can be downloaded <strong class="text-foreground">3 times</strong></li>
					<li>• Downloads expire <strong class="text-foreground">48 hours</strong> after purchase</li>
					<li>• Download links are valid for <strong class="text-foreground">1 hour</strong></li>
					<li>• Need help? Contact support at <a href="mailto:support@klarify.com" class="text-primary hover:underline">support@klarify.com</a></li>
				</ul>
			</div>
		{/if}
	</div>
</div>
