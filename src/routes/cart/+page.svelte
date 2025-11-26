<script>
	import { enhance } from "$app/forms";
	import { invalidateAll } from "$app/navigation";
	import { calculatePrice } from '$lib/utils/pricing';

	let { data } = $props();
	const publicUrl = "https://pub-ddafa2dcdc11430f8cec35c3cad0b062.r2.dev/";

	let removingItems = $state(new Set());
	let clearingCart = $state(false);

	/**
	 * Get actual price for cart item (handles free/discounted products)
	 */
	function getItemPrice(item) {
		const pricing = calculatePrice(item.product, item.format);
		return pricing.finalPrice;
	}
	
	/**
	 * Get original price for display
	 */
	function getItemOriginalPrice(item) {
		const pricing = calculatePrice(item.product, item.format);
		return pricing.originalPrice;
	}
	
	/**
	 * Check if item has discount
	 */
	function hasDiscount(item) {
		const pricing = calculatePrice(item.product, item.format);
		return pricing.discount > 0 || pricing.isFree;
	}

	/**
	 * Handle item removal
	 */
	function handleRemove(itemId) {
		return async () => {
			removingItems.add(itemId);
			return async ({ result }) => {
				removingItems.delete(itemId);
				if (result.type === "success") {
					await invalidateAll();
				}
			};
		};
	}

	/**
	 * Handle clear cart
	 */
	function handleClear() {
		return async () => {
			clearingCart = true;
			return async ({ result }) => {
				clearingCart = false;
				if (result.type === "success") {
					await invalidateAll();
				}
			};
		};
	}
</script>

<svelte:head>
	<title>Shopping Cart - Klarify</title>
</svelte:head>

<div class="min-h-screen bg-background py-8 md:py-12">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="flex items-center justify-between mb-8">
			<div>
				<h1 class="text-3xl md:text-4xl font-bold text-foreground mb-2">Shopping Cart</h1>
				<p class="text-muted-foreground">
					{data.cart.itemCount} {data.cart.itemCount === 1 ? "item" : "items"}
					{#if data.cart.total === 0}
						<span class="text-green-600 font-semibold ml-2">🎁 All Free!</span>
					{/if}
				</p>
			</div>

			{#if data.cart.itemCount > 0}
				<form method="POST" action="?/clear" use:enhance={handleClear()}>
					<button
						type="submit"
						disabled={clearingCart}
						class="text-sm text-destructive hover:underline disabled:opacity-50"
					>
						{clearingCart ? "Clearing..." : "Clear Cart"}
					</button>
				</form>
			{/if}
		</div>

		{#if data.cart.itemCount === 0}
			<!-- Empty Cart -->
			<div class="text-center py-16">
				<svg class="w-24 h-24 mx-auto mb-6 text-muted-foreground opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
				</svg>
				<h3 class="text-xl font-semibold text-foreground mb-2">Your cart is empty</h3>
				<p class="text-muted-foreground mb-6">Add some books to get started!</p>
				<a
					href="/products"
					class="inline-block px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
				>
					Browse Products
				</a>
			</div>
		{:else}
			<!-- Cart Items -->
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<!-- Items List -->
				<div class="lg:col-span-2 space-y-4">
					{#each data.cart.items as item}
						{@const itemPrice = getItemPrice(item)}
						{@const originalPrice = getItemOriginalPrice(item)}
						{@const hasPriceDiscount = hasDiscount(item)}
						
						<div class="bg-card border border-border rounded-lg p-4 md:p-6 {itemPrice === 0 ? 'ring-2 ring-green-500/50 bg-green-50 dark:bg-green-950/20' : ''}">
							<div class="flex gap-4">
								<!-- Cover Image -->
								<a href="/products/{item.product.slug}" class="flex-shrink-0">
									<div class="w-20 md:w-24 aspect-[2/3] bg-muted rounded overflow-hidden">
										{#if item.product.coverImage}
											<img
												src={publicUrl + item.product.coverImage}
												alt={item.product.title}
												class="w-full h-full object-cover"
											/>
										{:else}
											<div class="w-full h-full flex items-center justify-center">
												<svg class="w-8 h-8 text-muted-foreground opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
												</svg>
											</div>
										{/if}
									</div>
								</a>

								<!-- Product Info -->
								<div class="flex-1 min-w-0">
									<a href="/products/{item.product.slug}" class="block group">
										<h3 class="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1">
											{item.product.title}
										</h3>
									</a>
									<p class="text-sm text-muted-foreground mb-2">
										by {item.product.author}
									</p>
									<div class="flex items-center gap-2 mb-3">
										<span class="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
											{item.format === "BUNDLE" ? "PDF + Audio" : item.format}
										</span>
										<span class="text-xs text-muted-foreground">
											{item.product.type}
										</span>
										{#if itemPrice === 0}
											<span class="text-xs px-2 py-1 bg-green-500 text-white rounded font-bold">
												FREE
											</span>
										{/if}
									</div>

									<!-- Price & Remove -->
									<div class="flex items-center justify-between">
										<div>
											{#if itemPrice === 0}
												<div class="text-lg font-bold text-green-600">
													FREE
												</div>
												{#if originalPrice > 0}
													<div class="text-xs text-muted-foreground line-through">
														Was KSh {originalPrice}
													</div>
												{/if}
											{:else if hasPriceDiscount}
												<div class="flex items-center gap-2">
													<div class="text-lg font-bold text-primary">
														KSh {itemPrice}
													</div>
													<div class="text-sm text-muted-foreground line-through">
														{originalPrice}
													</div>
												</div>
												<div class="text-xs text-green-600 font-medium">
													Save KSh {originalPrice - itemPrice}
												</div>
											{:else}
												<div class="text-lg font-bold text-primary">
													KSh {itemPrice}
												</div>
											{/if}
										</div>

										<form method="POST" action="?/remove" use:enhance={handleRemove(item.id)}>
											<input type="hidden" name="cartItemId" value={item.id} />
											<button
												type="submit"
												disabled={removingItems.has(item.id)}
												class="text-sm text-destructive hover:underline disabled:opacity-50"
											>
												{removingItems.has(item.id) ? "Removing..." : "Remove"}
											</button>
										</form>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>

				<!-- Order Summary -->
				<div class="lg:col-span-1">
					<div class="bg-card border border-border rounded-lg p-6 sticky top-24">
						<h2 class="text-xl font-semibold text-foreground mb-6">Order Summary</h2>
						
						<div class="space-y-3 mb-6">
							<div class="flex justify-between text-foreground">
								<span>Subtotal ({data.cart.itemCount} items)</span>
								<span class="font-medium">
									{#if data.cart.subtotal === 0}
										FREE
									{:else}
										KSh {data.cart.subtotal}
									{/if}
								</span>
							</div>
							<div class="flex justify-between text-muted-foreground text-sm">
								<span>Processing Fee</span>
								<span>KSh 0</span>
							</div>
							<div class="border-t border-border pt-3 flex justify-between text-xl font-bold">
								<span class="text-foreground">Total</span>
								<span class="{data.cart.total === 0 ? 'text-green-600' : 'text-primary'}">
									{#if data.cart.total === 0}
										FREE! 🎁
									{:else}
										KSh {data.cart.total}
									{/if}
								</span>
							</div>
						</div>

						<a
							href="/checkout"
							class="block w-full px-6 py-3 {data.cart.total === 0 ? 'bg-green-600 hover:bg-green-700' : 'bg-primary hover:bg-primary/90'} text-white font-semibold text-center rounded-lg transition-colors mb-3"
						>
							{data.cart.total === 0 ? '🎁 Get Free Items' : 'Proceed to Checkout'}
						</a>
						
						<a
							href="/products"
							class="block w-full px-6 py-3 bg-secondary text-secondary-foreground font-medium text-center rounded-lg hover:bg-secondary/80 transition-colors"
						>
							Continue Shopping
						</a>

						<!-- Features -->
						<div class="mt-6 pt-6 border-t border-border space-y-2 text-sm text-muted-foreground">
							<div class="flex items-center gap-2">
								<svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
								<span>Instant download access</span>
							</div>
							<div class="flex items-center gap-2">
								<svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
								<span>Unlimited downloads</span>
							</div>
							<div class="flex items-center gap-2">
								<svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
								<span>Secure payment</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
