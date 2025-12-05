<script>
  import ProductCard from "$lib/components/ProductCard.svelte";
  import { Book, Headphones, Zap, FileText } from "@lucide/svelte";

  let { data } = $props();
  console.log(data)
  const publicUrl = "https://pub-ddafa2dcdc11430f8cec35c3cad0b062.r2.dev/";

  /**
   * Format duration in seconds to readable format
   */
  function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  // Build query string helper
  function buildQuery(page) {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    if (data.searchQuery) params.set("q", data.searchQuery);
    if (data.categorySlug) params.set("category", data.categorySlug);
    if (data.type) params.set("type", data.type);
    return `/products?${params.toString()}`;
  }

  // Generate page numbers to show
  function getPageNumbers() {
    const delta = 1; // Number of pages to show on each side of current page
    const pages = [];
    const left = Math.max(2, data.currentPage - delta);
    const right = Math.min(data.totalPages - 1, data.currentPage + delta);

    // Always show first page
    pages.push(1);

    // Add ellipsis if needed
    if (left > 2) {
      pages.push("...");
    }

    // Add middle pages
    for (let i = left; i <= right; i++) {
      pages.push(i);
    }

    // Add ellipsis if needed
    if (right < data.totalPages - 1) {
      pages.push("...");
    }

    // Always show last page (if more than 1 page)
    if (data.totalPages > 1) {
      pages.push(data.totalPages);
    }

    return pages;
  }

  const pageNumbers = $derived(getPageNumbers());
</script>

<div class="bg-background">
  <!-- Filters Section -->
  <section class="bg-card border-b border-border py-6">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div
        class="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between"
      >
        <!-- Type Filter -->
        <div class="flex gap-2 flex-wrap">
          <a
            href="/products"
            class="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
							{!data.type
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}"
          >
            <Book class="w-4 h-4" />
            All
          </a>
          <a
            href="/products?type=EBOOK"
            class="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
							{data.type === 'EBOOK'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}"
          >
            <Book class="w-4 h-4" />
            eBooks
          </a>
          <a
            href="/products?type=AUDIOBOOK"
            class="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
							{data.type === 'AUDIOBOOK'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}"
          >
            <Headphones class="w-4 h-4" />
            Audiobooks
          </a>
          <a
            href="/products?type=SUMMARY"
            class="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors relative
							{data.type === 'SUMMARY'
              ? 'bg-amber-500 text-white'
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'}"
          >
            <Zap class="w-4 h-4" />
            Summaries
            <span
              class="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full"
            >
              New
            </span>
          </a>
          <a
            href="/products?type=MAGAZINE"
            class="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
							{data.type === 'MAGAZINE'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}"
          >
            <FileText class="w-4 h-4" />
            Magazines
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- Summary Feature Banner (only when viewing summaries) -->
  {#if data.type === "SUMMARY"}
    <section
      class="bg-gradient-to-br from-amber-500/10 via-background to-background border-b border-border py-8"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col md:flex-row items-center gap-6">
          <div class="flex-shrink-0">
            <div
              class="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center"
            >
              <Zap class="w-8 h-8 text-white" />
            </div>
          </div>
          <div class="flex-1 text-center md:text-left">
            <h2 class="text-2xl font-bold text-foreground mb-2">
              Learn Faster with Audio Summaries
            </h2>
            <p class="text-muted-foreground">
              Get key insights from bestselling books in 15-20 minutes. Perfect
              for busy learners.
            </p>
          </div>
          <div class="flex gap-4 text-sm">
            <div class="flex items-center gap-2">
              <Headphones class="w-5 h-5 text-amber-500" />
              <span class="text-muted-foreground">Audio Only</span>
            </div>
            <div class="flex items-center gap-2">
              <Zap class="w-5 h-5 text-amber-500" />
              <span class="text-muted-foreground">15-20 min</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  {/if}

  <!-- Results Count -->
  <section class="py-6">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <p class="text-muted-foreground">
        {data.totalCount}
        {data.totalCount === 1 ? "product" : "products"} found
        {#if data.searchQuery}
          for "{data.searchQuery}"
        {/if}
      </p>
    </div>
  </section>

  <!-- Products Grid -->
  <section class="pb-20">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {#if data.products.length === 0}
        <!-- Empty State -->
        <div class="text-center py-16">
          {#if data.type === "SUMMARY"}
            <Zap class="w-24 h-24 mx-auto mb-6 text-amber-500 opacity-50" />
          {:else}
            <svg
              class="w-24 h-24 mx-auto mb-6 text-muted-foreground opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          {/if}
          <h3 class="text-xl font-semibold text-foreground mb-2">
            No products found
          </h3>
          <p class="text-muted-foreground mb-6">
            Try adjusting your search or filters
          </p>
          <a href="/products" class="text-primary hover:underline"
            >Clear filters</a
          >
        </div>
      {:else}
        <!-- Products Grid - Mobile First -->
        <div
          class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
        >
          {#each data.products as product}
            <ProductCard {product} {publicUrl} />
          {/each}
        </div>

        <!-- Enhanced Pagination -->
        {#if data.totalPages > 1}
          <nav class="mt-8 sm:mt-12" aria-label="Pagination">
            <!-- Mobile View - Simplified -->
            <div class="flex sm:hidden items-center justify-center gap-2">
              {#if data.currentPage > 1}
                <a
                  href={buildQuery(data.currentPage - 1)}
                  class="px-3 py-2 rounded-md border border-border bg-card hover:bg-accent transition-colors text-sm"
                  aria-label="Previous page"
                >
                  ← Prev
                </a>
              {/if}

              <span
                class="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium"
              >
                {data.currentPage} / {data.totalPages}
              </span>

              {#if data.currentPage < data.totalPages}
                <a
                  href={buildQuery(data.currentPage + 1)}
                  class="px-3 py-2 rounded-md border border-border bg-card hover:bg-accent transition-colors text-sm"
                  aria-label="Next page"
                >
                  Next →
                </a>
              {/if}
            </div>

            <!-- Desktop View - Full Pagination -->
            <div class="hidden sm:flex items-center justify-center gap-1">
              <!-- Previous Button -->
              {#if data.currentPage > 1}
                <a
                  href={buildQuery(data.currentPage - 1)}
                  class="px-4 py-2 rounded-md border border-border bg-card hover:bg-accent transition-colors text-sm font-medium"
                  aria-label="Previous page"
                >
                  ← Previous
                </a>
              {/if}

              <!-- Page Numbers -->
              <div class="flex items-center gap-1 mx-2">
                {#each pageNumbers as page}
                  {#if page === "..."}
                    <span class="px-3 py-2 text-muted-foreground">...</span>
                  {:else if page === data.currentPage}
                    <span
                      class="px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium"
                      aria-current="page"
                    >
                      {page}
                    </span>
                  {:else}
                    <a
                      href={buildQuery(page)}
                      class="px-4 py-2 rounded-md border border-border bg-card hover:bg-accent transition-colors text-sm font-medium hover:border-primary/50"
                      aria-label="Go to page {page}"
                    >
                      {page}
                    </a>
                  {/if}
                {/each}
              </div>

              <!-- Next Button -->
              {#if data.currentPage < data.totalPages}
                <a
                  href={buildQuery(data.currentPage + 1)}
                  class="px-4 py-2 rounded-md border border-border bg-card hover:bg-accent transition-colors text-sm font-medium"
                  aria-label="Next page"
                >
                  Next →
                </a>
              {/if}
            </div>

            <!-- Page Info - Desktop Only -->
            <div
              class="hidden sm:block text-center mt-4 text-sm text-muted-foreground"
            >
              Page {data.currentPage} of {data.totalPages}
            </div>
          </nav>
        {/if}
      {/if}

      <!-- Categories -->
      {#if data.categories.length > 0}
        <div class="mt-12 flex flex-wrap gap-2">
          <span class="text-sm text-muted-foreground">Categories:</span>
          {#each data.categories as category}
            <a
              href="/products?category={category.slug}{data.type
                ? `&type=${data.type}`
                : ''}"
              class="px-3 py-1 rounded-full text-xs font-medium transition-colors
								{data.categorySlug === category.slug
                ? data.type === 'SUMMARY'
                  ? 'bg-amber-500 text-white'
                  : 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}"
            >
              {category.icon}
              {category.name}
            </a>
          {/each}
        </div>
      {/if}
    </div>
  </section>
</div>
