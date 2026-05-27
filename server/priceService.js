/**
 * priceService.js
 *
 * Fetches live quotes from Yahoo Finance via yahoo-finance2.
 * Results are cached in-memory for CACHE_TTL_MS to avoid hammering
 * the upstream API on every portfolio page load.
 *
 * No API key required. Handles both US equities and UK stocks (*.L suffix).
 */

const yahooFinance = require('yahoo-finance2').default;

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

let cache = {
  prices: {},      // { symbol: { price, currency, change, changePct, updatedAt } }
  fetchedAt: null  // Date of last full refresh
};

/**
 * Returns true if the cache is still fresh.
 */
function isCacheValid() {
  return cache.fetchedAt && (Date.now() - cache.fetchedAt.getTime()) < CACHE_TTL_MS;
}

/**
 * Fetch live quotes for an array of ticker symbols.
 * UK stocks should be passed with their .L suffix (e.g. "LLOY.L").
 *
 * @param {string[]} symbols
 * @returns {Promise<Object>} map of symbol → quote data
 */
async function fetchQuotes(symbols) {
  if (!symbols || symbols.length === 0) return {};

  // yahoo-finance2 quoteSummary is great for one ticker,
  // but for a batch, quote() is the right call.
  const results = await Promise.allSettled(
    symbols.map(sym =>
      yahooFinance.quote(sym, {}, { validateResult: false })
    )
  );

  const prices = {};
  results.forEach((result, i) => {
    const sym = symbols[i];
    if (result.status === 'fulfilled' && result.value) {
      const q = result.value;
      prices[sym] = {
        price:         q.regularMarketPrice      ?? null,
        previousClose: q.regularMarketPreviousClose ?? null,
        change:        q.regularMarketChange      ?? null,
        changePct:     q.regularMarketChangePercent ?? null,
        currency:      q.currency                 ?? 'USD',
        shortName:     q.shortName                ?? sym,
        longName:      q.longName                 ?? null,
        marketState:   q.marketState              ?? 'CLOSED',
        updatedAt:     new Date().toISOString()
      };
    } else {
      console.warn(`[priceService] Failed to fetch ${sym}:`, result.reason?.message ?? 'unknown error');
      prices[sym] = null; // caller can fall back to stored price
    }
  });

  return prices;
}

/**
 * Public API: returns cached prices, refreshing if stale.
 *
 * @param {string[]} symbols
 * @returns {Promise<Object>}
 */
async function getPrices(symbols) {
  // If cache is valid and covers all requested symbols, return it immediately
  if (isCacheValid() && symbols.every(s => s in cache.prices)) {
    return cache.prices;
  }

  console.log(`[priceService] Refreshing prices for: ${symbols.join(', ')}`);
  const fresh = await fetchQuotes(symbols);

  // Merge into cache (keeps any symbols not in this batch)
  cache.prices   = { ...cache.prices, ...fresh };
  cache.fetchedAt = new Date();

  return cache.prices;
}

/**
 * Force-invalidates the cache so the next call fetches fresh data.
 * Exposed as POST /api/prices/refresh.
 */
function invalidateCache() {
  cache.fetchedAt = null;
  console.log('[priceService] Cache invalidated.');
}

/**
 * Returns cache metadata (useful for the /api/prices/status endpoint).
 */
function cacheStatus() {
  return {
    valid:     isCacheValid(),
    fetchedAt: cache.fetchedAt?.toISOString() ?? null,
    symbols:   Object.keys(cache.prices),
    ttlMs:     CACHE_TTL_MS
  };
}

module.exports = { getPrices, invalidateCache, cacheStatus };
