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
	
	<!-- Article Content -->
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
		<div class="prose prose-lg dark:prose-invert max-w-none
			prose-headings:font-bold prose-headings:text-foreground
			prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
			prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
			prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-6
			prose-a:text-primary prose-a:no-underline hover:prose-a:underline
			prose-strong:text-foreground prose-strong:font-semibold
			prose-ul:my-6 prose-ul:list-disc prose-ul:pl-6
			prose-ol:my-6 prose-ol:list-decimal prose-ol:pl-6
			prose-li:text-muted-foreground prose-li:my-2
			prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground
			prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded
			prose-pre:bg-muted prose-pre:border prose-pre:border-border
			prose-img:rounded-lg prose-img:shadow-lg
			prose-hr:border-border prose-hr:my-12"
		>
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
