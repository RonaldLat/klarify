<script>
	let { data } = $props();
  console.log('page', data)
</script>

<div class="bg-background">
	<!-- Hero Section -->
	<section class="bg-gradient-to-b from-primary/10 to-background py-20">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="text-center">
				<h1 class="text-5xl md:text-6xl font-bold text-foreground mb-6">
					Welcome to Klarify
				</h1>
				<p class="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
					Discover thousands of audiobooks, ebooks, and magazines. 
					Learn on the go with affordable digital content.
				</p>
				
				{#if !data.user}
					<div class="flex justify-center gap-4">
						<a
							href="/signup"
							class="px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
						>
							Get Started
						</a>
						<a
							href="/#featured"
							class="px-8 py-3 bg-secondary text-secondary-foreground font-semibold rounded-lg hover:bg-secondary/90 transition-colors"
						>
							Browse Content
						</a>
					</div>
				{:else}
					<a
						href="/#featured"
						class="inline-block px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
					>
						Browse Content
					</a>
				{/if}
			</div>
		</div>
	</section>

	<!-- Stats Section -->
	<section class="py-16 bg-card border-y border-border">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
				<div>
					<div class="text-4xl font-bold text-primary mb-2">1000+</div>
					<div class="text-muted-foreground">Books Available</div>
				</div>
				<div>
					<div class="text-4xl font-bold text-primary mb-2">KSh 50</div>
					<div class="text-muted-foreground">Starting From</div>
				</div>
				<div>
					<div class="text-4xl font-bold text-primary mb-2">24/7</div>
					<div class="text-muted-foreground">Instant Access</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Featured Products Section -->
	<section id="featured" class="py-20">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<h2 class="text-3xl font-bold text-foreground mb-8">Featured Content</h2>
			
			<div class="text-center py-12 text-muted-foreground">
				<svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
				</svg>
				<p>No active products yet. Admin can add products via the admin panel.</p>
			</div>
		</div>
	</section>

	<!-- Account Info (if logged in) -->
	{#if data.user}
		<section class="py-20 bg-muted">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="bg-card border border-border rounded-lg p-8 max-w-2xl mx-auto">
					<h3 class="text-2xl font-bold text-foreground mb-6">Your Account</h3>
					
					{#if !data.user.phone}
						<div class="bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-md mb-6">
							<div class="flex items-start gap-3">
								<svg class="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
								</svg>
								<div>
									<div class="font-medium mb-1">Complete Your Profile</div>
									<div class="text-sm opacity-90 mb-2">
										Add your phone number to make purchases via M-Pesa
									</div>
									<a 
										href="/complete-profile" 
										class="text-sm font-semibold underline hover:no-underline"
									>
										Add Phone Number →
									</a>
								</div>
							</div>
						</div>
					{/if}

					<dl class="space-y-4">
						<div class="flex justify-between py-3 border-b border-border">
							<dt class="text-muted-foreground">Name</dt>
							<dd class="font-medium text-foreground">{data.user.name}</dd>
						</div>
						<div class="flex justify-between py-3 border-b border-border">
							<dt class="text-muted-foreground">Email</dt>
							<dd class="font-medium text-foreground">{data.user.email}</dd>
						</div>
						<div class="flex justify-between py-3 border-b border-border">
							<dt class="text-muted-foreground">Phone</dt>
							<dd class="font-medium text-foreground">
								{data.user.phone || 'Not set'}
							</dd>
						</div>
						<div class="flex justify-between py-3">
							<dt class="text-muted-foreground">Account Type</dt>
							<dd class="font-medium text-foreground">
								{data.user.role === 'admin' ? 'Administrator' : 'Customer'}
							</dd>
						</div>
					</dl>
				</div>
			</div>
		</section>
	{/if}
</div>
