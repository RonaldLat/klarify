<script>
	let { data } = $props();
</script>

<svelte:head>
	<title>Payment Successful - Klarify</title>
</svelte:head>

<div class="min-h-screen bg-background py-12 md:py-20">
	<div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
		<!-- Success Icon -->
		<div class="text-center mb-8">
			<div class="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
				<svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
				</svg>
			</div>
			<h1 class="text-3xl md:text-4xl font-bold text-foreground mb-2">Payment Successful!</h1>
			<p class="text-lg text-muted-foreground">
				Your order has been confirmed. You can now download your purchases.
			</p>
		</div>

		<!-- Order Details -->
		<div class="bg-card border border-border rounded-lg p-6 mb-6">
			<h2 class="text-xl font-semibold text-foreground mb-4">Order Details</h2>
			
			<div class="space-y-3 mb-6">
				<div class="flex justify-between text-sm">
					<span class="text-muted-foreground">Reference:</span>
					<span class="text-foreground font-mono">{data.reference}</span>
				</div>
				<div class="flex justify-between text-sm">
					<span class="text-muted-foreground">Amount Paid:</span>
					<span class="text-foreground font-semibold">KSh {data.amount}</span>
				</div>
				<div class="flex justify-between text-sm">
					<span class="text-muted-foreground">Items:</span>
					<span class="text-foreground">{data.purchases.length}</span>
				</div>
			</div>

			<!-- Purchased Items -->
			<div class="border-t border-border pt-4">
				<h3 class="font-semibold text-foreground mb-3">Your Purchases:</h3>
				<div class="space-y-3">
					{#each data.purchases as purchase}
						<div class="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
							<svg class="w-5 h-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
							<div class="flex-1 min-w-0">
								<div class="font-medium text-foreground line-clamp-1">{purchase.product.title}</div>
								<div class="text-sm text-muted-foreground">{purchase.format}</div>
							</div>
							<div class="text-sm font-semibold text-primary">KSh {purchase.amount}</div>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Important Notice -->
		<div class="bg-primary/10 border border-primary/20 rounded-lg p-6 mb-6">
			<div class="flex items-start gap-3">
				<svg class="w-6 h-6 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<div>
					<h3 class="font-semibold text-foreground mb-2">Important Information</h3>
					<ul class="text-sm text-muted-foreground space-y-1">
						<li>• You have <strong class="text-foreground">48 hours</strong> to download your purchases</li>
						<li>• Each purchase can be downloaded <strong class="text-foreground">3 times</strong></li>
						<li>• Download links are available in your library</li>
					</ul>
				</div>
			</div>
		</div>

		<!-- Action Buttons -->
		<div class="flex flex-col sm:flex-row gap-4">
			<a
				href="/my-library"
				class="flex-1 px-6 py-3 bg-primary text-primary-foreground font-semibold text-center rounded-lg hover:bg-primary/90 transition-colors"
			>
				Go to My Library
			</a>
			<a
				href="/products"
				class="flex-1 px-6 py-3 bg-secondary text-secondary-foreground font-medium text-center rounded-lg hover:bg-secondary/80 transition-colors"
			>
				Continue Shopping
			</a>
		</div>

		<!-- Email Notice -->
		<p class="text-center text-sm text-muted-foreground mt-6">
			A confirmation email has been sent to your registered email address.
		</p>
	</div>
</div>
