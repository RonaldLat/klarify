<script>
  import { Heart, BookOpen, Clock, Star } from '@lucide/svelte';
  import { toast } from 'svelte-sonner';
  
  let { data } = $props();
  
  const publicUrl = "https://pub-ddafa2dcdc11430f8cec35c3cad0b062.r2.dev/";
  
  async function removeFavorite(productId) {
    try {
      const response = await fetch('/api/favorites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      });
      
      if (response.ok) {
        // Remove from UI
        data.favorites = data.favorites.filter(f => f.product.id !== productId);
        toast.success('Removed from favorites');
      } else {
        toast.error('Failed to remove favorite');
      }
    } catch (error) {
      console.error('Remove favorite error:', error);
      toast.error('Something went wrong');
    }
  }
  
  function formatDuration(seconds) {
    if (!seconds) return '';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;
  }
  
  function formatPrice(price) {
    return `KSh ${price.toLocaleString()}`;
  }
</script>

<svelte:head>
  <title>My Favorites - Klarify</title>
</svelte:head>

<div class="min-h-screen bg-background py-12">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-2">
        <Heart class="w-8 h-8 text-red-500 fill-red-500" />
        <h1 class="text-3xl font-bold text-foreground">My Favorites</h1>
      </div>
      <p class="text-muted-foreground">
        {data.favorites.length} {data.favorites.length === 1 ? 'item' : 'items'} saved
      </p>
    </div>

    {#if data.favorites.length === 0}
      <!-- Empty State -->
      <div class="text-center py-16">
        <div class="inline-flex items-center justify-center w-20 h-20 bg-muted rounded-full mb-6">
          <Heart class="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 class="text-2xl font-bold text-foreground mb-3">No favorites yet</h2>
        <p class="text-muted-foreground mb-8 max-w-md mx-auto">
          Start adding your favorite books and audiobooks to keep them handy!
        </p>
        <a 
          href="/products" 
          class="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
        >
          <BookOpen class="w-5 h-5" />
          Browse Products
        </a>
      </div>
    {:else}
      <!-- Favorites Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each data.favorites as favorite}
          {@const product = favorite.product}
          <div class="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow group">
            <a href="/products/{product.slug}" class="block relative">
              <img 
                src="{publicUrl}{product.coverImage}" 
                alt={product.title}
                class="w-full h-64 object-cover"
              />
              
              <!-- Favorite Badge -->
              <div class="absolute top-3 right-3">
                <button
                  onclick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeFavorite(product.id);
                  }}
                  class="w-10 h-10 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                  title="Remove from favorites"
                >
                  <Heart class="w-5 h-5 text-red-500 fill-red-500" />
                </button>
              </div>
              
              <!-- Type Badge -->
              {#if product.type.includes('SUMMARY')}
                <div class="absolute top-3 left-3 px-3 py-1 bg-amber-500 text-white text-xs font-semibold rounded-full">
                  SUMMARY
                </div>
              {/if}
            </a>
            
            <div class="p-5">
              <a href="/products/{product.slug}" class="block">
                <h3 class="font-bold text-lg text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                  {product.title}
                </h3>
                <p class="text-sm text-muted-foreground mb-3">{product.author}</p>
              </a>
              
              <!-- Info -->
              <div class="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-4">
                {#if product.duration}
                  <span class="flex items-center gap-1">
                    <Clock class="w-3 h-3" />
                    {formatDuration(product.duration)}
                  </span>
                {/if}
                {#if product.rating > 0}
                  <span class="flex items-center gap-1">
                    <Star class="w-3 h-3 fill-amber-400 text-amber-400" />
                    {product.rating.toFixed(1)}
                  </span>
                {/if}
              </div>
              
              <!-- Price -->
              <div class="flex items-center justify-between">
                <div class="text-sm">
                  {#if product.type.includes('SUMMARY')}
                    <span class="font-semibold text-foreground">{formatPrice(product.summaryPrice || 69)}</span>
                  {:else if product.bundlePrice}
                    <span class="font-semibold text-foreground">{formatPrice(product.bundlePrice)}</span>
                  {:else}
                    <span class="font-semibold text-foreground">From {formatPrice(product.pdfPrice)}</span>
                  {/if}
                </div>
                
                <a 
                  href="/products/{product.slug}"
                  class="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                >
                  View
                </a>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
