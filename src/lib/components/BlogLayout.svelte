<script>
	// src/lib/components/BlogLayout.svelte
	import { Calendar, Clock, User, Tag, ArrowLeft, Share2, Twitter, Facebook, Linkedin } from '@lucide/svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	
	// Blog post metadata (comes from frontmatter)
	export let title = '';
	export let description = '';
	export let date = '';
	export let author = 'Klarify Team';
	export let readTime = '5 min read';
	export let tags = [];
	export let coverImage = '';
	export let featured = false;
	
	const publicUrl = "https://pub-ddafa2dcdc11430f8cec35c3cad0b062.r2.dev/";
	
	// Format date
	let formattedDate = '';
	onMount(() => {
		if (date) {
			formattedDate = new Date(date).toLocaleDateString('en-KE', {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			});
		}
	});
	
	// Share functions
	function shareOnTwitter() {
		const url = encodeURIComponent(window.location.href);
		const text = encodeURIComponent(title);
		window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
	}
	
	function shareOnFacebook() {
		const url = encodeURIComponent(window.location.href);
		window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
	}
	
	function shareOnLinkedIn() {
		const url = encodeURIComponent(window.location.href);
		window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
	}
	
	function copyLink() {
		navigator.clipboard.writeText(window.location.href);
		alert('Link copied to clipboard!');
	}
</script>

<svelte:head>
	<title>{title} - Klarify Blog</title>
	<meta name="description" content={description} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	{#if coverImage}
		<meta property="og:image" content={publicUrl + coverImage} />
	{/if}
	<meta property="og:type" content="article" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	{#if coverImage}
		<meta name="twitter:image" content={publicUrl + coverImage} />
	{/if}
</svelte:head>

<article class="min-h-screen bg-background">
	<!-- Back to Blog -->
	<div class="border-b border-border">
		<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
			<a 
				href="/blog" 
				class="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
			>
				<ArrowLeft class="w-4 h-4" />
				Back to Blog
			</a>
		</div>
	</div>
	
	<!-- Cover Image -->
	{#if coverImage}
		<div class="w-full h-[300px] md:h-[400px] lg:h-[500px] overflow-hidden bg-muted">
			<img 
				src={publicUrl + coverImage} 
				alt={title}
				class="w-full h-full object-cover"
			/>
		</div>
	{/if}
	
	<!-- Article Header -->
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
		<!-- Tags -->
		{#if tags && tags.length > 0}
			<div class="flex flex-wrap gap-2 mb-6">
				{#each tags as tag}
					<a 
						href="/blog?tag={tag}"
						class="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full hover:bg-primary/20 transition-colors"
					>
						<Tag class="w-3 h-3" />
						{tag}
					</a>
				{/each}
			</div>
		{/if}
		
		<!-- Title -->
		<h1 class="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
			{title}
		</h1>
		
		<!-- Description -->
		{#if description}
			<p class="text-xl text-muted-foreground mb-8">
				{description}
			</p>
		{/if}
		
		<!-- Metadata -->
		<div class="flex flex-wrap items-center gap-6 text-sm text-muted-foreground pb-8 border-b border-border mb-8">
			<div class="flex items-center gap-2">
				<User class="w-4 h-4" />
				<span>{author}</span>
			</div>
			
			{#if formattedDate}
				<div class="flex items-center gap-2">
					<Calendar class="w-4 h-4" />
					<span>{formattedDate}</span>
				</div>
			{/if}
			
			<div class="flex items-center gap-2">
				<Clock class="w-4 h-4" />
				<span>{readTime}</span>
			</div>
		</div>
		
		<!-- Share Buttons -->
		<div class="mb-8">
			<div class="flex items-center gap-3">
				<span class="text-sm font-medium text-muted-foreground">Share:</span>
				<button
					onclick={shareOnTwitter}
					class="p-2 hover:bg-muted rounded-lg transition-colors"
					aria-label="Share on Twitter"
				>
					<Twitter class="w-5 h-5" />
				</button>
				<button
					onclick={shareOnFacebook}
					class="p-2 hover:bg-muted rounded-lg transition-colors"
					aria-label="Share on Facebook"
				>
					<Facebook class="w-5 h-5" />
				</button>
				<button
					onclick={shareOnLinkedIn}
					class="p-2 hover:bg-muted rounded-lg transition-colors"
					aria-label="Share on LinkedIn"
				>
					<Linkedin class="w-5 h-5" />
				</button>
				<button
					onclick={copyLink}
					class="p-2 hover:bg-muted rounded-lg transition-colors"
					aria-label="Copy link"
				>
					<Share2 class="w-5 h-5" />
				</button>
			</div>
		</div>
	</div>
	
	<!-- Article Content - FIXED: Proper typography classes -->
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
		<!-- CRITICAL: Add prose class directly to the content wrapper -->
		<div class="prose prose-slate dark:prose-invert lg:prose-lg max-w-none">
			<slot />
		</div>
	</div>
	
	<!-- Related Products CTA -->
	<div class="bg-gradient-to-br from-primary/5 to-primary/10 border-y border-primary/20">
		<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
			<h2 class="text-2xl md:text-3xl font-bold text-foreground mb-4">
				Ready to Start Learning?
			</h2>
			<p class="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
				Browse our collection of 1000+ books, audiobooks, and summaries. Get your first book FREE!
			</p>
			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				<a
					href="/products"
					class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl"
				>
					Browse Books
					<ArrowLeft class="w-5 h-5 rotate-180" />
				</a>
				<a
					href="/blog"
					class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-background border-2 border-border text-foreground font-semibold rounded-xl hover:bg-muted transition-all"
				>
					More Articles
				</a>
			</div>
		</div>
	</div>
</article>

<style>
	/* CRITICAL: Add these styles to ensure typography works */
	:global(.prose) {
		color: var(--color-foreground);
	}
	
	:global(.prose h2) {
		color: var(--color-foreground);
		font-weight: 700;
		font-size: 1.875rem;
		margin-top: 3rem;
		margin-bottom: 1.5rem;
		line-height: 1.3;
	}
	
	:global(.prose h3) {
		color: var(--color-foreground);
		font-weight: 600;
		font-size: 1.5rem;
		margin-top: 2rem;
		margin-bottom: 1rem;
	}
	
	:global(.prose p) {
		color: var(--color-muted-foreground);
		margin-bottom: 1.5rem;
		line-height: 1.75;
	}
	
	:global(.prose a) {
		color: var(--color-primary);
		text-decoration: none;
	}
	
	:global(.prose a:hover) {
		text-decoration: underline;
	}
	
	:global(.prose strong) {
		color: var(--color-foreground);
		font-weight: 600;
	}
	
	:global(.prose ul),
	:global(.prose ol) {
		margin: 1.5rem 0;
		padding-left: 1.5rem;
	}
	
	:global(.prose li) {
		color: var(--color-muted-foreground);
		margin: 0.5rem 0;
	}
	
	:global(.prose blockquote) {
		border-left: 4px solid var(--color-primary);
		padding-left: 1rem;
		font-style: italic;
		color: var(--color-muted-foreground);
		margin: 1.5rem 0;
	}
	
	:global(.prose code) {
		background-color: var(--color-muted);
		color: var(--color-primary);
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
		font-size: 0.875em;
	}
	
	:global(.prose pre) {
		background-color: var(--color-muted);
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		padding: 1rem;
		overflow-x: auto;
		margin: 1.5rem 0;
	}
	
	:global(.prose img) {
		border-radius: 0.5rem;
		box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
		margin: 2rem 0;
	}
	
	:global(.prose hr) {
		border-color: var(--color-border);
		margin: 3rem 0;
	}
</style>
