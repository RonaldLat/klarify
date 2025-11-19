<script>
	import { goto } from "$app/navigation";
	import { 
		ShoppingCart, 
		Search, 
		X, 
		Menu, 
		User, 
		BookOpen, 
		Grid3x3, 
		Library, 
		Settings, 
		LogOut,
		AlertCircle,
		Shield,
		Book,
		Headphones,
		Zap,
		Star
	} from '@lucide/svelte';
	import * as Sheet from "$lib/components/ui/sheet/index.js";
	
	let { user = null, cartCount = 0 } = $props();
	
	const publicUrl = "https://pub-ddafa2dcdc11430f8cec35c3cad0b062.r2.dev/";
	
	let showUserMenu = $state(false);
	let loggingOut = $state(false);
	let mobileMenuOpen = $state(false);
	
	// Search state
	let searchQuery = $state('');
	let searchResults = $state([]);
	let searchAuthors = $state([]);
	let isSearching = $state(false);
	let showSearchResults = $state(false);
	let selectedIndex = $state(-1);
	let searchTimeout;
	let searchInput;

	/**
	 * Handle logout
	 */
	async function handleLogout() {
		loggingOut = true;
		window.location.href = "/logout";
	}

	/**
	 * Close menus when clicking outside
	 */
	function handleClickOutside(event) {
		if (showUserMenu && !event.target.closest('.user-menu')) {
			showUserMenu = false;
		}
		if (showSearchResults && !event.target.closest('.search-container')) {
			showSearchResults = false;
		}
	}
	
	// Search functions
	function getDisplayPrice(product) {
		if (product.isSummary) return product.audioPrice;
		if (product.type === 'AUDIOBOOK') return product.audioPrice;
		if (product.type === 'BUNDLE') return product.bundlePrice;
		return product.pdfPrice;
	}
	
	function formatDuration(seconds) {
		if (!seconds) return null;
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		if (hours > 0) return `${hours}h ${minutes}m`;
		return `${minutes}m`;
	}
	
	function getTypeIcon(product) {
		if (product.isSummary || product.type === 'SUMMARY') return Zap;
		if (product.type === 'AUDIOBOOK') return Headphones;
		return Book;
	}
	
	async function performSearch() {
		if (searchQuery.length < 2) {
			searchResults = [];
			searchAuthors = [];
			showSearchResults = false;
			return;
		}
		
		isSearching = true;
		
		try {
			const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=6`);
			const data = await response.json();
			
			searchResults = data.results || [];
			searchAuthors = data.authors || [];
			showSearchResults = true;
		} catch (error) {
			console.error('Search error:', error);
			searchResults = [];
			searchAuthors = [];
		} finally {
			isSearching = false;
		}
	}
	
	function handleSearchInput() {
		clearTimeout(searchTimeout);
		selectedIndex = -1;
		
		if (searchQuery.length < 2) {
			searchResults = [];
			searchAuthors = [];
			showSearchResults = false;
			return;
		}
		
		searchTimeout = setTimeout(performSearch, 300);
	}
	
	function handleSearchKeydown(e) {
		if (!showSearchResults || searchResults.length === 0) {
			if (e.key === 'Enter' && searchQuery.trim()) {
				performFullSearch();
			}
			return;
		}
		
		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				selectedIndex = Math.min(selectedIndex + 1, searchResults.length - 1);
				break;
			case 'ArrowUp':
				e.preventDefault();
				selectedIndex = Math.max(selectedIndex - 1, -1);
				break;
			case 'Enter':
				e.preventDefault();
				if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
					navigateToProduct(searchResults[selectedIndex]);
				} else {
					performFullSearch();
				}
				break;
			case 'Escape':
				showSearchResults = false;
				searchInput?.blur();
				break;
		}
	}
	
	function navigateToProduct(product) {
		showSearchResults = false;
		searchQuery = '';
		mobileMenuOpen = false;
		goto(`/products/${product.slug}`);
	}
	
	function searchByAuthor(author) {
		showSearchResults = false;
		searchQuery = '';
		mobileMenuOpen = false;
		goto(`/products?q=${encodeURIComponent(author)}`);
	}
	
	function performFullSearch() {
		if (searchQuery.trim()) {
			showSearchResults = false;
			mobileMenuOpen = false;
			goto(`/products?q=${encodeURIComponent(searchQuery)}`);
			searchQuery = '';
		}
	}
	
	function clearSearch() {
		searchQuery = '';
		searchResults = [];
		searchAuthors = [];
		showSearchResults = false;
		selectedIndex = -1;
		searchInput?.focus();
	}
</script>

<svelte:window onclick={handleClickOutside} />

<header class="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between items-center h-16">
			<!-- Mobile Menu Button -->
			<button
				onclick={() => mobileMenuOpen = !mobileMenuOpen}
				class="lg:hidden p-2 hover:bg-accent rounded-md transition-colors"
				aria-label="Menu"
			>
				<Menu class="w-6 h-6" />
			</button>

			<!-- Logo & Desktop Nav -->
			<div class="flex items-center gap-8">
				<a href="/" class="flex items-center gap-2 group">
					<span class="text-xl md:text-2xl font-bold text-primary group-hover:text-primary/80 transition-colors">
						Klarify
					</span>
				</a>
				
				<nav class="hidden lg:flex items-center gap-6">
					<a 
						href="/products" 
						class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
					>
						Browse
					</a>
					<a 
						href="/categories" 
						class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
					>
						Categories
					</a>
					{#if user}
						<a 
							href="/my-library" 
							class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
						>
							My Library
						</a>
					{/if}
				</nav>
			</div>

			<!-- Desktop Search -->
			<div class="hidden md:flex flex-1 max-w-md mx-8 search-container relative">
				<div class="relative w-full">
					<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
					
					<input
						bind:this={searchInput}
						bind:value={searchQuery}
						oninput={handleSearchInput}
						onkeydown={handleSearchKeydown}
						onfocus={() => searchQuery.length >= 2 && (showSearchResults = true)}
						type="search"
						placeholder="Search books, authors, summaries..."
						class="w-full pl-10 pr-12 py-2.5 rounded-lg border border-input bg-background text-foreground text-base
							focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
							transition-all duration-200 placeholder:text-muted-foreground"
					/>
					
					<div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
						{#if isSearching}
							<div class="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
						{:else if searchQuery}
							<button
								onclick={clearSearch}
								class="p-1 hover:bg-accent rounded-full transition-colors"
								aria-label="Clear search"
							>
								<X class="w-4 h-4 text-muted-foreground" />
							</button>
						{/if}
					</div>
				</div>
				
				<!-- Search Results Dropdown -->
				{#if showSearchResults && (searchResults.length > 0 || searchAuthors.length > 0)}
					<div class="absolute z-50 w-full mt-2 top-full bg-card border border-border rounded-lg shadow-2xl overflow-hidden
						animate-in fade-in slide-in-from-top-2 duration-200">
						{#if searchResults.length > 0}
							<div class="max-h-96 overflow-y-auto">
								{#each searchResults as product, index}
									{@const TypeIcon = getTypeIcon(product)}
									<button
										onclick={() => navigateToProduct(product)}
										class="w-full flex items-center gap-3 p-4 hover:bg-accent transition-colors text-left
											{selectedIndex === index ? 'bg-accent' : ''}
											border-b border-border last:border-b-0"
									>
										<div class="flex-shrink-0 w-12 h-16 bg-muted rounded overflow-hidden">
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
											{/if}
										</div>
										
										<div class="flex-1 min-w-0">
											<div class="flex items-start gap-2 mb-1">
												<h4 class="font-semibold text-sm text-foreground line-clamp-1 flex-1">
													{product.title}
												</h4>
												<TypeIcon class="w-4 h-4 flex-shrink-0 {product.isSummary ? 'text-amber-600' : 'text-primary'}" />
											</div>
											
											<p class="text-xs text-muted-foreground truncate mb-1">
												{product.author}
											</p>
											
											<div class="flex items-center justify-between">
												<div class="flex items-center gap-2 text-xs text-muted-foreground">
													{#if product.rating > 0}
														<span class="flex items-center gap-0.5">
															<Star class="w-3 h-3 text-yellow-500 fill-current" />
															{product.rating.toFixed(1)}
														</span>
													{/if}
													{#if product.duration}
														<span>• {formatDuration(product.duration)}</span>
													{:else if product.pageCount}
														<span>• {product.pageCount}p</span>
													{/if}
												</div>
												
												<span class="text-sm font-bold {product.isSummary ? 'text-amber-600' : 'text-primary'}">
													KSh {getDisplayPrice(product)}
												</span>
											</div>
										</div>
									</button>
								{/each}
							</div>
						{/if}
						
						{#if searchAuthors.length > 0}
							<div class="border-t border-border bg-muted/30 p-3">
								<p class="text-xs text-muted-foreground px-2 mb-2">Authors:</p>
								<div class="flex flex-wrap gap-2">
									{#each searchAuthors as author}
										<button
											onclick={() => searchByAuthor(author)}
											class="px-3 py-1.5 bg-background border border-border rounded-full text-sm
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
							View all results for "{searchQuery}"
						</button>
					</div>
				{:else if showSearchResults && searchQuery.length >= 2 && !isSearching}
					<div class="absolute z-50 w-full mt-2 top-full bg-card border border-border rounded-lg shadow-2xl p-6
						animate-in fade-in slide-in-from-top-2 duration-200">
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

			<!-- Right Side Actions -->
			<div class="flex items-center gap-2 md:gap-4">
				{#if user}
					<a 
						href="/cart" 
						class="relative p-2 hover:bg-accent rounded-md transition-colors"
						aria-label="Shopping cart"
					>
						<ShoppingCart class="w-5 h-5" />
						{#if cartCount > 0}
							<span class="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center
								animate-in zoom-in duration-200">
								{cartCount > 9 ? '9+' : cartCount}
							</span>
						{/if}
					</a>

					<div class="relative user-menu hidden lg:block">
						<button
							onclick={() => showUserMenu = !showUserMenu}
							class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
							aria-label="User menu"
						>
							<div class="text-right">
								<div class="text-sm font-medium text-foreground truncate max-w-[120px]">
									{user.name}
								</div>
								<div class="text-xs text-muted-foreground">
									{user.role === 'admin' ? 'Admin' : 'Customer'}
								</div>
							</div>
							<div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
								<span class="text-sm font-semibold text-primary-foreground">
									{user.name?.charAt(0).toUpperCase()}
								</span>
							</div>
						</button>

						{#if showUserMenu}
							<div class="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg py-2 z-50
								animate-in fade-in slide-in-from-top-2 duration-200">
								{#if !user.phone}
									<a
										href="/complete-profile"
										class="flex items-center gap-3 px-4 py-2 text-sm text-primary hover:bg-accent transition-colors"
									>
										<AlertCircle class="w-4 h-4" />
										Add Phone Number
									</a>
								{/if}

								{#if user.role === 'admin'}
									<a
										href="/admin"
										class="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
									>
										<Shield class="w-4 h-4" />
										Admin Panel
									</a>
								{/if}

								<a
									href="/my-library"
									class="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
								>
									<Library class="w-4 h-4" />
									My Library
								</a>

								<a
									href="/account"
									class="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
								>
									<Settings class="w-4 h-4" />
									Account Settings
								</a>

								<div class="border-t border-border my-2"></div>

								<button
									onclick={handleLogout}
									disabled={loggingOut}
									class="w-full flex items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-accent disabled:opacity-50 transition-colors"
								>
									<LogOut class="w-4 h-4" />
									{loggingOut ? 'Logging out...' : 'Logout'}
								</button>
							</div>
						{/if}
					</div>
				{:else}
					<a
						href="/login"
						class="hidden sm:block text-sm font-medium text-foreground hover:text-primary transition-colors"
					>
						Login
					</a>
					<a
						href="/signup"
						class="px-3 md:px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
					>
						Sign Up
					</a>
				{/if}
			</div>
		</div>

		<!-- Mobile Search -->
		<div class="md:hidden pb-3 search-container relative">
			<div class="relative">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
				
				<input
					bind:value={searchQuery}
					oninput={handleSearchInput}
					onkeydown={handleSearchKeydown}
					onfocus={() => searchQuery.length >= 2 && (showSearchResults = true)}
					type="search"
					placeholder="Search..."
					class="w-full pl-10 pr-10 py-2 rounded-lg border border-input bg-background text-foreground
						focus:outline-none focus:ring-2 focus:ring-ring transition-all"
				/>
				
				<div class="absolute right-3 top-1/2 -translate-y-1/2">
					{#if isSearching}
						<div class="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
					{:else if searchQuery}
						<button onclick={clearSearch} class="p-1 hover:bg-accent rounded-full transition-colors">
							<X class="w-4 h-4 text-muted-foreground" />
						</button>
					{/if}
				</div>
			</div>
			
			<!-- Mobile Search Results -->
			{#if showSearchResults && (searchResults.length > 0 || searchAuthors.length > 0)}
				<div class="absolute z-50 w-full mt-2 bg-card border border-border rounded-lg shadow-2xl overflow-hidden">
					{#if searchResults.length > 0}
						<div class="max-h-[60vh] overflow-y-auto">
							{#each searchResults as product, index}
								{@const TypeIcon = getTypeIcon(product)}
								<button
									onclick={() => navigateToProduct(product)}
									class="w-full flex items-center gap-3 p-3 hover:bg-accent transition-colors text-left
										{selectedIndex === index ? 'bg-accent' : ''} border-b border-border last:border-b-0"
								>
									<div class="flex-shrink-0 w-10 h-14 bg-muted rounded overflow-hidden">
										{#if product.coverImage}
											<img src={publicUrl + product.coverImage} alt={product.title} class="w-full h-full object-cover" />
										{/if}
									</div>
									
									<div class="flex-1 min-w-0">
										<div class="flex items-start gap-2 mb-0.5">
											<h4 class="font-semibold text-sm text-foreground line-clamp-1 flex-1">{product.title}</h4>
											<TypeIcon class="w-3.5 h-3.5 flex-shrink-0 {product.isSummary ? 'text-amber-600' : 'text-primary'}" />
										</div>
										<p class="text-xs text-muted-foreground truncate mb-1">{product.author}</p>
										<span class="text-sm font-bold {product.isSummary ? 'text-amber-600' : 'text-primary'}">
											KSh {getDisplayPrice(product)}
										</span>
									</div>
								</button>
							{/each}
						</div>
					{/if}
					
					<button onclick={performFullSearch} class="w-full p-3 bg-primary/5 text-primary font-medium text-sm">
						View all results
					</button>
				</div>
			{:else if showSearchResults && searchQuery.length >= 2 && !isSearching}
				<div class="absolute z-50 w-full mt-2 bg-card border border-border rounded-lg shadow-2xl p-4 text-center">
					<p class="text-sm text-muted-foreground">No results found</p>
				</div>
			{/if}
		</div>
	</div>
</header>

<!-- Mobile Menu Sheet -->
<Sheet.Root bind:open={mobileMenuOpen}>
	<Sheet.Content side="left" class="w-[280px] sm:w-[320px]">
		<Sheet.Header>
			<Sheet.Title>Menu</Sheet.Title>
		</Sheet.Header>
		
		<div class="flex flex-col gap-1 mt-6">
			{#if user}
				<!-- User Info -->
				<div class="flex items-center gap-3 p-4 bg-accent rounded-lg mb-4">
					<div class="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
						<span class="text-lg font-semibold text-primary-foreground">
							{user.name?.charAt(0).toUpperCase()}
						</span>
					</div>
					<div class="flex-1 min-w-0">
						<div class="font-semibold text-foreground truncate">{user.name}</div>
						<div class="text-sm text-muted-foreground truncate">{user.email}</div>
					</div>
				</div>
				
				{#if !user.phone}
					<a href="/complete-profile" onclick={() => mobileMenuOpen = false}
						class="flex items-center gap-3 px-4 py-3 text-primary hover:bg-accent rounded-lg transition-colors">
						<AlertCircle class="w-5 h-5" />
						<span class="font-medium">Add Phone Number</span>
					</a>
				{/if}
				
				{#if user.role === 'admin'}
					<a href="/admin" onclick={() => mobileMenuOpen = false}
						class="flex items-center gap-3 px-4 py-3 hover:bg-accent rounded-lg transition-colors">
						<Shield class="w-5 h-5" />
						<span>Admin Panel</span>
					</a>
				{/if}
			{/if}
			
			<a href="/products" onclick={() => mobileMenuOpen = false}
				class="flex items-center gap-3 px-4 py-3 hover:bg-accent rounded-lg transition-colors">
				<BookOpen class="w-5 h-5" />
				<span>Browse</span>
			</a>
			
			<a href="/categories" onclick={() => mobileMenuOpen = false}
				class="flex items-center gap-3 px-4 py-3 hover:bg-accent rounded-lg transition-colors">
				<Grid3x3 class="w-5 h-5" />
				<span>Categories</span>
			</a>
			
			{#if user}
				<a href="/my-library" onclick={() => mobileMenuOpen = false}
					class="flex items-center gap-3 px-4 py-3 hover:bg-accent rounded-lg transition-colors">
					<Library class="w-5 h-5" />
					<span>My Library</span>
				</a>
				
				<a href="/account" onclick={() => mobileMenuOpen = false}
					class="flex items-center gap-3 px-4 py-3 hover:bg-accent rounded-lg transition-colors">
					<Settings class="w-5 h-5" />
					<span>Account Settings</span>
				</a>
				
				<div class="border-t border-border my-2"></div>
				
				<button onclick={handleLogout} disabled={loggingOut}
					class="flex items-center gap-3 px-4 py-3 text-destructive hover:bg-accent rounded-lg transition-colors disabled:opacity-50 w-full">
					<LogOut class="w-5 h-5" />
					<span>{loggingOut ? 'Logging out...' : 'Logout'}</span>
				</button>
			{:else}
				<div class="border-t border-border my-2"></div>
				
				<a href="/login" onclick={() => mobileMenuOpen = false}
					class="flex items-center gap-3 px-4 py-3 hover:bg-accent rounded-lg transition-colors">
					<User class="w-5 h-5" />
					<span>Login</span>
				</a>
				
				<a href="/signup" onclick={() => mobileMenuOpen = false}
					class="flex items-center gap-3 px-4 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors font-medium">
					<span class="mx-auto">Sign Up</span>
				</a>
			{/if}
		</div>
	</Sheet.Content>
</Sheet.Root>

<style>
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
	
	input[type="search"]::-webkit-search-cancel-button {
		display: none;
	}
</style>
