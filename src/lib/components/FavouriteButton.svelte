<script>
  // src/lib/components/FavoriteButton.svelte
  import { Heart } from '@lucide/svelte';
  import { toast } from 'svelte-sonner';
  import { goto } from '$app/navigation';
  
  let { 
    productId,
    isFavorite: initialFavorite = false,
    isAuthenticated = false,
    size = 'default', // 'small', 'default', 'large'
    variant = 'default' // 'default', 'minimal'
  } = $props();
  
  let isFavorite = $state(initialFavorite);
  let isLoading = $state(false);
  
  const sizeClasses = {
    small: 'w-8 h-8',
    default: 'w-10 h-10',
    large: 'w-12 h-12'
  };
  
  const iconSizes = {
    small: 'w-4 h-4',
    default: 'w-5 h-5',
    large: 'w-6 h-6'
  };
  
  async function toggleFavorite() {
    if (!isAuthenticated) {
      toast.error('Please login to save favorites');
      goto('/login');
      return;
    }
    
    if (isLoading) return;
    
    isLoading = true;
    const previousState = isFavorite;
    isFavorite = !isFavorite; // Optimistic update
    
    try {
      const response = await fetch('/api/favorites', {
        method: isFavorite ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update favorite');
      }
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(isFavorite ? 'Added to favorites' : 'Removed from favorites');
      } else {
        // Revert on failure
        isFavorite = previousState;
        toast.error(result.error || 'Something went wrong');
      }
    } catch (error) {
      console.error('Favorite toggle error:', error);
      isFavorite = previousState; // Revert on error
      toast.error('Failed to update favorite');
    } finally {
      isLoading = false;
    }
  }
</script>

<button
  onclick={toggleFavorite}
  disabled={isLoading}
  class="
    {sizeClasses[size]}
    {variant === 'minimal' 
      ? 'bg-transparent hover:bg-accent' 
      : 'bg-white/90 dark:bg-black/90 backdrop-blur-sm hover:bg-white dark:hover:bg-black'
    }
    rounded-full flex items-center justify-center
    transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
    {isFavorite ? 'scale-110' : 'hover:scale-110'}
  "
  title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
>
  <Heart 
    class="
      {iconSizes[size]}
      transition-colors duration-200
      {isFavorite ? 'text-red-500 fill-red-500' : 'text-muted-foreground hover:text-red-500'}
      {isLoading ? 'animate-pulse' : ''}
    " 
  />
</button>
