<script>
	import { Search, X, Book, Headphones, Zap, TrendingUp, Clock } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	
	let { placeholder = "Search books, authors, summaries..." } = $props();
	
	const publicUrl = "https://pub-ddafa2dcdc11430f8cec35c3cad0b062.r2.dev/";
	
	let searchQuery = $state('');
	let results = $state([]);
	let authors = $state([]);
	let isLoading = $state(false);
	let showResults = $state(false);
	let selectedIndex = $state(-1);
	let searchTimeout;
	let searchInput;
	
	// Format price
	function getDisplayPrice(product) {
		// FIX: Use summaryPrice for products marked as a summary (derived property).
		if (product.isSummary) return product.summaryPrice;
		if (product.type && product.type.includes('AUDIOBOOK')) return product.audioPrice;
		if (product.type && product.type.includes('BUNDLE')) return product.bundlePrice;
		return product.pdfPrice;
	}
	
	// Format duration
	function formatDuration(seconds) {
		if (!seconds) return null;
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		if (hours > 0) return `${hours}h ${minutes}m`;
		return `${minutes}m`;
	}
	
	// Get type icon
	function getTypeIcon(product) {
		// Uses the derived isSummary property
		if (product.isSummary || (product.type && product.type.includes('SUMMARY'))) return Zap;
		if (product.type && product.type.includes('AUDIOBOOK')) return Headphones;
		return Book;
	}
	
	// Debounced search
	async function performSearch() {
		if (searchQuery.length < 2) {
			results = [];
			authors = [];
			showResults = false;
			return;
		}
		
		isLoading = true;
		
		try {
			const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=8`);
			const data = await response.json();
			
			// FIX: Derive the missing isSummary property from the 'type' array
			results = (data.results || []).map(product => ({
				...product,
				isSummary: product.type ? product.type.includes('SUMMARY') : false
			}));
			
			authors = data.authors || [];
			showResults = true;
		} catch (error) {
			console.error('Search error:', error);
			results = [];
			authors = [];
		} finally {
			isLoading = false;
		}
	}
	
	// Handle input with debounce
	function handleInput() {
		clearTimeout(searchTimeout);
		selectedIndex = -1;
		
		if (searchQuery.length < 2) {
			results = [];
			authors = [];
			showResults = false;
			return;
		}
		
		searchTimeout = setTimeout(performSearch, 300);
	}
	
	// Handle keyboard navigation
	function handleKeydown(e) {
		if (!showResults || results.length === 0) return;
		
		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
				break;
			case 'ArrowUp':
				e.preventDefault();
				selectedIndex = Math.max(selectedIndex - 1, -1);
				break;
			case 'Enter':
				e.preventDefault();
				if (selectedIndex >= 0 && selectedIndex < results.length) {
					navigateToProduct(results[selectedIndex]);
				} else {
					performFullSearch();
				}
				break;
			case 'Escape':
				showResults = false;
				searchInput?.blur();
				break;
		}
	}
	
	// Navigate to product
	function navigateToProduct(product) {
		showResults = false;
		searchQuery = '';
		goto(`/products/${product.slug}`);
	}
	
	// Navigate to author search
	function searchByAuthor(author) {
		showResults = false;
		searchQuery = '';
		goto(`/products?q=${encodeURIComponent(author)}`);
	}
	
	// Perform full search
	function performFullSearch() {
		if (searchQuery.trim()) {
			showResults = false;
			goto(`/products?q=${encodeURIComponent(searchQuery)}`);
		}
	}
	
	// Clear search
	function clearSearch() {
		searchQuery = '';
		results = [];
		authors = [];
		showResults = false;
		selectedIndex = -1;
		searchInput?.focus();
	}
	
	// Handle click outside
	function handleClickOutside(event) {
		if (showResults && !event.target.closest('.search-container')) {
			showResults = false;
		}
	}
	
	onMount(() => {
		document.addEventListener('click', handleClickOutside);
		return () => document.removeEventListener('click', handleClickOutside);
	});
</script>

<div class="search-container relative w-full">
	<div class="relative">
		<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground pointer-events-none" />
		
		<input
			bind:this={searchInput}
			bind:value={searchQuery}
			oninput={handleInput}
			onkeydown={handleKeydown}
			onfocus={() => searchQuery.length >= 2 && (showResults = true)}
			type="search"
			{placeholder}
			class="w-full pl-9 md:pl-10 pr-10 md:pr-12 py-2 md:py-2.5 rounded-lg border border-input bg-background text-foreground text-sm md:text-base
				focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
				transition-all duration-200
				placeholder:text-muted-foreground"
		/>
		
		<div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
			{#if isLoading}
				<div class="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
			{:else if searchQuery}
				<button
					onclick={clearSearch}
					class="p-1 hover:bg-accent rounded-full transition-colors"
					aria-label="Clear search"
				>
					<X class="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground" />
				</button>
			{/if}
		</div>
	</div>
	
	{#if showResults && (results.length > 0 || authors.length > 0)}
		<div 
			class="absolute z-50 w-full mt-2 bg-card border border-border rounded-lg shadow-2xl overflow-hidden
				animate-in fade-in slide-in-from-top-2 duration-200"
		>
			{#if results.length > 0}
				<div class="max-h-[60vh] md:max-h-96 overflow-y-auto overscroll-contain">
					{#each results as product, index}
						{@const TypeIcon = getTypeIcon(product)}
						<button
							onclick={() => navigateToProduct(product)}
							class="w-full flex items-center gap-3 p-3 md:p-4 hover:bg-accent transition-colors text-left
								{selectedIndex === index ? 'bg-accent' : ''}
								border-b border-border last:border-b-0"
						>
							<div class="flex-shrink-0 w-12 h-16 md:w-14 md:h-20 bg-muted rounded overflow-hidden">
								{#if product.coverImage}
									<img 
										src={publicUrl + product.coverImage}
										alt={product.title}
										class="w-full h-full object-cover"
									/>
								{:else}
									<div class="w-full h-full flex items-center justify-center">
										<Book class="w-6 h-6 text-muted-foreground opacity-50" />
									</div>
								{</if}
							</div>
							
							<div class="flex-1 min-w-0">
								<div class="flex items-start gap-2 mb-1">
									<h4 class="font-semibold text-sm md:text-base text-foreground line-clamp-1 flex-1">
										{product.title}
									</h4>
									<TypeIcon class="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0 {product.isSummary ? 'text-amber-600' : 'text-primary'}" />
								</div>
								
								<p class="text-xs md:text-sm text-muted-foreground truncate mb-1">
									{product.author}
								</p>
								
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-2 text-xs text-muted-foreground">
										{#if product.rating > 0}
											<span class="flex items-center gap-0.5">
												⭐ {product.rating.toFixed(1)}
											</span>
										{/if}
										{#if product.duration}
											<span class="hidden sm:inline">• {formatDuration(product.duration)}</span>
										{:else if product.pageCount}
											<span class="hidden sm:inline">• {product.pageCount}p</span>
										{/if}
									</div>
									
									<span class="text-sm md:text-base font-bold {product.isSummary ? 'text-amber-600' : 'text-primary'}">
										KSh {getDisplayPrice(product)}
									</span>
								</div>
							</div>
						</button>
					{/each}
				</div>
			{/if}
			
			{#if authors.length > 0}
				<div class="border-t border-border bg-muted/30 p-2">
					<p class="text-xs text-muted-foreground px-2 mb-2">Authors:</p>
					<div class="flex flex-wrap gap-2">
						{#each authors as author}
							<button
								onclick={() => searchByAuthor(author)}
								class="px-3 py-1.5 bg-background border border-border rounded-full text-xs md:text-sm
									hover:bg-accent hover:border-primary transition-colors"
							>
								{author}
							</button>
						{/each}
					</div>
				</div>
			{/if}
			
			<button
				onclick={performFullSearch}
				class="w-full flex items-center justify-center gap-2 p-3 bg-primary/5 hover:bg-primary/10 
					text-primary font-medium text-sm transition-colors"
			>
				<TrendingUp class="w-4 h-4" />
				View all results for "{searchQuery}"
			</button>
		</div>
	{:else if showResults && searchQuery.length >= 2 && !isLoading}
		<div 
			class="absolute z-50 w-full mt-2 bg-card border border-border rounded-lg shadow-2xl p-6
				animate-in fade-in slide-in-from-top-2 duration-200"
		>
			<div class="text-center">
				<Search class="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
				<p class="text-sm text-muted-foreground mb-2">No results found for "{searchQuery}"</p>
				<button
					onclick={performFullSearch}
					class="text-sm text-primary hover:underline"
				>
					Search in all products
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	/* Custom scrollbar for results */
	.search-container ::-webkit-scrollbar {
		width: 6px;
	}
	
	.search-container ::-webkit-scrollbar-track {
		background: transparent;
	}
	
	.search-container ::-webkit-scrollbar-thumb {
		background: hsl(var(--muted-foreground) / 0.3);
		border-radius: 3px;
	}
	
	.search-container ::-webkit-scrollbar-thumb:hover {
		background: hsl(var(--muted-foreground) / 0.5);
	}
	
	/* Remove default search input styling */
	input[type="search"]::-webkit-search-cancel-button {
		display: none;
	}
</style>
