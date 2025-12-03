<script>
  import { invalidateAll } from "$app/navigation";
  import { tick } from "svelte";
  import {
    ShoppingCart,
    FileText,
    Headphones,
    Zap,
    Package,
    Star,
    Clock,
  } from "@lucide/svelte";
  import {
    calculatePrice,
    getPromotionalBadge,
    getTimeRemaining,
    calculateBundleSavings,
  } from "$lib/utils/pricing";

  let { product, publicUrl } = $props();

  // Available formats for this product
  const availableFormats = $derived(() => {
    const formats = [];
    if (product.type.includes("EBOOK")) {
      formats.push({
        type: "PDF",
        icon: FileText,
        label: "PDF",
      });
    }
    if (product.type.includes("AUDIOBOOK")) {
      formats.push({
        type: "AUDIO",
        icon: Headphones,
        label: "Audio",
      });
    }
    if (product.type.includes("SUMMARY")) {
      formats.push({
        type: "SUMMARY",
        icon: Zap,
        label: "Summary",
      });
    }
    if (product.type.includes("EBOOK") && product.type.includes("AUDIOBOOK")) {
      const savings = calculateBundleSavings(product);
      formats.push({
        type: "BUNDLE",
        icon: Package,
        label: savings > 0 ? `Save ${savings}` : "Bundle",
      });
    }
    return formats;
  });

  // Default to first available format
  let selectedFormat = $state(availableFormats()[0]?.type || "PDF");
  let addingToCart = $state(false);
  let showSuccess = $state(false);

  // Get pricing for selected format
  const pricing = $derived(calculatePrice(product, selectedFormat));
  const badge = $derived(getPromotionalBadge(product));

  // Timer for countdown - update every second
  let timeLeft = $state(null);
  let intervalId = null;

  // Format duration helper
  function formatDuration(seconds) {
    if (!seconds) return null;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  // Get duration based on selected format - FIXED: removed .by()
  const displayDuration = $derived.by(() => {
    if (selectedFormat === "SUMMARY" && product.summaryDuration) {
      return formatDuration(product.summaryDuration);
    }
    if (
      (selectedFormat === "AUDIO" || selectedFormat === "BUNDLE") &&
      product.duration
    ) {
      return formatDuration(product.duration);
    }
    return null;
  });

  $effect(() => {
    const endDate = product.discountUntil || product.freeUntil;
    if (endDate) {
      // Initial calculation
      timeLeft = getTimeRemaining(endDate);

      // Set up interval
      intervalId = setInterval(() => {
        timeLeft = getTimeRemaining(endDate);
        if (!timeLeft) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }, 1000);

      // Cleanup
      return () => {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      };
    }
  });

  async function handleAddToCart(e) {
    e.preventDefault();
    e.stopPropagation();

    if (addingToCart) return;

    addingToCart = true;

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          format: selectedFormat,
        }),
      });

      if (response.ok) {
        showSuccess = true;
        await invalidateAll();
        await tick();
        setTimeout(() => (showSuccess = false), 2000);
      }
    } catch (error) {
      console.error("Add to cart error:", error);
    } finally {
      addingToCart = false;
    }
  }

  function handleFormatChange(e, format) {
    e.preventDefault();
    e.stopPropagation();
    selectedFormat = format;
  }
</script>

<a
  href="/products/{product.slug}"
  class="group relative bg-card border border-border rounded-xl overflow-hidden hover:shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col"
>
  <!-- Cover Image with Badges -->
  <div class="aspect-[2/3] bg-muted relative overflow-hidden">
    {#if product.coverImage}
      <img
        src={publicUrl + product.coverImage}
        alt={product.title}
        class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
      />
    {:else}
      <div
        class="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50"
      >
        <FileText class="w-16 h-16 text-muted-foreground/30" />
      </div>
    {/if}

    <!-- Promotional Badge (Top Left) -->
    {#if badge}
      <div class="absolute top-2 left-2 z-10">
        <span
          class="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white rounded-lg shadow-lg
					{badge.color === 'green'
            ? 'bg-green-600'
            : badge.color === 'red'
              ? 'bg-red-600 animate-pulse'
              : badge.color === 'orange'
                ? 'bg-orange-600'
                : 'bg-purple-600'}"
        >
          <span>{badge.icon}</span>
          <span>{badge.text}</span>
        </span>
      </div>
    {/if}

    <!-- Featured Badge (Top Right) -->
    {#if product.featured}
      <div class="absolute top-2 right-2 z-10">
        <span
          class="flex items-center gap-1 px-2 py-1 bg-yellow-500 text-white text-xs font-bold rounded-lg shadow-lg"
        >
          <Star class="w-3 h-3 fill-current" />
        </span>
      </div>
    {/if}

    <!-- Time Remaining Banner (Bottom) -->
    {#if timeLeft}
      <div
        class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent py-2 px-3"
      >
        <p class="text-white text-xs font-semibold text-center tracking-wide">
          ⏰ {timeLeft}
        </p>
      </div>
    {/if}
  </div>

  <!-- Content -->
  <div class="p-4 flex-1 flex flex-col">
    <!-- Title & Author -->
    <h3
      class="font-semibold text-sm md:text-base text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1 min-h-[2.5rem]"
    >
      {product.title}
    </h3>

    <p class="text-xs text-muted-foreground mb-3 truncate">
      {product.author}
    </p>

    <!-- Format Selector - Subtle & Neutral -->
    <div class="flex gap-1 mb-3">
      {#each availableFormats() as format}
        <button
          onclick={(e) => handleFormatChange(e, format.type)}
          class=" flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-xs
				transition-all duration-300 ease-in-out transform hover:scale-[1.03] active:scale-[0.98]
				{selectedFormat === format.type
            ? 'bg-slate-100 dark:bg-slate-200 text-slate-900 dark:text-slate-100 shadow-sm'
            : 'bg-slate-50 dark:bg-slate-100 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}"
          title={format.label}
        >
          <svelte:component this={format.icon} class="w-3.5 h-3.5" />
          <span class="hidden sm:inline text-[10px] font-medium"
            >{format.label}</span
          >
        </button>
      {/each}
    </div>

    <!-- Duration Display - FIXED: removed () -->
    {#if displayDuration}
      <div class="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground">
        <Clock class="w-3.5 h-3.5" />
        <span>{displayDuration}</span>
      </div>
    {/if}

    <!-- Rating -->
    {#if product.rating > 0}
      <div class="flex items-center gap-1 mb-3 text-xs">
        <Star class="w-3.5 h-3.5 text-yellow-500 fill-current" />
        <span class="font-medium">{product.rating.toFixed(1)}</span>
        <span class="text-muted-foreground">({product.reviewCount})</span>
      </div>
    {/if}

    <!-- Spacer -->
    <div class="flex-1"></div>

    <!-- Price Display -->
    <div class="mb-3">
      {#if pricing.isFree}
        <div class="text-xl font-bold text-green-600">FREE!</div>
        {#if pricing.originalPrice > 0}
          <div class="text-xs text-muted-foreground line-through">
            Was KSh {pricing.originalPrice}
          </div>
        {/if}
      {:else if pricing.discount > 0}
        <div class="flex items-center gap-2">
          <div class="text-lg font-bold text-primary">
            KSh {pricing.finalPrice}
          </div>
          <div class="text-xs text-muted-foreground line-through">
            {pricing.originalPrice}
          </div>
        </div>
        <div class="text-xs text-green-600 font-medium">
          Save KSh {pricing.savings} ({pricing.discount}% off)
        </div>
      {:else}
        <div class="text-lg font-bold text-primary">
          KSh {pricing.finalPrice}
        </div>
      {/if}
    </div>

    <!-- Add to Cart Button - Same for all products -->
    <button
      onclick={handleAddToCart}
      disabled={addingToCart}
      class="w-full flex items-center justify-center gap-2 py-2.5 px-4 font-semibold rounded-lg transition-all shadow-sm
				{pricing.isFree
        ? 'bg-green-600 hover:bg-green-700 text-white'
        : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900'}
				disabled:opacity-50 disabled:cursor-not-allowed
				{showSuccess ? 'bg-green-600 text-white' : ''}"
    >
      {#if showSuccess}
        <span class="text-sm">✓ Added!</span>
      {:else if addingToCart}
        <span class="text-sm">Adding...</span>
      {:else}
        <ShoppingCart class="w-4 h-4" />
        <span class="text-sm">
          {pricing.isFree ? "Get Free" : "Add to Cart"}
        </span>
      {/if}
    </button>
  </div>
</a>
