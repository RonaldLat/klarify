// src/lib/utils/pricing.js

/**
 * Calculate the actual price after discounts
 * UPDATED: Now properly handles free products
 */
export function calculatePrice(product, format = 'PDF') {
  // Get base price for format
  const basePrices = {
    PDF: product.pdfPrice || 0,
    AUDIO: product.audioPrice || 0,
    BUNDLE: product.bundlePrice || (product.pdfPrice + product.audioPrice),
    SUMMARY: product.summaryPrice || product.audioPrice || 0
  };

  const originalPrice = basePrices[format] || 0;

  // Check if free
  const isFreeNow = product.isFree && (!product.freeUntil || new Date(product.freeUntil) > new Date());

  if (isFreeNow) {
    return {
      originalPrice,
      finalPrice: 0,
      discount: 100,
      isFree: true,
      savings: originalPrice,
      discountType: 'free'
    };
  }

  // Check if discount is active
  const hasActiveDiscount = product.discountUntil ? new Date(product.discountUntil) > new Date() : !!product.discountPercent || !!product.discountAmount;

  if (!hasActiveDiscount) {
    return {
      originalPrice,
      finalPrice: originalPrice,
      discount: 0,
      isFree: false,
      savings: 0,
      discountType: null
    };
  }

  // Calculate discounted price
  let finalPrice = originalPrice;
  let discountType = null;

  if (product.discountPercent) {
    finalPrice = Math.round(originalPrice * (1 - product.discountPercent / 100));
    discountType = 'percentage';
  } else if (product.discountAmount) {
    finalPrice = Math.max(0, originalPrice - product.discountAmount);
    discountType = 'fixed';
  }

  const savings = originalPrice - finalPrice;
  const discountPercentage = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0;

  return {
    originalPrice,
    finalPrice,
    discount: discountPercentage,
    isFree: finalPrice === 0,
    savings,
    discountType
  };
}

/**
 * Check if product has any active promotion
 */
export function hasActivePromotion(product) {
  const isFreeNow = product.isFree && (!product.freeUntil || new Date(product.freeUntil) > new Date());
  const hasActiveDiscount = product.discountUntil ? new Date(product.discountUntil) > new Date() : !!product.discountPercent || !!product.discountAmount;

  return isFreeNow || hasActiveDiscount || product.limitedOffer;
}

/**
 * Get promotional badge info
 */
export function getPromotionalBadge(product) {
  const pricing = calculatePrice(product, 'PDF');

  if (pricing.isFree) {
    return {
      text: 'FREE',
      color: 'green',
      icon: ' '
      // icon: '🎁'
    };
  }

  if (pricing.discount >= 50) {
    return {
      text: `${pricing.discount}% OFF`,
      color: 'red',
      icon: ' '
      // icon: '🔥'
    };
  }

  if (pricing.discount > 0) {
    return {
      text: `${pricing.discount}% OFF`,
      color: 'orange',
      icon: '💰'
    };
  }

  if (product.limitedOffer) {
    return {
      text: product.offerText || 'LIMITED TIME',
      color: 'purple',
      icon: '⚡'
    };
  }

  return null;
}

/**
 * Format time remaining for offer (with seconds when < 1 hour)
 * @param {Date|string} endDate - End date of offer
 * @param {boolean} includeSeconds - Whether to show seconds (default: true for < 1 hour)
 * @returns {string|null} Formatted time string or null if expired/no date
 */
export function getTimeRemaining(endDate, includeSeconds = null) {
  if (!endDate) return null;

  const now = new Date();
  const end = new Date(endDate);
  const diff = end - now;

  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  // Auto-include seconds if less than 1 hour (unless explicitly disabled)
  const showSeconds = includeSeconds !== null ? includeSeconds : (days === 0 && hours === 0);

  if (days > 0) {
    return `${days}d ${hours}h left`;
  }
  if (hours > 0) {
    return showSeconds ? `${hours}h ${minutes}m ${seconds}s` : `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return showSeconds ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }

  return showSeconds ? `${seconds}s left` : 'Ending soon';
}

/**
 * Calculate bundle savings
 */
export function calculateBundleSavings(product) {
  if (!product.pdfPrice || !product.audioPrice) return 0;

  const fullPrice = product.pdfPrice + product.audioPrice;
  const bundlePrice = product.bundlePrice || fullPrice;

  return fullPrice - bundlePrice;
}
