const express = require('express');
const fs = require('fs');
const path = require('path');
const performanceData = require('../data/performance');
const { getPrices, invalidateCache, cacheStatus } = require('./priceService');
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
 * Build the full portfolio response.
 * If livePrices is supplied (symbol → quote), currentPrice is overridden
 * with the live value; otherwise falls back to the stored price.
 *
 * UK stocks quoted in pence (GBp) are divided by 100 so everything is
 * in the stock's base currency (GBP).
 */
const buildPortfolio = (data, livePrices = {}) => {
  const totals = {};
  const stocksBySector = {};
  let totalValue = 0;

  data.stocks.forEach(stock => {
    const isPence = stock.symbol.toLowerCase().endsWith('.l');
    const liveQuote = livePrices[stock.symbol];

    // Resolve the current price: live → stored
    let rawPrice = stock.currentPrice;
    if (liveQuote?.price != null) {
      rawPrice = liveQuote.price;
    }

    // Determine the display name from live quote metadata
const companyName = liveQuote?.longName || liveQuote?.shortName || stock.name || stock.symbol;

    // Yahoo Finance returns UK prices in pence; convert to pounds
    const currentPrice = isPence ? rawPrice / 100 : rawPrice;
    const currency = isPence ? 'GBP' : (liveQuote?.currency || 'USD');
    const value = stock.quantity * currentPrice;

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
      const isPence = stock.symbol.toLowerCase().endsWith('.l');
      const liveQuote = livePrices[stock.symbol];

      let rawCurrent = stock.currentPrice;
      if (liveQuote?.price != null) rawCurrent = liveQuote.price;

      const currentValue = isPence
        ? (stock.quantity * rawCurrent) / 100
        : stock.quantity * rawCurrent;
      const costBasis = isPence
        ? (stock.quantity * stock.purchasePrice) / 100
        : stock.quantity * stock.purchasePrice;

      return {
        symbol: stock.symbol,
        companyName: liveQuote?.longName || liveQuote?.shortName || stock.name || stock.symbol,
        annualDividend: stock.annualDividend,
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
    stockCount:     data.stocks.length,
    diversification: Object.keys(totals).length
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

    try {
      const symbols = getSymbols();
      livePrices = await getPrices(symbols);
    } catch (priceErr) {
      console.warn('[/api/portfolio] Price fetch failed, using stored prices:', priceErr.message);
    }

    res.json(buildPortfolio(data, livePrices));
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  try {
    const data = readPortfolioFile();
    console.log(`Loaded ${data.stocks.length} stocks across portfolio.json`);
  } catch (err) {
    console.error('portfolio.json load failed:', err.message);
  }
});