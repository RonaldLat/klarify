<script>
	import { invalidateAll } from '$app/navigation';
	import { Book, Headphones, Zap, Star, ShoppingCart } from '@lucide/svelte';
	import { calculatePrice, getPromotionalBadge, getTimeRemaining } from '$lib/utils/pricing';
	
	let { product, publicUrl } = $props();
	
	// Available formats for this product
	const availableFormats = $derived(() => {
		const formats = [];
		if (product.type.includes('EBOOK')) formats.push({ type: 'PDF', icon: '📕', label: 'PDF' });
		if (product.type.includes('AUDIOBOOK')) formats.push({ type: 'AUDIO', icon: '🎧', label: 'Audio' });
		if (product.type.includes('SUMMARY')) formats.push({ type: 'SUMMARY', icon: '⚡', label: 'Summary' });
		if (product.type.includes('EBOOK') && product.type.includes('AUDIOBOOK')) {
			formats.push({ type: 'BUNDLE', icon: '📦', label: 'Bundle' });
		}
		return formats;
	});
	
	// Default to first available format
	let selectedFormat = $state(availableFormats()[0]?.type || 'PDF');
	let addingToCart = $state(false);
	let showSuccess = $state(false);
	
	// Get pricing for selected format
	const pricing = $derived(calculatePrice(product, selectedFormat));
	const badge = $derived(getPromotionalBadge(product));
	const timeLeft = $derived(getTimeRemaining(product.discountUntil || product.freeUntil));
	
	async function handleAddToCart(e) {
		e.preventDefault();
		e.stopPropagation();
		
		if (addingToCart) return;
		
		addingToCart = true;
		
		try {
			const response = await fetch('/api/cart', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					productId: product.id,
					format: selectedFormat
				})
			});
			
			if (response.ok) {
				showSuccess = true;
				await invalidateAll();
				setTimeout(() => showSuccess = false, 2000);
			}
		} catch (error) {
			console.error('Add to cart error:', error);
		} finally {
			addingToCart = false;
		}
	}
	
	function handleFormatChange(e, format) {
		e.preventDefault();
		e.stopPropagation();
		selectedFormat = format;
	}
</script>

<a
	href="/products/{product.slug}"
	class="group relative bg-card border border-border rounded-xl overflow-hidden hover:shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col"
>
	<!-- Cover Image with Badges -->
	<div class="aspect-[2/3] bg-muted relative overflow-hidden">
		{#if product.coverImage}
			<img 
				src={publicUrl + product.coverImage} 
				alt={product.title}
				class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
			/>
		{:else}
			<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
				<Book class="w-16 h-16 text-muted-foreground/30" />
			</div>
		{/if}
		
		<!-- Promotional Badge (Top Left) -->
		{#if badge}
			<div class="absolute top-2 left-2 z-10">
				<span class="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white rounded-lg shadow-lg
					{badge.color === 'green' ? 'bg-green-500' :
					 badge.color === 'red' ? 'bg-red-500 animate-pulse' :
					 badge.color === 'orange' ? 'bg-orange-500' :
					 'bg-purple-500'}">
					<span>{badge.icon}</span>
					<span>{badge.text}</span>
				</span>
			</div>
		{/if}
		
		<!-- Featured Badge (Top Right) -->
		{#if product.featured}
			<div class="absolute top-2 right-2 z-10">
				<span class="flex items-center gap-1 px-2 py-1 bg-yellow-500 text-white text-xs font-bold rounded-lg shadow-lg">
					<Star class="w-3 h-3 fill-current" />
				</span>
			</div>
		{/if}
		
		<!-- Time Remaining Banner (Bottom) -->
		{#if timeLeft}
			<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent py-2 px-3">
				<p class="text-white text-xs font-semibold text-center">
					⏰ {timeLeft}
				</p>
			</div>
		{/if}
	</div>

	<!-- Content -->
	<div class="p-4 flex-1 flex flex-col">
		<!-- Title & Author -->
		<h3 class="font-semibold text-sm md:text-base text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1 min-h-[2.5rem]">
			{product.title}
		</h3>
		
		<p class="text-xs text-muted-foreground mb-3 truncate">
			{product.author}
		</p>

		<!-- Format Selector -->
		<div class="flex gap-1.5 mb-3">
			{#each availableFormats() as format}
				<button
					onclick={(e) => handleFormatChange(e, format.type)}
					class="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all
						{selectedFormat === format.type 
							? (format.type === 'SUMMARY' 
								? 'bg-amber-500 text-white shadow-md' 
								: 'bg-primary text-primary-foreground shadow-md')
							: 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}"
					title={format.label}
				>
					<span class="text-sm">{format.icon}</span>
					<span class="hidden sm:inline">{format.label}</span>
				</button>
			{/each}
		</div>

		<!-- Rating -->
		{#if product.rating > 0}
			<div class="flex items-center gap-1 mb-3 text-xs">
				<Star class="w-3.5 h-3.5 text-yellow-500 fill-current" />
				<span class="font-medium">{product.rating.toFixed(1)}</span>
				<span class="text-muted-foreground">({product.reviewCount})</span>
			</div>
		{/if}

		<!-- Spacer -->
		<div class="flex-1"></div>

		<!-- Price Display -->
		<div class="mb-3">
			{#if pricing.isFree}
				<div class="text-xl font-bold text-green-600">
					FREE!
				</div>
				{#if pricing.originalPrice > 0}
					<div class="text-xs text-muted-foreground line-through">
						Was KSh {pricing.originalPrice}
					</div>
				{/if}
			{:else if pricing.discount > 0}
				<div class="flex items-center gap-2">
					<div class="text-lg font-bold text-primary">
						KSh {pricing.finalPrice}
					</div>
					<div class="text-xs text-muted-foreground line-through">
						{pricing.originalPrice}
					</div>
				</div>
				<div class="text-xs text-green-600 font-medium">
					Save KSh {pricing.savings} ({pricing.discount}% off)
				</div>
			{:else}
				<div class="text-lg font-bold text-primary">
					KSh {pricing.finalPrice}
				</div>
			{/if}
		</div>

		<!-- Add to Cart Button -->
		<button
			onclick={handleAddToCart}
			disabled={addingToCart}
			class="w-full flex items-center justify-center gap-2 py-2.5 px-4 font-semibold rounded-lg transition-all shadow-sm
				{pricing.isFree 
					? 'bg-green-500 hover:bg-green-600 text-white' 
					: selectedFormat === 'SUMMARY'
						? 'bg-amber-500 hover:bg-amber-600 text-white'
						: 'bg-primary hover:bg-primary/90 text-primary-foreground'}
				disabled:opacity-50 disabled:cursor-not-allowed
				{showSuccess ? 'bg-green-500 text-white' : ''}"
		>
			{#if showSuccess}
				<span>✓ Added!</span>
			{:else if addingToCart}
				<span class="text-sm">Adding...</span>
			{:else}
				<ShoppingCart class="w-4 h-4" />
				<span class="text-sm">
					{pricing.isFree ? 'Get Free' : 'Add to Cart'}
				</span>
			{/if}
		</button>
	</div>
</a>
