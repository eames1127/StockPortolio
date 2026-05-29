<template>
  <div class="app" :class="{ dark: darkMode }">

    <!-- ── HEADER ── -->
    <header class="topbar">
      <div class="topbar-inner">
        <div class="brand">
          <span class="brand-icon">📈</span>
          <div class="brand-text">
            <span class="brand-name">Portfolio Tracker</span>
            <span class="brand-sub">Sovereign Fund Inspired</span>
          </div>
        </div>

        <nav class="topbar-links">
          <a href="https://github.com/eames1127/StockPortolio" target="_blank" rel="noopener">GitHub</a>
          <a href="https://daeames.com" target="_blank" rel="noopener">My Portfolio</a>
        </nav>

        <label class="theme-toggle">
          <input class="theme-toggle-input" type="checkbox" v-model="darkMode" @change="onToggleDarkMode" aria-label="Toggle dark mode" />
          <span class="theme-switch" aria-hidden="true"></span>
          <span class="theme-label">{{ darkMode ? 'Dark' : 'Light' }}</span>
        </label>
      </div>
    </header>

    <main class="main">
      <div class="dashboard">

        <!-- ── ROW 0: About banner ── -->
        <div class="about-banner">
          <p>An insight into my stock portfolio performance, diversification metrics, and dividend income streams — purposefully excluding total value or individual stock prices.</p>
        </div>
        <div v-if="Object.keys(livePrices).length" class="price-bar">
          <div class="price-ticker">
            <div
              v-for="(quote, symbol) in livePrices"
              :key="symbol"
              class="price-chip"
              :class="quote && quote.changePct >= 0 ? 'up' : 'down'"
            >
              <span class="price-symbol">{{ formatQuoteLabel(symbol, quote) }}</span>
              <span v-if="quote" class="price-val">
                {{ formatPrice(quote.price, quote.currency) }}
              </span>
              <span v-if="quote" class="price-change">
                {{ quote.changePct >= 0 ? '▲' : '▼' }}
                {{ Math.abs(quote.changePct).toFixed(2) }}%
              </span>
              <span v-else class="price-stale">–</span>
            </div>
          </div>
          <div class="price-meta">
            <span v-if="priceMeta.fetchedAt" class="price-age">
              Updated {{ timeAgo(priceMeta.fetchedAt) }}
            </span>
            <button
              class="refresh-btn"
              :class="{ loading: refreshing }"
              :disabled="refreshing"
              @click="refreshPrices"
              title="Force-refresh live prices"
            >
              <span class="refresh-icon">⟳</span>
              {{ refreshing ? 'Refreshing…' : 'Refresh' }}
            </button>
          </div>
        </div>

        <!-- ── ROW 1: Stat chips ── -->
        <div class="stat-strip">
          <div class="stat-chip">
            <span class="stat-chip-label">Total Holdings</span>
            <span class="stat-chip-value">{{ portfolioData.stockCount || 0 }}</span>
          </div>
          <div class="stat-chip">
            <span class="stat-chip-label">Sectors</span>
            <span class="stat-chip-value">{{ portfolioData.diversification || 0 }}</span>
          </div>
          <div class="stat-chip accent">
            <span class="stat-chip-label">Best Year</span>
            <span class="stat-chip-value">{{ bestPerformance }}%</span>
          </div>
        </div>

        <!-- ── ROW 2: Growth chart full width ── -->
        <div class="card card--growth">
          <div class="card-head">
            <h2>Portfolio Yearly Growth</h2>
          </div>
          <TotalGrowth :growth="portfolioData.growth || {}" :dark-mode="darkMode" />
        </div>

        <!-- ── ROW 3: Allocation | Dividends ── -->
        <div class="row-split">
          <div class="card card--allocation">
            <div class="card-head">
              <h2>Portfolio Allocation</h2>
            </div>
            <SectorChart :data="portfolioData" :dark-mode="darkMode" />
          </div>

          <div class="card card--dividends">
            <DividendSummary
              :dividends="portfolioData.dividends || {}"
              :dividend-yields="portfolioData.dividendYields || []"
              :dark-mode="darkMode"
            />
          </div>
        </div>

        <!-- ── ROW 4: Dividend Trends ── -->
        <div class="card card--trends">
          <div class="card-head">
            <h2>Dividend Trends</h2>
            <span class="card-badge">Monthly &amp; Daily averages</span>
          </div>
          <DividendChart :dividends="portfolioData.dividends || {}" :dark-mode="darkMode" />
        </div>

      </div>
    </main>
  </div>
</template>

<script>
import { TIME_PERIODS, DEFAULT_PERIOD } from './constants.js'
import SectorChart from './components/SectorChart.vue'
import PerformanceChart from './components/PerformanceChart.vue'
import DividendSummary from './components/DividendSummary.vue'
import DividendChart from './components/DividendChart.vue'
import TotalGrowth from './components/TotalGrowth.vue'
import axios from 'axios'

export default {
  components: { SectorChart, PerformanceChart, DividendSummary, DividendChart, TotalGrowth },
  data() {
    return {
      portfolioData: {},
      performanceData: {},
      livePrices: {},
      priceMeta: {},
      selectedPeriod: DEFAULT_PERIOD,
      timePeriods: TIME_PERIODS,
      darkMode: false,
      refreshing: false
    }
  },
  computed: {
    bestPerformance() {
      const values = Object.values(this.portfolioData.growth || {})
      return values.length ? Math.max(...values).toFixed(2) : '0.00'
    }
  },
  async mounted() {
    try {
      const stored = localStorage.getItem('darkMode')
      this.darkMode = stored === 'true'
    } catch (e) {}
    await this.loadData()
  },
  methods: {
    async loadData() {
      try {
        const [portfolio, performance, prices] = await Promise.all([
          axios.get('/api/portfolio'),
          axios.get(`/api/performance?period=${this.selectedPeriod}`),
          axios.get('/api/prices').catch(() => null)
        ])
        this.portfolioData  = portfolio.data
        this.performanceData = performance.data
        if (prices?.data) {
          this.livePrices = prices.data.prices || {}
          this.priceMeta  = prices.data.meta   || {}
        }
      } catch (error) {
        console.error('Failed to load data:', error)
      }
    },

    async refreshPrices() {
      this.refreshing = true
      try {
        const [pricesRes, portfolioRes] = await Promise.all([
          axios.post('/api/prices/refresh'),
          axios.get('/api/portfolio')
        ])
        this.livePrices    = pricesRes.data.prices  || {}
        this.priceMeta     = pricesRes.data.meta    || {}
        this.portfolioData = portfolioRes.data
      } catch (err) {
        console.error('Price refresh failed:', err)
      } finally {
        this.refreshing = false
      }
    },

    async changePeriod(period) {
      this.selectedPeriod = period
      try {
        const response = await axios.get(`/api/performance?period=${period}`)
        this.performanceData = response.data
      } catch (error) {
        console.error('Failed to load performance data:', error)
      }
    },

    onToggleDarkMode() {
      try {
        localStorage.setItem('darkMode', this.darkMode)
      } catch (e) {}
    },

    /** Format a price in its native currency (pence → pounds for .L tickers) */
    formatPrice(price, currency) {
      if (price == null) return '–'
      const fmt = (n) => parseFloat(n.toFixed(4)).toString()
      if (currency === 'GBP') {
        return `£${fmt(price / 100)}`
      }
      const symbols = { USD: '$', GBP: '£', EUR: '€' }
      const sym = symbols[currency] || (currency ? `${currency} ` : '')
        return `£${fmt(price / 100)}`
    },

    formatQuoteLabel(symbol, quote) {
      const name = quote?.longName || quote?.shortName || symbol
      return name === symbol ? symbol : `${name} (${symbol})`
    },

    timeAgo(isoString) {
      const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
      if (diff < 60)   return `${diff}s ago`
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
      return `${Math.floor(diff / 3600)}h ago`
    }
  }
}
</script>

<style scoped>
/* ─────────────────────────────────────────
   Design tokens
───────────────────────────────────────── */
.app {
  --bg:            #f0f2f8;
  --bg-card:       #ffffff;
  --bg-card-alt:   #f8f9fc;
  --bg-stat:       #eef0f7;
  --text:          #0d1117;
  --text-muted:    #6b7280;
  --border:        rgba(0,0,0,0.07);
  --shadow:        0 2px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.05);
  --shadow-hover:  0 8px 28px rgba(0,0,0,0.12);
  --accent:        #22c55e;
  --accent-dim:    rgba(34,197,94,0.12);
  --topbar-bg:     #0d1117;
  --topbar-text:   #f0f2f8;

  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: 'DM Sans', 'Segoe UI', sans-serif;
  transition: background 0.25s, color 0.25s;
}

.app.dark {
  --bg:           #080d14;
  --bg-card:      #0e1621;
  --bg-card-alt:  #111a27;
  --bg-stat:      #131e2d;
  --text:         #e8edf5;
  --text-muted:   #8893a5;
  --border:       rgba(255,255,255,0.06);
  --shadow:       0 2px 12px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.3);
  --shadow-hover: 0 8px 28px rgba(0,0,0,0.6);
  --topbar-bg:    #060b11;
  --topbar-text:  #e8edf5;
}

/* Topbar */
.topbar {
  background: var(--topbar-bg);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  position: sticky;
  top: 0;
  z-index: 50;
}

.topbar-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1.25rem;
  height: 56px;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-shrink: 0;
}

.brand-icon {
  font-size: 1.3rem;
  line-height: 1;
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}

.brand-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.01em;
}

.brand-sub {
  font-size: 0.68rem;
  color: rgba(255,255,255,0.4);
  letter-spacing: 0.02em;
}

.topbar-links {
  display: flex;
  gap: 1.25rem;
  margin-left: auto;
}

.topbar-links a {
  color: rgba(255,255,255,0.55);
  text-decoration: none;
  font-size: 0.82rem;
  font-weight: 500;
  transition: color 0.15s;
}

.topbar-links a:hover {
  color: #fff;
}

/* Theme toggle */
.theme-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  cursor: pointer;
  flex-shrink: 0;
}

.theme-toggle-input {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
}

.theme-switch {
  display: inline-block;
  width: 38px;
  height: 21px;
  background: rgba(255,255,255,0.15);
  border-radius: 999px;
  position: relative;
  transition: background 0.2s;
}

.theme-switch::before {
  content: '';
  position: absolute;
  left: 3px;
  top: 3px;
  width: 15px;
  height: 15px;
  background: white;
  border-radius: 50%;
  transition: transform 0.18s ease;
  box-shadow: 0 1px 4px rgba(0,0,0,0.25);
}

.theme-toggle-input:checked + .theme-switch {
  background: var(--accent);
}

.theme-toggle-input:checked + .theme-switch::before {
  transform: translateX(17px);
}

.theme-label {
  color: rgba(255,255,255,0.5);
  font-size: 0.78rem;
  font-weight: 500;
}
/* ─────────────────────────────────────────
   Live price bar
───────────────────────────────────────── */
.price-bar {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.65rem 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  box-shadow: var(--shadow);
}

.price-ticker {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.price-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
}

.price-chip.up   { background: rgba(34,197,94,0.12);  color: #16a34a; }
.price-chip.down { background: rgba(239,68,68,0.12);  color: #dc2626; }

.app.dark .price-chip.up   { background: rgba(34,197,94,0.18); }
.app.dark .price-chip.down { background: rgba(239,68,68,0.18); }

.price-symbol { font-family: monospace; font-size: 0.8rem; color: var(--text); }
.price-val    { font-variant-numeric: tabular-nums; }
.price-change { font-size: 0.72rem; opacity: 0.9; }
.price-stale  { opacity: 0.4; }

.price-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.price-age {
  font-size: 0.72rem;
  color: var(--text-muted);
  white-space: nowrap;
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.75rem;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--bg-stat);
  color: var(--text);
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.refresh-btn:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}

.refresh-btn:disabled { opacity: 0.55; cursor: not-allowed; }

.refresh-icon {
  font-size: 0.95rem;
  line-height: 1;
  display: inline-block;
  transition: transform 0.6s;
}
.refresh-btn.loading .refresh-icon {
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ─────────────────────────────────────────
   Main layout (unchanged)
───────────────────────────────────────── */
.main { padding: 1.25rem 1rem 3rem; }
.dashboard { max-width: 1280px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.25rem; }

.about-banner {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-left: 3px solid var(--accent);
  border-radius: 8px;
  padding: 0.75rem 1rem;
}
.about-banner p { margin: 0; font-size: 0.82rem; color: var(--text-muted); line-height: 1.55; }

.stat-strip { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
.stat-chip {
  background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px;
  padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: 0.3rem;
  box-shadow: var(--shadow); transition: box-shadow 0.2s, transform 0.2s;
}
.stat-chip:hover { box-shadow: var(--shadow-hover); transform: translateY(-1px); }
.stat-chip.accent { border-color: var(--accent); background: var(--accent-dim); }
.stat-chip-label { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
.stat-chip-value { font-size: 1.75rem; font-weight: 800; color: var(--text); line-height: 1; letter-spacing: -0.02em; }
.stat-chip.accent .stat-chip-value { color: var(--accent); }

.card {
  background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px;
  padding: 1.25rem; box-shadow: var(--shadow); overflow: hidden; min-width: 0;
}
.card-head { display: flex; align-items: baseline; gap: 0.75rem; margin-bottom: 1.25rem; }
.card-head h2 { margin: 0; font-size: 1rem; font-weight: 700; color: var(--text); letter-spacing: -0.01em; }
.card-badge {
  font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
  color: var(--text-muted); background: var(--bg-stat); border-radius: 4px; padding: 0.15rem 0.45rem;
}

.row-split { display: grid; grid-template-columns: 1fr; gap: 1.25rem; align-items: start; }

@media (min-width: 1024px) {
  .row-split { grid-template-columns: 1fr 1fr; align-items: stretch; }
  .card--allocation { display: flex; flex-direction: column; }
}

@media (min-width: 768px) {
  .main { padding: 1.5rem 1.5rem 3rem; }
  .card { padding: 1.5rem; }
}

@media (min-width: 1024px) {
  .main { padding: 1.75rem 2rem 3rem; }
  .card-head h2 { font-size: 1.05rem; }
  .stat-chip-value { font-size: 2rem; }
}
</style>