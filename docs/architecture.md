# Architecture

## Stack

- **Client:** Vue 3 single-file components using the Options API (`export default { props, data, computed, methods }`), built with **Vite 5**. Charts use **Chart.js 4** through `vue-chartjs`, with `chartjs-plugin-datalabels`. HTTP goes through **axios**.
- **Server:** **Express 4** on Node.js, with `dotenv` for settings and **yahoo-finance2** for live quotes and exchange rates.
- **Tests:** **Jest** for the server (`tests/`) and **Vitest** with jsdom for the client (`client/src/tests/`).
- Plain JavaScript throughout: the server is CommonJS (`require`), the client is ES modules. There's no TypeScript, router, store library or database.
- Two packages: the root `package.json` (server, scripts) and `client/package.json` (front end). Each has its own lockfile.

## Data flow

```
data/portfolio.json (git-ignored, private)
   │
server/index.js
   ├─ GET /api/portfolio
   │    ├─ priceService.getPrices(symbols)    → live quotes (falls back to stored currentPrice)
   │    ├─ priceService.getFxRates(currencies) → currency → GBP rates
   │    └─ buildPortfolio(data, livePrices, fxRates, { showDividendValues })
   │         ├─ pence handling: storedInPence / priceInPence / holdingCurrency
   │         ├─ sector weights and per-holding percentages (sectors, sectorDetails)
   │         ├─ dividend yield rows (dividendShare, yield, yieldOnCost)
   │         ├─ buildDividendIndex → yearly dividends as % of the first year
   │         └─ strips £ amounts unless SHOW_DIVIDEND_VALUES=true
   ├─ GET  /api/prices          → raw quotes + cache metadata
   ├─ POST /api/prices/refresh  → clears the cache and re-fetches
   ├─ GET  /api/prices/status   → cache metadata only
   └─ GET  /api/performance     → mock series from data/performance.js
   │
client (Vite dev server proxies /api → :3001 in development only)
   │
App.vue — fetches the endpoints, holds dark mode and the £ / % dividend mode
   ├─ stat chips (holdings, sectors, best/worst year, yields, CAGR, top holding)
   ├─ TotalGrowth.vue      (portfolio and dividend growth by year)
   ├─ SectorChart.vue      (allocation pie with per-sector breakdown)
   ├─ DividendSummary.vue  (income vs allocation by sector, plus a by-year £ chart tab in £ mode; yield per holding table)
   ├─ DividendChart.vue    (monthly/daily averages, £ mode only)
   └─ PerformanceChart.vue (imported but not currently shown)
```

`data/portfolio.json` is read on every request, so edits to it show without a restart. Quotes are cached in memory for an hour (`CACHE_TTL_MS` in `priceService.js`). Symbols whose last fetch failed are retried, and a request that arrives during a fetch waits for it rather than starting another.

## Where things live

| Concern | Location | Rule |
|---------|----------|------|
| Portfolio calculations and routes | `server/index.js` | `buildPortfolio` is exported and pure, so test it directly |
| Live quotes and FX rates | `server/priceService.js` | The only code that calls Yahoo Finance; owns the cache |
| Mock performance data | `data/performance.js` | To be replaced when real history is added |
| Example portfolio | `data/portfolio.template.json` | Committed; the real `portfolio.json` never is |
| Server settings | `.env` (from `.env.example`) | `PORT`, `NODE_ENV`, `SHOW_DIVIDEND_VALUES` |
| Dashboard layout and design tokens | `client/src/App.vue` | CSS variables for light and dark themes live here |
| Charts and tables | `client/src/components/` | One component per card |
| Shared chart options | `client/src/config/chartConfig.js` | |
| Constants (periods, chart colours, endpoints) | `client/src/constants.js` | |
| Pure client logic | `client/src/*.js` (e.g. `currencyNote.js`) | Kept out of components so it can be unit tested |
| Server tests | `tests/*.test.js` | Mock `yahoo-finance2` with `jest.mock`; never call the real API |
| Client tests | `client/src/tests/*.test.js` | |
| CI | `.github/workflows/test.yml` | Runs server and client tests and builds the client on PRs and pushes to `main` (Node 22) |
| Dependency updates | `.github/dependabot.yml` | Weekly grouped npm PRs for server and client, monthly for GitHub Actions |

## Currency model

- Everything is totalled in the base currency, GBP (`BASE_CURRENCY` in `priceService.js`).
- LSE prices are usually quoted in pence (`GBp`) and are divided by 100. A live quote's own currency decides this. Without one, an explicit `currency` field on the holding wins, then the `.L` suffix is the fallback (`storedInPence`).
- Foreign holdings are converted at today's rate, including their cost basis, so yield on cost for them is an estimate. The client shows a `≈` marker and a note (`currencyNote.js`) when that happens.
- A holding with no available rate is left out of the totals and listed in `unconvertedSymbols`, rather than being mixed in unconverted.

## Privacy boundary

The app's main promise is that the portfolio's size is never revealed. The server does all the sensitive maths and sends only relative figures.

| Never sent | Sent |
|------------|------|
| Total portfolio value | Sector and holding percentages |
| Holding values, quantities, cost basis | Dividend yield, yield on cost, share of dividends (%) |
| £ dividend amounts (unless `SHOW_DIVIDEND_VALUES=true`) | Dividend index (each year as % of the first) |
| | Per-share prices and exchange rates (public data) |

`tests/portfolio.test.js` checks that values and £ amounts stay out of the response. Any new field in an API response needs the same kind of test.

## Deployment

Only the client is built (`npm run build` → `client/dist/`). The API runs as plain Node and doesn't serve the front end; a web server serves `client/dist/` and proxies `/api/` to it. See the README's "Build and Deploy for Production" section for the steps.
