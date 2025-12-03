<script>
	import { ChevronRight, Star, Sparkles, BookOpen, Headphones, Zap, Shield, Download, Lock, CheckCircle } from '@lucide/svelte';
	import ProductCard from '$lib/components/ProductCard.svelte';
	import { hasActivePromotion } from '$lib/utils/pricing';
	
	let { data } = $props();
	const publicUrl = "https://pub-ddafa2dcdc11430f8cec35c3cad0b062.r2.dev/";
	
	// Separate products into promotional and featured
	const promotionalProducts = $derived(
		data.featuredProducts.filter(p => hasActivePromotion(p)).slice(0, 8)
	);
	
	const displayProducts = $derived(
		promotionalProducts.length > 0 
			? promotionalProducts 
			: data.featuredProducts.slice(0, 8)
	);
</script>

<div class="bg-background">
	<!-- Hero Section - SIMPLIFIED -->
	<section class="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background py-16 md:py-24">
		<div class="absolute inset-0 overflow-hidden pointer-events-none">
			<div class="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
			<div class="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
		</div>
		
		<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
			<!-- Main Headline - ONE clear message -->
			<h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 leading-tight">
				Get Your First Book
				<span class="text-primary block">Completely Free</span>
			</h1>
			
			<!-- Value Prop - Clear and Simple -->
			<p class="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
				1000+ books and audiobooks from just KSh 50. No subscription. Own forever.
			</p>
			
			<!-- Single Primary CTA -->
			<div class="mb-8">
				{#if !data.user}
					<a
						href="/products"
						class="inline-flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground font-bold text-lg rounded-xl hover:shadow-xl hover:scale-105 transition-all"
					>
						Browse Free Books
						<ChevronRight class="w-6 h-6" />
					</a>
				{:else}
					<a
						href="/products"
						class="inline-flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground font-bold text-lg rounded-xl hover:shadow-xl hover:scale-105 transition-all"
					>
						Browse 1000+ Books
						<ChevronRight class="w-6 h-6" />
					</a>
				{/if}
			</div>

			<!-- Single Trust Indicator -->
			<div class="flex items-center justify-center gap-2 mb-8 text-sm text-muted-foreground">
				<Shield class="w-4 h-4 text-green-600" />
				<span>Used by 10+ Universities • Secure M-Pesa Payment</span>
			</div>

			<!-- Simple Stats -->
			<div class="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
				<div class="text-center">
					<div class="text-3xl md:text-4xl font-bold text-primary mb-1">1000+</div>
					<div class="text-sm text-muted-foreground">Books</div>
				</div>
				<div class="text-center border-x border-border">
					<div class="text-3xl md:text-4xl font-bold text-green-600 mb-1">FREE</div>
					<div class="text-sm text-muted-foreground">Start Here</div>
				</div>
				<div class="text-center">
					<div class="text-3xl md:text-4xl font-bold text-primary mb-1">60s</div>
					<div class="text-sm text-muted-foreground">To Download</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Free/Promotional Products (if available) -->
	{#if displayProducts.length > 0}
		<section class="py-12 md:py-16 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-y border-green-200 dark:border-green-800">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="text-center mb-8">
					<div class="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white text-sm font-bold rounded-full mb-4">
						<Sparkles class="w-4 h-4" />
						FREE & DISCOUNTED
					</div>
					
					<h2 class="text-3xl md:text-4xl font-bold text-foreground mb-3">
						Start Here - No Payment Needed
					</h2>
					<p class="text-lg text-muted-foreground max-w-2xl mx-auto">
						Get these books completely free. No tricks, no credit card required.
					</p>
				</div>
				
				<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
					{#each displayProducts as product}
						<ProductCard {product} {publicUrl} />
					{/each}
				</div>
			</div>
		</section>
	{/if}

	<!-- Why Choose Us - Simple Benefits -->
	<section class="py-12 md:py-16">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="text-center mb-12">
				<h2 class="text-2xl md:text-3xl font-bold text-foreground mb-3">
					Why Kenyans Love Klarify
				</h2>
				<p class="text-muted-foreground">The easiest way to learn in Kenya</p>
			</div>
			
			<div class="grid md:grid-cols-3 gap-8">
				<div class="text-center">
					<div class="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
						<Shield class="w-8 h-8 text-orange-600" />
					</div>
					<h3 class="text-lg font-bold text-foreground mb-2">Save 90% vs Physical Books</h3>
					<p class="text-muted-foreground text-sm">Most books under KSh 200. Physical books cost KSh 2,000+</p>
				</div>

				<div class="text-center">
					<div class="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
						<Download class="w-8 h-8 text-blue-600" />
					</div>
					<h3 class="text-lg font-bold text-foreground mb-2">Own Forever</h3>
					<p class="text-muted-foreground text-sm">Download once, keep forever. No subscription. Read offline.</p>
				</div>

				<div class="text-center">
					<div class="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
						<CheckCircle class="w-8 h-8 text-green-600" />
					</div>
					<h3 class="text-lg font-bold text-foreground mb-2">Start in 60 Seconds</h3>
					<p class="text-muted-foreground text-sm">Pick a book → M-Pesa → Download. No waiting.</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Content Types -->
	<section class="py-12 md:py-16 bg-muted/30">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<h2 class="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
				Choose Your Format
			</h2>
			
			<div class="grid md:grid-cols-3 gap-6">
				<a 
					href="/products?type=EBOOK" 
					class="group relative overflow-hidden bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-8 hover:shadow-xl transition-all hover:scale-[1.02]"
				>
					<BookOpen class="w-16 h-16 text-blue-600 mb-4" />
					<h3 class="text-2xl font-bold text-foreground mb-2">PDF eBooks</h3>
					<p class="text-muted-foreground mb-4">Read on any device. Highlight and take notes.</p>
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium text-blue-600">From KSh 50</span>
						<ChevronRight class="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
					</div>
				</a>

				<a 
					href="/products?type=AUDIOBOOK"
					class="group relative overflow-hidden bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-2xl p-8 hover:shadow-xl transition-all hover:scale-[1.02]"
				>
					<Headphones class="w-16 h-16 text-purple-600 mb-4" />
					<h3 class="text-2xl font-bold text-foreground mb-2">Audiobooks</h3>
					<p class="text-muted-foreground mb-4">Listen while commuting or exercising.</p>
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium text-purple-600">From KSh 150</span>
						<ChevronRight class="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
					</div>
				</a>

				<a 
					href="/products?type=SUMMARY"
					class="group relative overflow-hidden bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-2xl p-8 hover:shadow-xl transition-all hover:scale-[1.02]"
				>
					<div class="absolute top-4 right-4 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
						NEW
					</div>
					<Zap class="w-16 h-16 text-amber-600 mb-4" />
					<h3 class="text-2xl font-bold text-foreground mb-2">15-Min Summaries</h3>
					<p class="text-muted-foreground mb-4">Learn key insights fast. Perfect for busy people.</p>
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium text-amber-600">From KSh 100</span>
						<ChevronRight class="w-5 h-5 text-amber-600 group-hover:translate-x-1 transition-transform" />
					</div>
				</a>
			</div>
		</div>
	</section>

	<!-- Popular Books -->
	{#if data.featuredProducts.length > 0}
		<section class="py-12 md:py-16">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="flex items-center justify-between mb-8">
					<div>
						<h2 class="text-2xl md:text-3xl font-bold text-foreground mb-2">Popular This Week</h2>
						<p class="text-muted-foreground">Most loved by readers</p>
					</div>
					<a 
						href="/products" 
						class="hidden md:flex items-center gap-2 text-primary hover:underline font-medium"
					>
						View All
						<ChevronRight class="w-4 h-4" />
					</a>
				</div>
				
				<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
					{#each data.featuredProducts.slice(0, 8) as product}
						<ProductCard {product} {publicUrl} />
					{/each}
				</div>

				<div class="mt-8 text-center md:hidden">
					<a 
						href="/products"
						class="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90"
					>
						View All Books
						<ChevronRight class="w-4 h-4" />
					</a>
				</div>
			</div>
		</section>
	{/if}

	<!-- Simple FAQ -->
	<section class="py-16 bg-muted/30">
		<div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
			<h2 class="text-3xl font-bold text-center mb-12">Quick Questions</h2>
			
			<div class="space-y-4">
				<details class="bg-card border border-border rounded-lg p-4 group">
					<summary class="font-semibold cursor-pointer flex items-center justify-between">
						<span>How do I get my free book?</span>
						<ChevronRight class="w-5 h-5 text-muted-foreground group-open:rotate-90 transition-transform" />
					</summary>
					<p class="mt-3 text-muted-foreground text-sm">
						Browse books marked "FREE", add to cart, and download instantly. No payment needed.
					</p>
				</details>
				
				<details class="bg-card border border-border rounded-lg p-4 group">
					<summary class="font-semibold cursor-pointer flex items-center justify-between">
						<span>Can I download books multiple times?</span>
						<ChevronRight class="w-5 h-5 text-muted-foreground group-open:rotate-90 transition-transform" />
					</summary>
					<p class="mt-3 text-muted-foreground text-sm">
						Yes! You get up to 100 downloads per purchase. Download to all your devices.
					</p>
				</details>
				
				<details class="bg-card border border-border rounded-lg p-4 group">
					<summary class="font-semibold cursor-pointer flex items-center justify-between">
						<span>Is M-Pesa payment safe?</span>
						<ChevronRight class="w-5 h-5 text-muted-foreground group-open:rotate-90 transition-transform" />
					</summary>
					<p class="mt-3 text-muted-foreground text-sm">
						Absolutely! We use 256-bit SSL encryption. All transactions are processed securely.
					</p>
				</details>
				
				<details class="bg-card border border-border rounded-lg p-4 group">
					<summary class="font-semibold cursor-pointer flex items-center justify-between">
						<span>Do I need a subscription?</span>
						<ChevronRight class="w-5 h-5 text-muted-foreground group-open:rotate-90 transition-transform" />
					</summary>
					<p class="mt-3 text-muted-foreground text-sm">
						No! Buy only what you want. Pay once, own forever. No monthly fees.
					</p>
				</details>
			</div>
		</div>
	</section>

	<!-- Final CTA - Only for non-logged-in users -->
	{#if !data.user}
		<section class="py-16 md:py-20 bg-gradient-to-br from-primary to-primary/90 text-primary-foreground">
			<div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
				<h2 class="text-3xl md:text-4xl font-bold mb-4">
					Start Reading for Free
				</h2>
				<p class="text-lg opacity-90 mb-8">
					Join thousands of Kenyans learning smarter. No subscription. Own your books forever.
				</p>
				
				<a
					href="/products"
					class="inline-flex items-center gap-3 px-10 py-4 bg-white text-primary font-bold text-lg rounded-xl hover:shadow-2xl hover:scale-105 transition-all"
				>
					Browse Free Books
					<ChevronRight class="w-6 h-6" />
				</a>
				
				<p class="mt-6 text-sm opacity-75">
					No credit card required • Instant access • Own forever
				</p>
			</div>
		</section>
	{/if}
</div>
