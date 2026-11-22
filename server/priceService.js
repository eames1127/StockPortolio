/**
 * priceService.js
 *
 * Fetches live quotes from Yahoo Finance via yahoo-finance2.
 * Results are cached in-memory for CACHE_TTL_MS to avoid hammering
 * the upstream API on every portfolio page load.
 *
 * No API key required. Handles both US equities and UK stocks (*.L suffix).
 */

const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

let cache = {
  prices: {},
  fetchedAt: null
};

let pendingFetch = null;

function isCacheValid() {
  return cache.fetchedAt && (Date.now() - cache.fetchedAt.getTime()) < CACHE_TTL_MS;
}

/**
 * Fetch live quotes for an array of ticker symbols.
 * UK stocks should be passed with their .L suffix (e.g. "LLOY.L").
 *
 * @param {string[]} symbols
 * @returns {Promise<Object>}
 */
async function fetchQuotes(symbols) {
  if (!symbols || symbols.length === 0) return {};

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
      prices[sym] = null;
    }
  });

  return prices;
}

/**
 * Public API: returns cached prices, refreshing if stale.
 * Concurrent callers share a single in-flight fetch via pendingFetch,
 * preventing duplicate upstream requests on a cold cache.
 *
 * @param {string[]} symbols
 * @returns {Promise<Object>}
 */
async function getPrices(symbols) {
  if (isCacheValid() && symbols.every(s => s in cache.prices)) {
    return cache.prices;
  }

  if (pendingFetch) {
    await pendingFetch;
    return cache.prices;
  }

  console.log(`[priceService] Refreshing prices for: ${symbols.join(', ')}`);

  pendingFetch = fetchQuotes(symbols)
    .then(fresh => {
      cache.prices    = { ...cache.prices, ...fresh };
      cache.fetchedAt = new Date();
    })
    .finally(() => {
      pendingFetch = null;
    });

  await pendingFetch;
  return cache.prices;
}

const BASE_CURRENCY = 'GBP';

/**
 * Rates for converting each currency into GBP, e.g. { USD: 0.79 }.
 * Fetched as Yahoo FX pairs (USDGBP=X) through getPrices, so they share the
 * price cache and TTL: values and rates are a snapshot from the same fetch.
 * A currency with no available rate is left out so callers can flag it
 * rather than guess.
 *
 * @param {string[]} currencies
 * @returns {Promise<Object>}
 */
async function getFxRates(currencies) {
  const foreign = [...new Set(currencies)].filter(c => c && c !== BASE_CURRENCY);
  if (foreign.length === 0) return {};

  const pairFor = c => `${c}${BASE_CURRENCY}=X`;
  const quotes = await getPrices(foreign.map(pairFor));

  const rates = {};
  foreign.forEach(c => {
    const rate = quotes[pairFor(c)]?.price;
    if (Number.isFinite(rate) && rate > 0) {
      rates[c] = rate;
    } else {
      console.warn(`[priceService] No ${pairFor(c)} rate available; ${c} holdings can't be converted.`);
    }
  });
  return rates;
}

function invalidateCache() {
  cache.fetchedAt = null;
  console.log('[priceService] Cache invalidated.');
}

function cacheStatus() {
  return {
    valid:     isCacheValid(),
    fetchedAt: cache.fetchedAt?.toISOString() ?? null,
    symbols:   Object.keys(cache.prices),
    ttlMs:     CACHE_TTL_MS
  };
}

module.exports = { getPrices, getFxRates, invalidateCache, cacheStatus, BASE_CURRENCY };