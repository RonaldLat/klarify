<script>
	import { enhance } from "$app/forms";
	import { goto, invalidateAll } from "$app/navigation";
	import { onMount } from "svelte";
	import { toast } from 'svelte-sonner';
	import { calculatePrice } from '$lib/utils/pricing';

	let { data } = $props();
	const publicUrl = "https://pub-ddafa2dcdc11430f8cec35c3cad0b062.r2.dev/";
	
	let processing = $state(false);
	let error = $state("");
	let Paystack = $state(null);
	let paystackPopup = $state(null);
	
	// Check if cart is all free
	const isFreeCheckout = $derived(data.cart.total === 0);

	// Load Paystack only if needed (not for free checkout)
	onMount(async () => {
		if (!isFreeCheckout) {
			try {
				const PaystackModule = await import('@paystack/inline-js');
				Paystack = PaystackModule.default;
				paystackPopup = new Paystack();
			} catch (err) {
				console.error('Failed to load Paystack:', err);
				error = "Payment system failed to load. Please refresh the page.";
			}
		}
	});

	/**
	 * Get actual price for cart item
	 */
	function getItemPrice(item) {
		const pricing = calculatePrice(item.product, item.format);
		return pricing.finalPrice;
	}

	/**
	 * Handle checkout submission
	 */
	const handleCheckout = () => {
		return async ({ result }) => {
			processing = false;

			if (result.type === "success" && result.data?.reference) {
				// Open Paystack popup
				openPaystackPopup(result.data);
			} else if (result.type === "failure") {
				error = result.data?.error || "Checkout failed";
				toast.error('Checkout Failed', {
					description: error
				});
			} else if (result.type === "redirect") {
				// Free checkout - show success toast
				toast.success('Success! 🎉', {
					description: 'Your free items are now in your library!',
					duration: 3000
				});
			}
		};
	};

	/**
	 * Open Paystack payment popup
	 */
	function openPaystackPopup(paymentData) {
		if (!paystackPopup) {
			error = "Payment system not loaded. Please wait or refresh the page.";
			return;
		}

		try {
			paystackPopup.checkout({
				key: data.paystackPublicKey,
				email: data.user.email,
				amount: Math.round(data.cart.total * 100),
				currency: 'KES',
				ref: paymentData.reference,
				
				onSuccess: (transaction) => {
					toast.success('Payment Successful!', {
						description: 'Redirecting to your library...'
					});
					window.location.href = `/checkout/verify?reference=${transaction.reference}`;
				},
				
				onCancel: () => {
					error = "Payment was cancelled";
					processing = false;
					toast.error('Payment Cancelled', {
						description: 'You can retry or modify your cart'
					});
				},
				
				onError: (err) => {
					error = err.message || "Payment failed";
					processing = false;
					toast.error('Payment Failed', {
						description: error
					});
				}
			});
		} catch (err) {
			error = "Payment system error. Please try again.";
			processing = false;
			toast.error('Error', {
				description: error
			});
		}
	}
</script>

<svelte:head>
	<title>Checkout - Klarify</title>
</svelte:head>

<div class="min-h-screen bg-background py-8 md:py-12">
	<div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl md:text-4xl font-bold text-foreground mb-2">Checkout</h1>
			<p class="text-muted-foreground">Review your order and complete payment</p>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<!-- Order Items -->
			<div class="lg:col-span-2 space-y-6">
				<!-- Customer Info -->
				<div class="bg-card border border-border rounded-lg p-6">
					<h2 class="text-xl font-semibold text-foreground mb-4">Customer Information</h2>
					<div class="space-y-3">
						<div class="flex justify-between">
							<span class="text-muted-foreground">Name:</span>
							<span class="text-foreground font-medium">{data.user.name}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Email:</span>
							<span class="text-foreground font-medium">{data.user.email}</span>
						</div>
					</div>
					{#if !isFreeCheckout}
						<div class="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
							<p class="text-sm text-muted-foreground">
								📱 You'll enter your M-Pesa number in the Paystack payment window
							</p>
						</div>
					{/if}
				</div>

				<!-- Order Items -->
				<div class="bg-card border border-border rounded-lg p-6">
					<h2 class="text-xl font-semibold text-foreground mb-4">Order Items</h2>
					<div class="space-y-4">
						{#each data.cart.items as item}
							{@const itemPrice = getItemPrice(item)}
							
							<div class="flex gap-4 pb-4 border-b border-border last:border-0 last:pb-0 {itemPrice === 0 ? 'bg-green-50 dark:bg-green-950/20 -mx-2 px-2 rounded' : ''}">
								<!-- Product Image -->
								<div class="flex-shrink-0">
									<div class="w-16 h-20 bg-muted rounded overflow-hidden">
										{#if item.product.coverImage}
											<img
												src={publicUrl + item.product.coverImage}
												alt={item.product.title}
												class="w-full h-full object-cover"
											/>
										{/if}
									</div>
								</div>

								<!-- Product Info -->
								<div class="flex-1 min-w-0">
									<h3 class="font-semibold text-foreground line-clamp-1">{item.product.title}</h3>
									<p class="text-sm text-muted-foreground mb-1">{item.product.author}</p>
									<div class="flex items-center gap-2">
										<span class="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
											{item.format === "BUNDLE" ? "PDF + Audio" : item.format}
										</span>
										{#if itemPrice === 0}
											<span class="text-xs px-2 py-1 bg-green-500 text-white rounded font-bold">
												FREE
											</span>
										{/if}
									</div>
								</div>

								<!-- Price -->
								<div class="text-right">
									<div class="font-bold {itemPrice === 0 ? 'text-green-600' : 'text-foreground'}">
										{itemPrice === 0 ? 'FREE' : `KSh ${itemPrice}`}
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<!-- Payment Summary -->
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
							<span class="{isFreeCheckout ? 'text-green-600' : 'text-primary'}">
								{#if isFreeCheckout}
									FREE! 🎁
								{:else}
									KSh {data.cart.total}
								{/if}
							</span>
						</div>
					</div>

					{#if isFreeCheckout}
						<div class="mb-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
							<p class="text-sm text-green-800 dark:text-green-200 font-medium">
								🎉 All items are free! Click below to add them to your library.
							</p>
						</div>
					{/if}

					<!-- Error Message -->
					{#if error}
						<div class="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded">
							{error}
						</div>
					{/if}

					<!-- Checkout Form -->
					<form 
						method="POST" 
						action="?/initiate" 
						use:enhance={handleCheckout}
						onsubmit={() => {
							processing = true;
							error = "";
						}}
					>
						<!-- Hidden cart item IDs -->
						{#each data.cart.items as item}
							<input type="hidden" name="cartItemIds" value={item.id} />
						{/each}

						<button
							type="submit"
							disabled={processing}
							class="w-full px-6 py-3 {isFreeCheckout ? 'bg-green-600 hover:bg-green-700' : 'bg-primary hover:bg-primary/90'} text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-3 text-base shadow-lg"
						>
							{#if processing}
								Processing...
							{:else if isFreeCheckout}
								🎁 Get Free Items
							{:else}
								💳 Pay KSh {data.cart.total}
							{/if}
						</button>
					</form>

					<a
						href="/cart"
						class="block w-full px-6 py-3 bg-secondary text-secondary-foreground font-medium text-center rounded-lg hover:bg-secondary/80 transition-colors"
					>
						Back to Cart
					</a>

					<!-- Payment Info -->
					<div class="mt-6 pt-6 border-t border-border">
						<div class="flex items-start gap-3 text-sm text-muted-foreground mb-3">
							<svg class="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
							</svg>
							<div>
								<div class="font-medium text-foreground mb-1">
									{isFreeCheckout ? 'No Payment Required' : 'Secure Payment'}
								</div>
								<p>
									{#if isFreeCheckout}
										Free items are added to your library instantly.
									{:else}
										Powered by Paystack. Supports M-Pesa, Cards & more.
									{/if}
								</p>
							</div>
						</div>

						<div class="flex items-start gap-3 text-sm text-muted-foreground">
							<svg class="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
							</svg>
							<div>
								<div class="font-medium text-foreground mb-1">Instant Access</div>
								<p>Download your purchases immediately after checkout.</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
