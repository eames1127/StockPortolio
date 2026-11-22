const express = require('express');
const fs = require('fs');
const path = require('path');
const performanceData = require('../data/performance');
const { getPrices, getFxRates, invalidateCache, cacheStatus, BASE_CURRENCY } = require('./priceService');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const DEFAULT_PERIOD = '1Y';

app.use(express.json());

// ─── helpers ────────────────────────────────────────────────────────────────

const readPortfolioFile = () =>
  JSON.parse(fs.readFileSync(path.join(__dirname, '../data/portfolio.json')));

/**
 * Extract every unique ticker from portfolio.json.
 * UK stocks already carry the .L suffix in the JSON so Yahoo Finance
 * will resolve them correctly.
 */
const getSymbols = () => {
  const data = readPortfolioFile();
  return [...new Set(data.stocks.map(s => s.symbol))];
};

/**
 * Whether prices stored in portfolio.json for this stock are in pence.
 * An explicit `currency` field wins ('GBp' means pence). Without one we
 * fall back to treating every .L ticker as pence, which is true of most
 * LSE shares but not of GBP- or USD-quoted ETFs: give those a `currency`.
 */
const storedInPence = stock =>
  stock.currency ? stock.currency === 'GBp' : stock.symbol.toLowerCase().endsWith('.l');

/**
 * Whether the price we're about to use is in pence: a live quote reports
 * its own currency, otherwise the stored-price rule applies.
 */
const priceInPence = (stock, liveQuote) =>
  liveQuote?.price != null ? liveQuote.currency === 'GBp' : storedInPence(stock);

/** The currency a holding's (pounds-adjusted) current price is in. */
const holdingCurrency = (stock, liveQuote) => {
  if (priceInPence(stock, liveQuote)) return 'GBP';
  const quoted = liveQuote?.price != null ? liveQuote.currency : stock.currency;
  return quoted || 'USD';
};

/**
 * Build the full portfolio response.
 * If livePrices is supplied (symbol → quote), currentPrice is overridden
 * with the live value; otherwise falls back to the stored price.
 *
 * UK stocks quoted in pence (GBp) are divided by 100. Values and cost
 * basis are then converted to GBP using fxRates (currency → GBP rate) so
 * sector weights and yields compare like with like; per-stock prices stay
 * in their own currency.
 */
const buildPortfolio = (data, livePrices = {}, fxRates = {}) => {
  const totals = {};
  const unconvertedSymbols = [];
  let currencyConverted = false;
  const stocksBySector = {};
  let totalValue = 0;
  let totalCostBasis = 0;
  let totalAnnualDividends = 0;

  data.stocks.forEach(stock => {
    const liveQuote = livePrices[stock.symbol];
    const isPence = priceInPence(stock, liveQuote);

    // Resolve the current price: live → stored
    let rawPrice = stock.currentPrice;
    if (liveQuote?.price != null) {
      rawPrice = liveQuote.price;
    }

    // Determine the display name: prefer live API names, but skip them if they're
    // just the ticker symbol and Fall back to the name in portfolio.json, then the symbol.
    const apiLong  = liveQuote?.longName  && liveQuote.longName  !== stock.symbol ? liveQuote.longName  : null
    const apiShort = liveQuote?.shortName && liveQuote.shortName !== stock.symbol ? liveQuote.shortName : null
    const companyName = apiLong || apiShort || stock.name || stock.symbol;

    const currentPrice = isPence ? rawPrice / 100 : rawPrice;
    const currency = holdingCurrency(stock, liveQuote);

    // Totals are only meaningful in one currency. A holding we can't
    // convert is left out of them and reported, rather than mixed in.
    const rate = currency === BASE_CURRENCY ? 1 : fxRates[currency];
    if (rate == null) {
      unconvertedSymbols.push(stock.symbol);
      return;
    }
    if (currency !== BASE_CURRENCY) currencyConverted = true;
    const value = stock.quantity * currentPrice * rate;

    totals[stock.sector] = (totals[stock.sector] || 0) + value;
    if (!stocksBySector[stock.sector]) stocksBySector[stock.sector] = [];
    stocksBySector[stock.sector].push({
      symbol: stock.symbol,
      companyName,
      value,
      currentPrice,
      currency
    });
    totalValue += value;

    const quantity = Number(stock.quantity);
    const purchasePrice = Number(stock.purchasePrice);
    if (Number.isFinite(quantity) && Number.isFinite(purchasePrice)) {
      // Converted at today's rate, not the rate on the purchase date, so
      // yield on cost for foreign holdings is an estimate.
      const nativeCost = storedInPence(stock) ? (quantity * purchasePrice) / 100 : quantity * purchasePrice;
      totalCostBasis += nativeCost * rate;
    }
    totalAnnualDividends += Number(stock.annualDividend) || 0;
  });

  const sectors = {};
  const sectorDetails = {};
  Object.keys(totals).forEach(sector => {
    sectors[sector] = ((totals[sector] / totalValue) * 100).toFixed(2);
    sectorDetails[sector] = stocksBySector[sector].map(s => ({
      symbol: s.symbol,
      companyName: s.companyName,
      percentage: ((s.value / totalValue) * 100).toFixed(2),
      sectorPercentage: ((s.value / totals[sector]) * 100).toFixed(2),
      currentPrice: s.currentPrice,
      currency: s.currency
    }));
  });

  // Dividend yield rows, also using live prices where available
  const dividendYields = data.stocks
    .filter(stock => stock.annualDividend && stock.annualDividend > 0)
    .map(stock => {
      const liveQuote = livePrices[stock.symbol];

      let rawCurrent = stock.currentPrice;
      if (liveQuote?.price != null) rawCurrent = liveQuote.price;

      const currentValue = priceInPence(stock, liveQuote)
        ? (stock.quantity * rawCurrent) / 100
        : stock.quantity * rawCurrent;
      const costBasis = storedInPence(stock)
        ? (stock.quantity * stock.purchasePrice) / 100
        : stock.quantity * stock.purchasePrice;

      const previousAnnualDividend =
        stock.previousAnnualDividend ??
        stock.previousYearDividend ??
        stock.lastAnnualDividend ??
        stock.priorAnnualDividend ??
        null;

      return {
        symbol: stock.symbol,
        companyName: (liveQuote?.longName  && liveQuote.longName  !== stock.symbol ? liveQuote.longName  : null)
                  || (liveQuote?.shortName && liveQuote.shortName !== stock.symbol ? liveQuote.shortName : null)
                  || stock.name || stock.symbol,
        annualDividend: stock.annualDividend,
        previousAnnualDividend,
        currentValue,
        costBasis
      };
    });

  return {
    sectors,
    sectorDetails,
    dividends:      data.dividends || {},
    growth:         data.growth    || {},
    dividendYields,
    portfolioDividendYield: totalValue > 0
      ? (totalAnnualDividends / totalValue) * 100
      : null,
    portfolioYieldOnCost: totalCostBasis > 0
      ? (totalAnnualDividends / totalCostBasis) * 100
      : null,
    stockCount:     data.stocks.length,
    diversification: Object.keys(totals).length,
    baseCurrency:   BASE_CURRENCY,
    fxRates,
    currencyConverted,
    unconvertedSymbols
  };
};

// ─── routes ─────────────────────────────────────────────────────────────────

/**
 * GET /api/portfolio
 * Returns portfolio data enriched with live prices (cached, refreshed hourly).
 * Falls back gracefully to stored prices if Yahoo Finance is unavailable.
 */
app.get('/api/portfolio', async (req, res) => {
  try {
    const data = readPortfolioFile();
    let livePrices = {};
    let fxRates = {};

    try {
      const symbols = getSymbols();
      livePrices = await getPrices(symbols);
    } catch (priceErr) {
      console.warn('[/api/portfolio] Price fetch failed, using stored prices:', priceErr.message);
    }

    try {
      const currencies = data.stocks.map(s => holdingCurrency(s, livePrices[s.symbol]));
      fxRates = await getFxRates(currencies);
    } catch (fxErr) {
      console.warn('[/api/portfolio] FX rate fetch failed, foreign holdings left unconverted:', fxErr.message);
    }

    res.json(buildPortfolio(data, livePrices, fxRates));
  } catch (error) {
    console.error('[/api/portfolio]', error);
    res.status(500).json({ error: 'Failed to load portfolio' });
  }
});

/**
 * GET /api/prices
 * Returns raw live quotes for all tickers in the portfolio.
 * Useful for the frontend to show per-stock price changes.
 *
 * Response shape:
 * {
 *   prices: { AAPL: { price, change, changePct, currency, ... }, ... },
 *   meta:   { fetchedAt, valid, ttlMs }
 * }
 */
app.get('/api/prices', async (req, res) => {
  try {
    const symbols = getSymbols();
    const prices  = await getPrices(symbols);
    res.json({ prices, meta: cacheStatus() });
  } catch (error) {
    console.error('[/api/prices]', error);
    res.status(500).json({ error: 'Failed to fetch live prices' });
  }
});

/**
 * POST /api/prices/refresh
 * Force-invalidates the price cache and immediately re-fetches.
 * Handy for a "Refresh" button in the UI.
 */
app.post('/api/prices/refresh', async (req, res) => {
  try {
    invalidateCache();
    const symbols = getSymbols();
    const prices  = await getPrices(symbols);
    res.json({ message: 'Prices refreshed', prices, meta: cacheStatus() });
  } catch (error) {
    console.error('[/api/prices/refresh]', error);
    res.status(500).json({ error: 'Refresh failed' });
  }
});

/**
 * GET /api/prices/status
 * Returns cache metadata without triggering a fetch.
 */
app.get('/api/prices/status', (_req, res) => {
  res.json(cacheStatus());
});

// ─── performance (unchanged) ─────────────────────────────────────────────────

const generatePerformance = (period = DEFAULT_PERIOD) =>
  performanceData[period] || performanceData[DEFAULT_PERIOD];

app.get('/api/performance', (req, res) => {
  try {
    const period = req.query.period || DEFAULT_PERIOD;
    res.json(generatePerformance(period));
  } catch (error) {
    res.status(500).json({ error: 'Failed to load performance data' });
  }
});

// ─── boot ────────────────────────────────────────────────────────────────────

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    try {
      const data = readPortfolioFile();
      console.log(`Loaded ${data.stocks.length} stocks across portfolio.json`);
    } catch (err) {
      console.error('portfolio.json load failed:', err.message);
    }
  });
}

module.exports = { app, buildPortfolio };