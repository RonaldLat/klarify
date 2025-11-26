// src/routes/+page.server.js
/**
 * @fileoverview Home page server load - get featured products with better sorting
 */
import { prisma } from "$lib/server/prisma.js";

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  // Get featured products with proper ordering
  // Prioritize: 1. Active promotions, 2. Recent best sellers, 3. Newest
  const featuredProducts = await prisma.product.findMany({
    where: {
      active: true,
      featured: true,
    },
    include: {
      categories: true,
    },
    orderBy: [
      { 
        // Products with active promotions first
        // promotionEndDate: 'desc' 
      },
      { 
        // Then by publish date (newest first)
        publishedAt: "desc" 
      },
    ],
    take: 16, // Get more products to ensure we have enough after filtering
  });

  // Get categories with product counts
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: {
          products: {
            where: { active: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // Track page view if user is logged in
  if (locals.user) {
    try {
      const sessionId = locals.sessionId || generateSessionId();
      
      await prisma.pageView.create({
        data: {
          path: '/',
          userId: locals.user.id,
          sessionId,
          device: getDeviceType(locals.userAgent),
          browser: getBrowserName(locals.userAgent),
        },
      });
    } catch (error) {
      console.error('Failed to track page view:', error);
      // Don't block page load if tracking fails
    }
  }

  return {
    user: locals.user,
    featuredProducts,
    categories,
  };
}

/**
 * Generate a session ID for anonymous tracking
 */
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Detect device type from user agent
 */
function getDeviceType(userAgent) {
  if (!userAgent) return 'unknown';
  
  const ua = userAgent.toLowerCase();
  
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  
  return 'desktop';
}

/**
 * Extract browser name from user agent
 */
function getBrowserName(userAgent) {
  if (!userAgent) return 'unknown';
  
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('firefox')) return 'firefox';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'safari';
  if (ua.includes('chrome')) return 'chrome';
  if (ua.includes('edge')) return 'edge';
  if (ua.includes('opera') || ua.includes('opr')) return 'opera';
  
  return 'other';
}
