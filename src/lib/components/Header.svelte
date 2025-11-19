<script>
	import { invalidateAll } from "$app/navigation";
	import { ShoppingCart } from '@lucide/svelte';
	import SearchBar from '$lib/components/SearchBar.svelte';
	
	let { user = null, cartCount = 0 } = $props();
	
	let showUserMenu = $state(false);
	let loggingOut = $state(false);

	/**
	 * Handle logout
	 */
	async function handleLogout() {
		loggingOut = true;
		window.location.href = "/logout";
	}

	/**
	 * Close menu when clicking outside
	 */
	function handleClickOutside(event) {
		if (showUserMenu && !event.target.closest('.user-menu')) {
			showUserMenu = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<header class="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between items-center h-16">
			<!-- Logo & Main Nav -->
			<div class="flex items-center gap-4 md:gap-8">
				<a href="/" class="flex items-center gap-2 group flex-shrink-0">
					<span class="text-xl md:text-2xl font-bold text-primary group-hover:text-primary/80 transition-colors">
						Klarify
					</span>
				</a>
				
				<nav class="hidden lg:flex items-center gap-6">
					<a 
						href="/products" 
						class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
					>
						Browse
					</a>
					<a 
						href="/categories" 
						class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
					>
						Categories
					</a>
					{#if user}
						<a 
							href="/my-library" 
							class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
						>
							My Library
						</a>
					{/if}
				</nav>
			</div>

			<!-- Desktop Search Bar -->
			<div class="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8">
				<SearchBar />
			</div>

			<!-- Right Side Actions -->
			<div class="flex items-center gap-2 md:gap-4">
				{#if user}
					<!-- Cart Icon -->
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

					<!-- User Info & Menu -->
					<div class="relative user-menu">
						<button
							onclick={() => showUserMenu = !showUserMenu}
							class="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 rounded-md hover:bg-accent transition-colors"
							aria-label="User menu"
						>
							<div class="hidden sm:block text-right">
								<div class="text-sm font-medium text-foreground truncate max-w-[120px]">
									{user.name}
								</div>
								<div class="text-xs text-muted-foreground">
									{user.role === 'admin' ? 'Admin' : 'Customer'}
								</div>
							</div>
							<div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
								<span class="text-sm font-semibold text-primary-foreground">
									{user.name?.charAt(0).toUpperCase()}
								</span>
							</div>
						</button>

						<!-- Dropdown Menu -->
						{#if showUserMenu}
							<div class="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg py-2 z-50
								animate-in fade-in slide-in-from-top-2 duration-200">
								<!-- User Info (Mobile) -->
								<div class="sm:hidden px-4 py-2 border-b border-border">
									<div class="text-sm font-medium text-foreground">{user.name}</div>
									<div class="text-xs text-muted-foreground">{user.email}</div>
								</div>

								<!-- Phone Status -->
								{#if !user.phone}
									<a
										href="/complete-profile"
										class="flex items-center gap-3 px-4 py-2 text-sm text-primary hover:bg-accent transition-colors"
									>
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
										</svg>
										Add Phone Number
									</a>
								{/if}

								<!-- Admin Link -->
								{#if user.role === 'admin'}
									<a
										href="/admin"
										class="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
									>
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
										</svg>
										Admin Panel
									</a>
								{/if}

								<!-- My Library -->
								<a
									href="/my-library"
									class="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
									</svg>
									My Library
								</a>

								<!-- Account Settings -->
								<a
									href="/account"
									class="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
									</svg>
									Account Settings
								</a>

								<div class="border-t border-border my-2"></div>

								<!-- Logout -->
								<button
									onclick={handleLogout}
									disabled={loggingOut}
									class="w-full flex items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-accent disabled:opacity-50 transition-colors"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
									</svg>
									{loggingOut ? 'Logging out...' : 'Logout'}
								</button>
							</div>
						{/if}
					</div>
				{:else}
					<!-- Auth Buttons (Not logged in) -->
					<a
						href="/login"
						class="text-sm font-medium text-foreground hover:text-primary transition-colors whitespace-nowrap"
					>
						Login
					</a>
					<a
						href="/signup"
						class="px-3 md:px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors whitespace-nowrap"
					>
						Sign Up
					</a>
				{/if}
			</div>
		</div>

		<!-- Mobile Search Bar -->
		<div class="md:hidden pb-3">
			<SearchBar placeholder="Search..." />
		</div>
	</div>
</header>
