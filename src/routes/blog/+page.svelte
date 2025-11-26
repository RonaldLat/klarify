<script>
	// src/routes/blog/+page.svelte
	import { Calendar, Clock, User, Tag, Search, TrendingUp, BookOpen } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	
	let { data } = $props();
	const publicUrl = "https://pub-ddafa2dcdc11430f8cec35c3cad0b062.r2.dev/";
	
	// Get filter from URL
	let selectedTag = $state($page.url.searchParams.get('tag') || '');
	let searchQuery = $state('');
	
	// Filter posts
	const filteredPosts = $derived.by(() => {
		let posts = data?.posts || [];
		
		if (selectedTag) {
			posts = posts.filter(post => post.tags?.includes(selectedTag));
		}
		
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			posts = posts.filter(post => 
				post.title?.toLowerCase().includes(query) ||
				post.description?.toLowerCase().includes(query) ||
				post.tags?.some(tag => tag.toLowerCase().includes(query))
			);
		}
		
		return posts;
	});
	
	const featuredPost = $derived(
		(data?.posts || []).find(post => post.featured)
	);
	
	const allTags = $derived.by(() => {
		const tags = new Set();
		(data?.posts || []).forEach(post => {
			post.tags?.forEach(tag => tags.add(tag));
		});
		return Array.from(tags);
	});
	
	function selectTag(tag) {
		if (selectedTag === tag) {
			selectedTag = '';
			goto('/blog');
		} else {
			selectedTag = tag;
			goto(`/blog?tag=${tag}`);
		}
	}
	
	function clearFilters() {
		selectedTag = '';
		searchQuery = '';
		goto('/blog');
	}
	
	function formatDate(dateString) {
		return new Date(dateString).toLocaleDateString('en-KE', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Blog - Klarify | Book Summaries, Reading Tips & Learning Insights</title>
	<meta name="description" content="Discover book summaries, reading tips, and learning insights from Klarify. Improve your reading habits and get the most from audiobooks and ebooks." />
</svelte:head>

<div class="min-h-screen bg-background">
	<!-- Hero Section -->
	<section class="bg-gradient-to-br from-primary/10 via-background to-background border-b border-border">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
			<div class="max-w-3xl">
				<div class="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-6">
					<BookOpen class="w-4 h-4" />
					Klarify Blog
				</div>
				<h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
					Learn Smarter, Read Better
				</h1>
				<p class="text-xl text-muted-foreground mb-8">
					Book summaries, reading tips, productivity insights, and the latest in audiobooks and ebooks.
				</p>
				
				<!-- Search Bar -->
				<div class="relative max-w-xl">
					<Search class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
					<input
						type="search"
						bind:value={searchQuery}
						placeholder="Search articles..."
						class="w-full pl-12 pr-4 py-4 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-lg"
					/>
				</div>
			</div>
		</div>
	</section>
	
	<!-- Tags Filter -->
	{#if allTags.length > 0}
		<section class="border-b border-border bg-muted/30">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
				<div class="flex items-center gap-3 overflow-x-auto pb-2">
					<span class="text-sm font-medium text-muted-foreground whitespace-nowrap">
						Topics:
					</span>
					{#each allTags as tag}
						<button
							onclick={() => selectTag(tag)}
							class="inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap
								{selectedTag === tag 
									? 'bg-primary text-primary-foreground' 
									: 'bg-background border border-border hover:border-primary text-foreground'}"
						>
							<Tag class="w-3 h-3" />
							{tag}
						</button>
					{/each}
					{#if selectedTag}
						<button
							onclick={clearFilters}
							class="text-sm text-muted-foreground hover:text-foreground whitespace-nowrap"
						>
							Clear filter
						</button>
					{/if}
				</div>
			</div>
		</section>
	{/if}
	
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
		<!-- Featured Post -->
		{#if featuredPost && !selectedTag && !searchQuery}
			<div class="mb-16">
				<div class="flex items-center gap-2 mb-6">
					<TrendingUp class="w-5 h-5 text-primary" />
					<h2 class="text-2xl font-bold text-foreground">Featured Article</h2>
				</div>
				
				<a 
					href="/blog/{featuredPost.slug}"
					class="group block bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-all hover:border-primary/50"
				>
					<div class="grid md:grid-cols-2 gap-6">
						{#if featuredPost.coverImage}
							<div class="h-64 md:h-full overflow-hidden bg-muted">
								<img 
									src={publicUrl + featuredPost.coverImage} 
									alt={featuredPost.title}
									class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
								/>
							</div>
						{/if}
						
						<div class="p-6 md:p-8 flex flex-col justify-center {featuredPost.coverImage ? '' : 'md:col-span-2'}">
							<div class="flex flex-wrap gap-2 mb-4">
								{#each featuredPost.tags || [] as tag}
									<span class="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
										<Tag class="w-3 h-3" />
										{tag}
									</span>
								{/each}
							</div>
							
							<h3 class="text-2xl md:text-3xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors">
								{featuredPost.title}
							</h3>
							
							<p class="text-muted-foreground mb-6 line-clamp-2">
								{featuredPost.description}
							</p>
							
							<div class="flex items-center gap-4 text-sm text-muted-foreground">
								<span class="flex items-center gap-1">
									<User class="w-4 h-4" />
									{featuredPost.author}
								</span>
								<span class="flex items-center gap-1">
									<Calendar class="w-4 h-4" />
									{formatDate(featuredPost.date)}
								</span>
								<span class="flex items-center gap-1">
									<Clock class="w-4 h-4" />
									{featuredPost.readTime}
								</span>
							</div>
						</div>
					</div>
				</a>
			</div>
		{/if}
		
		<!-- All Posts Grid -->
		<div>
			<h2 class="text-2xl font-bold text-foreground mb-6">
				{selectedTag ? `Articles tagged "${selectedTag}"` : searchQuery ? 'Search Results' : 'Latest Articles'}
			</h2>
			
			{#if filteredPosts.length > 0}
				<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each filteredPosts as post}
						<a 
							href="/blog/{post.slug}"
							class="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all hover:border-primary/50"
						>
							{#if post.coverImage}
								<div class="h-48 overflow-hidden bg-muted">
									<img 
										src={publicUrl + post.coverImage} 
										alt={post.title}
										class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
									/>
								</div>
							{/if}
							
							<div class="p-6">
								<div class="flex flex-wrap gap-2 mb-3">
									{#each (post.tags || []).slice(0, 2) as tag}
										<span class="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
											<Tag class="w-2.5 h-2.5" />
											{tag}
										</span>
									{/each}
								</div>
								
								<h3 class="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2">
									{post.title}
								</h3>
								
								<p class="text-muted-foreground text-sm mb-4 line-clamp-2">
									{post.description}
								</p>
								
								<div class="flex items-center gap-3 text-xs text-muted-foreground">
									<span class="flex items-center gap-1">
										<Calendar class="w-3 h-3" />
										{formatDate(post.date)}
									</span>
									<span class="flex items-center gap-1">
										<Clock class="w-3 h-3" />
										{post.readTime}
									</span>
								</div>
							</div>
						</a>
					{/each}
				</div>
			{:else}
				<div class="text-center py-16">
					<Search class="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
					<h3 class="text-xl font-semibold text-foreground mb-2">
						No articles found
					</h3>
					<p class="text-muted-foreground mb-6">
						Try adjusting your search or filters
					</p>
					<button
						onclick={clearFilters}
						class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
					>
						Clear Filters
					</button>
				</div>
			{/if}
		</div>
	</div>
	
	<!-- Newsletter CTA -->
	<section class="bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-primary-foreground">
		<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
			<h2 class="text-3xl md:text-4xl font-bold mb-4">
				Never Miss an Article
			</h2>
			<p class="text-lg opacity-90 mb-8">
				Get book summaries, reading tips, and exclusive content delivered to your inbox.
			</p>
			<form class="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
				<input
					type="email"
					placeholder="Enter your email"
					class="flex-1 px-4 py-3 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
				/>
				<button
					type="submit"
					class="px-8 py-3 bg-background text-foreground font-semibold rounded-lg hover:bg-background/90 transition-colors whitespace-nowrap"
				>
					Subscribe
				</button>
			</form>
		</div>
	</section>
</div>
