<script>
  // src/lib/components/ExitIntentModal.svelte
  import { X, Gift, ArrowRight } from '@lucide/svelte';
  import { browser } from '$app/environment';
  
  let { enabled = true } = $props();
  
  let show = $state(false);
  let triggered = $state(false);
  
  // Check if user already saw it today
  $effect(() => {
    if (!browser || !enabled) return;
    
    const lastShown = localStorage.getItem('exitIntent_lastShown');
    if (lastShown) {
      const hoursSince = (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60);
      if (hoursSince < 24) {
        triggered = true; // Don't show again today
        return;
      }
    }
    
    const handleMouseOut = (e) => {
      // Only trigger when mouse leaves from top (exiting browser)
      if (e.clientY <= 0 && !triggered && !show) {
        show = true;
        triggered = true;
        
        // Save that we showed it
        localStorage.setItem('exitIntent_lastShown', Date.now().toString());
        
        // Track event (optional)
        fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            event: 'exit_intent_shown',
            data: { timestamp: new Date().toISOString() }
          })
        }).catch(() => {});
      }
    };
    
    // Add listener after 3 seconds (don't annoy immediate visitors)
    const timer = setTimeout(() => {
      document.addEventListener('mouseout', handleMouseOut);
    }, 3000);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  });
  
  function close() {
    show = false;
  }
  
  function handleCTAClick() {
    // Track conversion
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        event: 'exit_intent_converted',
        data: { timestamp: new Date().toISOString() }
      })
    }).catch(() => {});
    
    show = false;
  }
</script>

{#if show}
  <div 
    class="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
    style="background-color: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px);"
    onclick={close}
  >
    <div 
      class="bg-card border border-border max-w-md w-full rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200"
      onclick={(e) => e.stopPropagation()}
    >
      <!-- Close Button -->
      <button
        onclick={close}
        class="absolute top-4 right-4 p-2 hover:bg-muted rounded-full transition-colors"
        aria-label="Close"
      >
        <X class="w-5 h-5" />
      </button>
      
      <!-- Content -->
      <div class="p-8 text-center">
        <!-- Icon -->
        <div class="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <Gift class="w-10 h-10 text-green-600" />
        </div>
        
        <!-- Headline -->
        <h3 class="text-2xl md:text-3xl font-bold text-foreground mb-3">
          Wait! Before You Go...
        </h3>
        
        <!-- Subheadline -->
        <p class="text-lg text-muted-foreground mb-6">
          Get your <strong class="text-foreground">first book completely FREE</strong>
        </p>
        
        <!-- Benefits -->
        <ul class="text-left space-y-2 mb-8 max-w-xs mx-auto">
          <li class="flex items-start gap-2 text-sm text-muted-foreground">
            <span class="text-green-600 mt-0.5">✓</span>
            <span>1000+ books & audiobooks</span>
          </li>
          <li class="flex items-start gap-2 text-sm text-muted-foreground">
            <span class="text-green-600 mt-0.5">✓</span>
            <span>No credit card required</span>
          </li>
          <li class="flex items-start gap-2 text-sm text-muted-foreground">
            <span class="text-green-600 mt-0.5">✓</span>
            <span>Download instantly</span>
          </li>
        </ul>
        
        <!-- CTA -->
        <a
          href="/products"
          onclick={handleCTAClick}
          class="inline-flex items-center justify-center gap-2 w-full px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl text-lg mb-4"
        >
          <Gift class="w-5 h-5" />
          Get My Free Book
          <ArrowRight class="w-5 h-5" />
        </a>
        
        <!-- Dismiss -->
        <button
          onclick={close}
          class="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          No thanks, I'll browse anyway
        </button>
      </div>
    </div>
  </div>
{/if}
