<!-- src/lib/components/RecentPurchaseToast.svelte -->
<script>
  import { onMount } from 'svelte';
  import { CheckCircle } from '@lucide/svelte';
  
  let purchases = $state([]);
  let currentIndex = $state(0);
  let show = $state(false);
  
  onMount(async () => {
    const res = await fetch('/api/recent-purchases?limit=10');
    const data = await res.json();
    purchases = data.purchases || [];
    
    if (purchases.length === 0) return;
    
    // Show first after 5 seconds
    setTimeout(() => {
      show = true;
      setTimeout(() => show = false, 5000);
    }, 5000);
    
    // Show one every 30 seconds
    setInterval(() => {
      show = true;
      currentIndex = (currentIndex + 1) % purchases.length;
      setTimeout(() => show = false, 5000);
    }, 60000);
  });
  
  const current = $derived(purchases[currentIndex]);
</script>

{#if show && current}
  <div class="fixed bottom-4 left-4 z-40 max-w-sm animate-in slide-in-from-left duration-300">
    <div class="bg-card border border-border rounded-lg p-4 shadow-xl">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
          <CheckCircle class="w-6 h-6 text-white" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-foreground">
            Someone in {current.location} just purchased
          </p>
          <p class="text-xs text-muted-foreground truncate">
            {current.productTitle}
          </p>
        </div>
      </div>
    </div>
  </div>
{/if}
