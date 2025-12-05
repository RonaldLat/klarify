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

  let { product, publicUrl, lazy = true } = $props();

  // Available formats
  const availableFormats = $derived(() => {
    const formats = [];
    if (product.type.includes("EBOOK")) {
      formats.push({ type: "PDF", icon: FileText, label: "PDF" });
    }
    if (product.type.includes("AUDIOBOOK")) {
      formats.push({ type: "AUDIO", icon: Headphones, label: "Audio" });
    }
    if (product.type.includes("SUMMARY")) {
      formats.push({ type: "SUMMARY", icon: Zap, label: "Summary" });
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

  let selectedFormat = $state(availableFormats()[0]?.type || "PDF");
  let addingToCart = $state(false);
  let showSuccess = $state(false);

  const pricing = $derived(calculatePrice(product, selectedFormat));
  const badge = $derived(getPromotionalBadge(product));

  // OPTIMIZED: Only track time for products with actual promotions
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

  // OPTIMIZED: Only set up timer if there's an actual promotion
  $effect(() => {
    const endDate = product.discountUntil || product.freeUntil;
    if (endDate) {
      timeLeft = getTimeRemaining(endDate);
      intervalId = setInterval(() => {
        timeLeft = getTimeRemaining(endDate);
        if (!timeLeft && intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }, 1000);

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
        loading={lazy ? "lazy" : "eager"}
        decoding="async"
        class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
      />
    {:else}
      <div
        class="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50"
      >
        <FileText class="w-16 h-16 text-muted-foreground/30" />
      </div>
    {/if}

    <!-- Promotional Badge -->
    {#if badge}
      <div class="absolute top-2 left-2 z-10">
        <span
          class="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white rounded-lg shadow-lg
                    {badge.color === 'green'
            ? 'bg-green-600'
            : badge.color === 'red'
              ? 'bg-red-600'
              : badge.color === 'orange'
                ? 'bg-orange-600'
                : 'bg-purple-600'}"
        >
          <span>{badge.icon}</span>
          <span>{badge.text}</span>
        </span>
      </div>
    {/if}

    <!-- Featured Badge -->
    {#if product.featured}
      <div class="absolute top-2 right-2 z-10">
        <span
          class="flex items-center gap-1 px-2 py-1 bg-yellow-500 text-white text-xs font-bold rounded-lg shadow-lg"
        >
          <Star class="w-3 h-3 fill-current" />
        </span>
      </div>
    {/if}

    <!-- Time Remaining -->
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

    <!-- Format Selector - Updated text color for consistency -->
    <div class="flex gap-1 mb-3">
      {#each availableFormats() as format}
        <button
          onclick={(e) => handleFormatChange(e, format.type)}
          class="flex-1 flex items-center justify-center gap-1 p-1.5 rounded-md text-xs
                    transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]
                    {selectedFormat === format.type
            ? 'bg-slate-300 dark:bg-slate-200 text-slate-900 shadow-sm' // Selected: dark text on light background
            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700'}"
          title={format.label}
        >
          <svelte:component this={format.icon} class="w-3.5 h-3.5" />
          <!-- The label is now only hidden on the smallest screens (up to sm) -->
          <span class="hidden sm:inline text-[10px] font-medium"
            >{format.label}</span
          >
        </button>
      {/each}
    </div>

    <!-- Duration Display -->
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

    <button
      onclick={handleAddToCart}
      disabled={addingToCart}
      class="w-full flex items-center justify-center gap-2 py-2.5 px-2 font-semibold rounded-lg transition-all shadow-sm
            {pricing.isFree
        ? 'bg-green-600 hover:bg-green-700 text-white'
        : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900'}
            disabled:opacity-50 disabled:cursor-not-allowed
            {showSuccess ? 'bg-green-600 text-white' : ''}"
    >
      <!-- Show shopping cart icon only on larger screens -->
      <ShoppingCart class="w-4 h-4 hidden sm:inline" />

      <!-- Text CTA that shrinks on mobile for better fit -->
      <span class="text-xs sm:text-sm whitespace-nowrap">
        {#if showSuccess}
          ✓ Added!
        {:else if addingToCart}
          Adding...
        {:else}
          <!-- Clear CTA for free vs paid products -->
          {pricing.isFree ? "Get Free" : "Add to Cart"}
        {/if}
      </span>
    </button>
  </div>
</a>
