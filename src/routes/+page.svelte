<script>
	import { ChevronRight, Star, TrendingUp, Sparkles, BookOpen, Headphones, Clock, Zap, Shield, Download, CreditCard, Lock, CheckCircle } from '@lucide/svelte';
	import ProductCard from '$lib/components/ProductCard.svelte';
	import { hasActivePromotion } from '$lib/utils/pricing';
	import { onMount } from 'svelte';
	
	let { data } = $props();
	const publicUrl = "https://pub-ddafa2dcdc11430f8cec35c3cad0b062.r2.dev/";
	
	let showAllCategories = $state(false);
	const visibleCategoriesCount = 6;
	
	// Analytics tracking
	onMount(() => {
		// Track page view
		trackEvent('page_view', {
			page: 'home',
			user_id: data.user?.id || null
		});
		
		// Track scroll depth
		let maxScroll = 0;
		const handleScroll = () => {
			const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
			if (scrollPercent > maxScroll) {
				maxScroll = Math.floor(scrollPercent / 25) * 25; // Track in 25% increments
				if (maxScroll > 0 && maxScroll % 25 === 0) {
					trackEvent('scroll_depth', { depth: maxScroll });
				}
			}
		};
		
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	});
	
	// Track events
	async function trackEvent(eventName, data = {}) {
		try {
			await fetch('/api/analytics/track', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ event: eventName, data })
			});
		} catch (error) {
			console.error('Analytics error:', error);
		}
	}
	
	// Track CTA clicks
	function trackCTA(ctaName) {
		trackEvent('cta_click', { cta_name: ctaName, location: 'home' });
	}
	
	// Separate products into promotional and featured
	const promotionalProducts = $derived(
		data.featuredProducts.filter(p => hasActivePromotion(p))
	);
	
	// Always show at least 8 products in the promotional section
	const displayProducts = $derived(
		promotionalProducts.length > 0 
			? promotionalProducts 
			: data.featuredProducts.slice(0, 8)
	);
	
	const gradients = [
		'from-blue-500/20 to-cyan-500/20 border-blue-500/30 hover:border-blue-500',
		'from-purple-500/20 to-pink-500/20 border-purple-500/30 hover:border-purple-500',
		'from-green-500/20 to-emerald-500/20 border-green-500/30 hover:border-green-500',
		'from-orange-500/20 to-red-500/20 border-orange-500/30 hover:border-orange-500',
		'from-indigo-500/20 to-blue-500/20 border-indigo-500/30 hover:border-indigo-500',
		'from-rose-500/20 to-pink-500/20 border-rose-500/30 hover:border-rose-500',
	];
	
	// Countdown timer for urgency
	let timeRemaining = $state({ hours: 23, minutes: 45, seconds: 12 });
	
	onMount(() => {
		const timer = setInterval(() => {
			if (timeRemaining.seconds > 0) {
				timeRemaining.seconds--;
			} else if (timeRemaining.minutes > 0) {
				timeRemaining.minutes--;
				timeRemaining.seconds = 59;
			} else if (timeRemaining.hours > 0) {
				timeRemaining.hours--;
				timeRemaining.minutes = 59;
				timeRemaining.seconds = 59;
			}
		}, 1000);
		
		return () => clearInterval(timer);
	});
</script>

<div class="bg-background">
	<!-- Hero Section with Stronger Value Prop -->
	<section class="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background py-12 md:py-20 lg:py-24">
		<div class="absolute inset-0 overflow-hidden pointer-events-none">
			<div class="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
			<div class="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
		</div>
		
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
			<div class="text-center max-w-4xl mx-auto">
				<h1 class="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground mb-6 leading-tight">
					Get Your First Book<br />
					<span class="text-primary">100% FREE Today</span>
				</h1>
				
				<p class="text-lg md:text-xl text-muted-foreground mb-4 max-w-2xl mx-auto leading-relaxed">
					<span class="text-foreground font-semibold">1000+ bestselling books & audiobooks.</span> 
					Start with a free book, then pay from just KSh 50. No subscription. Own forever.
				</p>
				
				<!-- Social Proof -->
				<div class="flex items-center justify-center gap-2 mb-4 text-sm">
					<div class="flex -space-x-2">
						<div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 border-2 border-background"></div>
						<div class="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 border-2 border-background"></div>
						<div class="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 border-2 border-background"></div>
						<div class="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 border-2 border-background"></div>
					</div>
					<span class="text-muted-foreground">
						<strong class="text-foreground">127 people</strong> purchased in the last 24 hours
					</span>
				</div>
				
				<!-- Real-time activity notification -->
				<div class="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
					<div class="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-full text-sm">
						<span class="relative flex h-2 w-2">
							<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
							<span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
						</span>
						<span class="text-green-700 dark:text-green-400">
							<strong>John from Nairobi</strong> just purchased "Atomic Habits"
						</span>
					</div>
				</div>
				
				<div class="flex flex-col sm:flex-row justify-center gap-4 mb-8">
					{#if !data.user}
						<a
							href="/signup"
							onclick={() => trackCTA('hero_get_free_book')}
							class="group px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2 text-lg"
						>
							🎁 Get Your First Book FREE
							<ChevronRight class="w-6 h-6 group-hover:translate-x-1 transition-transform" />
						</a>
						<a
							href="/products"
							onclick={() => trackCTA('hero_browse_books')}
							class="px-8 py-4 bg-white dark:bg-gray-800 border-2 border-primary text-foreground font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
						>
							Browse 1000+ Books
						</a>
					{:else}
						<a
							href="/products"
							onclick={() => trackCTA('hero_browse_books_logged_in')}
							class="group px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
						>
							Browse 1000+ Books
							<ChevronRight class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
						</a>
					{/if}
				</div>

				<!-- Trust Indicators -->
				<div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6 text-xs text-muted-foreground">
					<span class="flex items-center gap-1">
						<Shield class="w-4 h-4 text-green-600" />
						Secure M-Pesa Payment
					</span>
					<span class="flex items-center gap-1">
						<Lock class="w-4 h-4 text-green-600" />
						256-bit SSL Encryption
					</span>
					<span class="flex items-center gap-1">
						<CheckCircle class="w-4 h-4 text-green-600" />
						Used by 10+ Universities
					</span>
				</div>

				<!-- Stats -->
				<div class="grid grid-cols-3 gap-6 md:gap-12 max-w-3xl mx-auto">
					<div class="text-center">
						<div class="text-3xl md:text-4xl font-bold text-primary mb-2">1000+</div>
						<div class="text-sm md:text-base text-muted-foreground">Books Available</div>
					</div>
					<div class="text-center border-x border-border">
						<div class="text-3xl md:text-4xl font-bold text-green-600 mb-2">FREE</div>
						<div class="text-sm md:text-base text-muted-foreground">Start Here</div>
					</div>
					<div class="text-center">
						<div class="text-3xl md:text-4xl font-bold text-primary mb-2">&lt;60s</div>
						<div class="text-sm md:text-base text-muted-foreground">To Download</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Free/Discounted Books Section -->
	{#if displayProducts.length > 0}
		<section id="free-books" class="py-12 md:py-16 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-y border-green-200 dark:border-green-800">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="text-center mb-8">
					<div class="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white text-sm font-bold rounded-full mb-4">
						<Sparkles class="w-4 h-4" />
						LIMITED TIME OFFER
					</div>
					
					<!-- Countdown Timer -->
					<div class="mb-4">
						<span class="text-red-600 dark:text-red-400 font-bold text-lg">
							⏰ Offer ends in {timeRemaining.hours.toString().padStart(2, '0')}:{timeRemaining.minutes.toString().padStart(2, '0')}:{timeRemaining.seconds.toString().padStart(2, '0')}
						</span>
					</div>
					
					<h2 class="text-3xl md:text-4xl font-bold text-foreground mb-4">
						🎁 Free & Heavily Discounted Books
					</h2>
					<p class="text-lg text-muted-foreground max-w-2xl mx-auto">
						Get these books for free or at massive discounts. Limited time only!
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

	<!-- Why Choose Us - Benefits Section -->
	<section class="py-12 md:py-16">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="text-center mb-12">
				<h2 class="text-2xl md:text-3xl font-bold text-foreground mb-4">
					Why Kenyans Choose Klarify
				</h2>
				<p class="text-muted-foreground">The easiest way to read and listen in Kenya</p>
			</div>
			
			<div class="grid md:grid-cols-3 gap-6">
				<!-- Save Money -->
				<div class="group bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all hover:border-primary/50">
					<div class="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
						<Shield class="w-6 h-6 text-orange-600" />
					</div>
					<h3 class="text-lg font-bold text-foreground mb-2">Save 90% vs Physical Books</h3>
					<p class="text-muted-foreground text-sm">Most books under KSh 200. Physical books cost KSh 2,000+. Pay with M-Pesa in seconds.</p>
				</div>

				<!-- Read Anywhere -->
				<div class="group bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all hover:border-primary/50">
					<div class="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
						<Download class="w-6 h-6 text-blue-600" />
					</div>
					<h3 class="text-lg font-bold text-foreground mb-2">Read Anywhere, Anytime</h3>
					<p class="text-muted-foreground text-sm">Download once, keep forever. No subscription. Works on any device. Read offline.</p>
				</div>

				<!-- Quick Start -->
				<div class="group bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all hover:border-primary/50">
					<div class="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
						<CreditCard class="w-6 h-6 text-green-600" />
					</div>
					<h3 class="text-lg font-bold text-foreground mb-2">Start Learning in 60 Seconds</h3>
					<p class="text-muted-foreground text-sm">Sign up → Pick a free book → Enter M-Pesa → Download. No waiting for delivery.</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Testimonials Section -->
	<section class="py-16 bg-muted/30">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<h2 class="text-3xl font-bold text-center mb-12">
				What Kenyan Readers Say
			</h2>
			
			<div class="grid md:grid-cols-3 gap-6">
				<div class="bg-card border border-border rounded-xl p-6">
					<div class="flex items-center gap-1 mb-3">
						{#each Array(5) as _}
							<Star class="w-4 h-4 fill-yellow-500 text-yellow-500" />
						{/each}
					</div>
					<p class="text-muted-foreground mb-4">
						"I've saved over KSh 5,000 compared to buying physical books. The M-Pesa payment is so convenient!"
					</p>
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500"></div>
						<div>
							<div class="font-semibold text-sm">Sarah M.</div>
							<div class="text-xs text-muted-foreground">Business Student, Nairobi</div>
						</div>
					</div>
				</div>
				
				<div class="bg-card border border-border rounded-xl p-6">
					<div class="flex items-center gap-1 mb-3">
						{#each Array(5) as _}
							<Star class="w-4 h-4 fill-yellow-500 text-yellow-500" />
						{/each}
					</div>
					<p class="text-muted-foreground mb-4">
						"Downloaded my book instantly! No more waiting weeks for shipping. Perfect for my research."
					</p>
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500"></div>
						<div>
							<div class="font-semibold text-sm">David K.</div>
							<div class="text-xs text-muted-foreground">Engineer, Mombasa</div>
						</div>
					</div>
				</div>
				
				<div class="bg-card border border-border rounded-xl p-6">
					<div class="flex items-center gap-1 mb-3">
						{#each Array(5) as _}
							<Star class="w-4 h-4 fill-yellow-500 text-yellow-500" />
						{/each}
					</div>
					<p class="text-muted-foreground mb-4">
						"The audiobooks help me learn during my commute. I've finished 12 books this year already!"
					</p>
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500"></div>
						<div>
							<div class="font-semibold text-sm">Grace W.</div>
							<div class="text-xs text-muted-foreground">Accountant, Kisumu</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Featured Content Types -->
	<section class="py-12 md:py-16">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<h2 class="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
				Choose Your Learning Style
			</h2>
			
			<div class="grid md:grid-cols-3 gap-6">
				<!-- eBooks -->
				<a 
					href="/products?type=EBOOK" 
					onclick={() => trackCTA('content_type_ebook')}
					class="group relative overflow-hidden bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-8 hover:shadow-xl transition-all hover:scale-[1.02]"
				>
					<div class="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
					<BookOpen class="w-16 h-16 text-blue-600 dark:text-blue-400 mb-4 relative z-10" />
					<h3 class="text-2xl font-bold text-foreground mb-2 relative z-10">PDF eBooks</h3>
					<p class="text-muted-foreground mb-4 relative z-10">Read on phone, tablet or computer. Highlight and take notes.</p>
					<div class="flex items-center justify-between relative z-10">
						<span class="text-sm font-medium text-blue-600 dark:text-blue-400">From KSh 50</span>
						<ChevronRight class="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
					</div>
				</a>

				<!-- Audiobooks -->
				<a 
					href="/products?type=AUDIOBOOK"
					onclick={() => trackCTA('content_type_audiobook')}
					class="group relative overflow-hidden bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-2xl p-8 hover:shadow-xl transition-all hover:scale-[1.02]"
				>
					<div class="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
					<Headphones class="w-16 h-16 text-purple-600 dark:text-purple-400 mb-4 relative z-10" />
					<h3 class="text-2xl font-bold text-foreground mb-2 relative z-10">Audiobooks</h3>
					<p class="text-muted-foreground mb-4 relative z-10">Listen while commuting, exercising or doing chores. Full narration.</p>
					<div class="flex items-center justify-between relative z-10">
						<span class="text-sm font-medium text-purple-600 dark:text-purple-400">From KSh 150</span>
						<ChevronRight class="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
					</div>
				</a>

				<!-- Summaries -->
				<a 
					href="/products?type=SUMMARY"
					onclick={() => trackCTA('content_type_summary')}
					class="group relative overflow-hidden bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-2xl p-8 hover:shadow-xl transition-all hover:scale-[1.02]"
				>
					<div class="absolute top-4 right-4 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse shadow-lg">
						NEW & POPULAR
					</div>
					<div class="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl"></div>
					<Zap class="w-16 h-16 text-amber-600 dark:text-amber-400 mb-4 relative z-10" />
					<h3 class="text-2xl font-bold text-foreground mb-2 relative z-10">15-Min Summaries</h3>
					<p class="text-muted-foreground mb-4 relative z-10">Learn key insights fast. Perfect for busy professionals and students.</p>
					<div class="flex items-center justify-between relative z-10">
						<span class="text-sm font-medium text-amber-600 dark:text-amber-400">From KSh 100</span>
						<ChevronRight class="w-5 h-5 text-amber-600 group-hover:translate-x-1 transition-transform" />
					</div>
				</a>
			</div>
		</div>
	</section>

	<!-- Featured Products -->
	{#if data.featuredProducts.length > 0}
		<section class="py-12 md:py-20 bg-muted/20">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="flex items-center justify-between mb-8">
					<div>
						<h2 class="text-2xl md:text-3xl font-bold text-foreground mb-2">Trending This Week</h2>
						<p class="text-muted-foreground">Most popular with Kenyan readers</p>
					</div>
					<a 
						href="/products" 
						onclick={() => trackCTA('trending_view_all')}
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
						onclick={() => trackCTA('trending_view_all_mobile')}
						class="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90"
					>
						View All Books
						<ChevronRight class="w-4 h-4" />
					</a>
				</div>
			</div>
		</section>
	{/if}

	<!-- FAQ Section -->
	<section class="py-16">
		<div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
			<h2 class="text-3xl font-bold text-center mb-12">Common Questions</h2>
			
			<div class="space-y-4">
				<details class="bg-card border border-border rounded-lg p-4 group">
					<summary class="font-semibold cursor-pointer flex items-center justify-between">
						<span>How do I get my free book?</span>
						<ChevronRight class="w-5 h-5 text-muted-foreground group-open:rotate-90 transition-transform" />
					</summary>
					<p class="mt-3 text-muted-foreground text-sm">
						Sign up, browse books marked "FREE", add to cart, and download instantly. No payment needed for free books.
					</p>
				</details>
				
				<details class="bg-card border border-border rounded-lg p-4 group">
					<summary class="font-semibold cursor-pointer flex items-center justify-between">
						<span>Can I download books multiple times?</span>
						<ChevronRight class="w-5 h-5 text-muted-foreground group-open:rotate-90 transition-transform" />
					</summary>
					<p class="mt-3 text-muted-foreground text-sm">
						Yes! You get 3 downloads per purchase. Download to all your devices - phone, tablet, and computer.
					</p>
				</details>
				
				<details class="bg-card border border-border rounded-lg p-4 group">
					<summary class="font-semibold cursor-pointer flex items-center justify-between">
						<span>Is M-Pesa payment safe?</span>
						<ChevronRight class="w-5 h-5 text-muted-foreground group-open:rotate-90 transition-transform" />
					</summary>
					<p class="mt-3 text-muted-foreground text-sm">
						Absolutely! We use 256-bit SSL encryption and never store your M-Pesa PIN. All transactions are processed securely through Safaricom.
					</p>
				</details>
				
				<details class="bg-card border border-border rounded-lg p-4 group">
					<summary class="font-semibold cursor-pointer flex items-center justify-between">
						<span>What if I don't like a book?</span>
						<ChevronRight class="w-5 h-5 text-muted-foreground group-open:rotate-90 transition-transform" />
					</summary>
					<p class="mt-3 text-muted-foreground text-sm">
						Check our sample chapters before buying! Most books have previews. Once downloaded, all sales are final as they're digital products.
					</p>
				</details>
				
				<details class="bg-card border border-border rounded-lg p-4 group">
					<summary class="font-semibold cursor-pointer flex items-center justify-between">
						<span>Do I need a subscription?</span>
						<ChevronRight class="w-5 h-5 text-muted-foreground group-open:rotate-90 transition-transform" />
					</summary>
					<p class="mt-3 text-muted-foreground text-sm">
						No! Buy only what you want. No monthly fees, no hidden costs. Pay once, own forever.
					</p>
				</details>
			</div>
		</div>
	</section>

	<!-- Categories Section -->
	{#if data.categories.length > 0}
		<section class="py-8 md:py-12 bg-muted/30 border-y border-border">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="flex items-center justify-between mb-6">
					<h2 class="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
						<TrendingUp class="w-5 h-5 md:w-6 md:h-6 text-primary" />
						Browse by Category
					</h2>
					
					{#if data.categories.length > visibleCategoriesCount}
						<button
							onclick={() => showAllCategories = !showAllCategories}
							class="flex items-center gap-1 text-sm text-primary hover:underline font-medium"
						>
							{showAllCategories ? 'Show Less' : 'View All'}
						</button>
					{/if}
				</div>
				
				<div class="flex flex-wrap gap-2">
					{#each data.categories.slice(0, showAllCategories ? data.categories.length : visibleCategoriesCount) as category, index}
						<a
							href="/products?category={category.slug}"
							onclick={() => trackCTA(`category_${category.slug}`)}
							class="group inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r {gradients[index % gradients.length]} border rounded-full hover:shadow-md transition-all"
						>
							<span class="font-medium text-foreground group-hover:text-primary transition-colors">
								{category.name}
							</span>
							<span class="px-2 py-0.5 bg-background/80 backdrop-blur-sm text-foreground text-xs font-bold rounded-full">
								{category._count.products}
							</span>
						</a>
					{/each}
				</div>
			</div>
		</section>
	{/if}

	<!-- Final CTA Section -->
	{#if !data.user}
		<section class="py-16 md:py-24 bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-primary-foreground relative overflow-hidden">
			<div class="absolute inset-0 opacity-10">
				<div class="absolute inset-0" style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 40px 40px;"></div>
			</div>
			
			<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
				<Sparkles class="w-12 h-12 mx-auto mb-6 animate-pulse" />
				<h2 class="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
					Your First Book is FREE. Forever Yours.
				</h2>
				<p class="text-lg md:text-xl opacity-90 mb-8 max-w-2xl mx-auto">
					Join 2,500+ Kenyans reading smarter. No subscription traps. No hidden fees. Download and own your books forever.
				</p>
				
				<a
					href="/signup"
					onclick={() => trackCTA('final_cta_signup')}
					class="inline-flex items-center gap-3 px-12 py-5 bg-white text-primary font-bold text-lg rounded-xl hover:shadow-2xl hover:scale-105 transition-all"
				>
					Claim My Free Book Now
					<ChevronRight class="w-6 h-6" />
				</a>
				
				<p class="mt-6 text-sm opacity-75">
					✓ No credit card required ✓ Instant access ✓ Own forever
				</p>
			</div>
		</section>
	{/if}
</div>
