<script>
	import { enhance } from "$app/forms";
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";

	let { data } = $props();
	const publicUrl = "https://pub-ddafa2dcdc11430f8cec35c3cad0b062.r2.dev/";
	
	let processing = $state(false);
	let error = $state("");
	let Paystack = $state(null);
	let paystackPopup = $state(null);

	// Load Paystack only on client side
	onMount(async () => {
		try {
			const PaystackModule = await import('@paystack/inline-js');
			Paystack = PaystackModule.default;
			paystackPopup = new Paystack();
		} catch (err) {
			console.error('Failed to load Paystack:', err);
			error = "Payment system failed to load. Please refresh the page.";
		}
	});

	/**
	 * Initialize Paystack payment and open popup
	 */
	const handleCheckout = () => {
		return async ({ result }) => {
			processing = false;

			if (result.type === "success" && result.data?.reference) {
				// Open Paystack popup
				openPaystackPopup(result.data);
			} else if (result.type === "failure") {
				error = result.data?.error || "Checkout failed";
			}
		};
	};

	/**
	 * Open Paystack payment popup using InlineJS NPM package
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
					console.log('Payment successful:', transaction);
					goto(`/checkout/verify?reference=${transaction.reference}`);
				},
				
				onLoad: (response) => {
					console.log('Payment popup loaded:', response);
				},
				
				onCancel: () => {
					error = "Payment was cancelled";
					processing = false;
				},
				
				onError: (err) => {
					console.error('Payment error:', err);
					error = err.message || "Payment failed";
					processing = false;
				}
			});
		} catch (err) {
			console.error('Paystack checkout error:', err);
			error = "Payment system error. Please try again.";
			processing = false;
		}
	}

	function getItemPrice(item) {
		if (item.format === "BUNDLE") {
			return item.product.bundlePrice || (item.product.pdfPrice + item.product.audioPrice);
		}
		if (item.format === "AUDIO") return item.product.audioPrice;
		return item.product.pdfPrice;
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
					<div class="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
						<p class="text-sm text-muted-foreground">
							📱 You'll enter your M-Pesa number in the Paystack payment window
						</p>
					</div>
				</div>

				<!-- Order Items -->
				<div class="bg-card border border-border rounded-lg p-6">
					<h2 class="text-xl font-semibold text-foreground mb-4">Order Items</h2>
					<div class="space-y-4">
						{#each data.cart.items as item}
							<div class="flex gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
								<!-- Product Image -->
								<div class="flex-shrink-0">
									<div class="w-16 h-20 bg-muted rounded overflow-hidden">
										{#if item.product.coverImage}
											<img
												src={publicUrl + item.product.coverImage}
												alt={item.product.title}
												class="w-full h-full object-cover"
											/>
										{:else}
											<div class="w-full h-full flex items-center justify-center">
												<svg class="w-6 h-6 text-muted-foreground opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
												</svg>
											</div>
										{/if}
									</div>
								</div>

								<!-- Product Info -->
								<div class="flex-1 min-w-0">
									<h3 class="font-semibold text-foreground line-clamp-1">{item.product.title}</h3>
									<p class="text-sm text-muted-foreground mb-1">{item.product.author}</p>
									<span class="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
										{item.format === "BUNDLE" ? "PDF + Audio" : item.format}
									</span>
								</div>

								<!-- Price -->
								<div class="text-right">
									<div class="font-bold text-foreground">KSh {getItemPrice(item)}</div>
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
							<span class="font-medium">KSh {data.cart.subtotal}</span>
						</div>
						<div class="flex justify-between text-muted-foreground text-sm">
							<span>Processing Fee</span>
							<span>KSh 0</span>
						</div>
						<div class="border-t border-border pt-3 flex justify-between text-xl font-bold">
							<span class="text-foreground">Total</span>
							<span class="text-primary">KSh {data.cart.total}</span>
						</div>
					</div>

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
							class="w-full px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-3 text-base"
						>
							{processing ? "Processing..." : `💳 Pay KSh ${data.cart.total}`}
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
								<div class="font-medium text-foreground mb-1">Secure Payment</div>
								<p>Powered by Paystack. Supports M-Pesa, Cards, Bank Transfer & more.</p>
							</div>
						</div>

						<div class="flex items-start gap-3 text-sm text-muted-foreground">
							<svg class="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
							</svg>
							<div>
								<div class="font-medium text-foreground mb-1">Instant Access</div>
								<p>Download your purchases immediately after payment.</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
