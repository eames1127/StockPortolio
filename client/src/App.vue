<template>
  <div class="app" :class="{ dark: darkMode }">
    <header>
      <div class="header-content">
        <div class="header-left">
          <h1>📈 Stock Portfolio Tracker</h1>
          <p>Sovereign Fund Inspired Diversification</p>
        </div>
        <div class="header-right">
          <label class="theme-toggle">
            <input class="theme-toggle-input" type="checkbox" v-model="darkMode" @change="onToggleDarkMode" aria-label="Toggle dark mode" />
            <span class="theme-switch" aria-hidden="true"></span>
            <span class="theme-label">{{ darkMode ? 'Dark' : 'Light' }}</span>
          </label>
        </div>
      </div>
    </header>
    <main>
      <div class="dashboard">
        <div>
          <div class="about">
            <div class="about-header">
              <h2>About</h2>
              <div class="about-links">
                <a href="https://github.com/eames1127/StockPortolio" target="_blank" rel="noopener">GitHub Repo</a>
                <span class="separator">|</span>
                <a href="https://daeames.com" target="_blank" rel="noopener">My Portfolio</a>
              </div>
            </div>
            <p>This dashboard provides an insights into my stock portfolio performance, diversification metrics, and dividend income streams, it purposefully does not show total value of portfolio or individual stocks.</p>
          </div>
        </div>
        <div class="card performance-card">
          <!--<div class="performance-header">
            <h2>Performance Overview</h2>
            <div class="period-selector">
              <button 
                v-for="period in timePeriods" 
                :key="period"
                :class="{ active: selectedPeriod === period }"
                @click="changePeriod(period)"
              >
                {{ period }}
              </button>
            </div>
          </div>
          <PerformanceChart :data="performanceData" />-->
          <div class="card">
            <h2>Portfolio Yearly Growth</h2>
            <TotalGrowth :growth="portfolioData.growth || {}" :dark-mode="darkMode" />
          </div>
        </div>
        <div class="stats-row">
          <div class="card">
            <h3>Portfolio Stats</h3>
            <div class="stats">
              <div class="stat">
                <span>Current Total Stocks</span>
                <span>{{ portfolioData.stockCount || 0 }}</span>
              </div>
              <div class="stat">
                <span>Current Sectors</span>
                <span>{{ portfolioData.diversification || 0 }}</span>
              </div>
              <div class="stat">
                <span>Best Period</span>
                <span>{{ bestPerformance }}%</span>
              </div>
            </div>
          </div>
        </div>
        <div class="middle-row">
          <div class="card">
            <h2>Portfolio Allocation</h2>
            <SectorChart :data="portfolioData" :dark-mode="darkMode" />
          </div>
          <div class="card">
            <DividendSummary :dividends="portfolioData.dividends || {}" :dark-mode="darkMode" />
          </div>
        </div>
        <div class="card dividend-trends-card">
          <h2>Dividend Trends</h2>
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
      selectedPeriod: DEFAULT_PERIOD,
      timePeriods: TIME_PERIODS,
      darkMode: false
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
    } catch (e) {
      // ignore localStorage errors
    }
    await this.loadData()
  },
  methods: {
    async loadData() {
      try {
        const [portfolio, performance] = await Promise.all([
          axios.get('/api/portfolio'),
          axios.get(`/api/performance?period=${this.selectedPeriod}`)
        ])
        this.portfolioData = portfolio.data
        this.performanceData = performance.data
      } catch (error) {
        console.error('Failed to load data:', error)
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
      } catch (e) {
        // ignore
      }
    }
  }
}
</script>

<style scoped>
.app {
  --bg-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --bg-gradient-dark: linear-gradient(135deg, #0f172a 0%, #0b1220 100%);
  --text-color: #0b1220; /* default page text */
  --muted-color: #6b7280;
  --card-bg: #ffffff;
  --card-shadow: 0 8px 32px rgba(0,0,0,0.1);

  min-height: 100vh;
  background: var(--bg-gradient);
  color: var(--text-color);
}

.app.dark {
  background: var(--bg-gradient-dark);
  --text-color: #e5e7eb;
  --muted-color: #9ca3af;
  --card-bg: #0b1220;
  --card-shadow: 0 8px 32px rgba(0,0,0,0.6);
}

header {
  text-align: center;
  padding: 2rem;
  color: white;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.header-left {
  text-align: left;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.theme-toggle {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
  font-weight: 600;
  color: var(--text-color);
}

.theme-toggle-input {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

.theme-switch {
  display: inline-block;
  width: 44px;
  height: 24px;
  background: #e5e7eb;
  border-radius: 999px;
  position: relative;
  transition: background 0.2s;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,0.06);
}

.theme-switch::before {
  content: '';
  position: absolute;
  left: 4px;
  top: 4px;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  transition: transform 0.18s ease-in-out;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}

.theme-toggle-input:checked + .theme-switch {
  background: #4f46e5;
}

.theme-toggle-input:checked + .theme-switch::before {
  transform: translateX(20px);
}

.theme-label {
  color: var(--text-color);
  font-size: 0.95rem;
}

.header-right a {
  color: white;
  text-decoration: none;
  font-size: 1rem;
  opacity: 0.9;
  transition: opacity 0.2s;
}

.header-right a:hover {
  opacity: 1;
  text-decoration: underline;
}

.separator {
  color: white;
  opacity: 0.6;
}

header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

header p {
  opacity: 0.9;
  font-size: 1.1rem;
}

main {
  padding: 0 2rem 2rem;
}

.about {
  color: var(--text-color);
}

.app.dark .about,
.app.dark .about-header h2,
.app.dark .about-links a,
.app.dark header p,
.app.dark header h1,
.app.dark .about-links .separator,
.app.dark .separator {
  color: #d1d5db;
}

.about-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.about-header h2 {
  margin: 0;
  color: var(--text-color);
}

.about-links {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.about-links a {
  color: var(--text-color);
  text-decoration: none;
  opacity: 0.9;
  transition: opacity 0.2s;
}

.about-links a:hover {
  opacity: 1;
  text-decoration: underline;
}

.about-links .separator {
  color: var(--muted-color);
  opacity: 0.8;
}

.dashboard {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.performance-card {
  width: 100%;
}

.performance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.performance-header h2 {
  margin: 0;
}

.period-selector {
  display: flex;
  gap: 0.5rem;
}

.period-selector button {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.period-selector button:hover {
  background: #f5f5f5;
}

.period-selector button.active {
  background: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.stats-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}
.middle-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

.dividend-trends-card {
  width: 100%;
}

.card {
  background: var(--card-bg);
  border-radius: 8px;
  padding: 1rem;
  box-shadow: var(--card-shadow);
}

.app.dark .card {
  background: #0b1220;
  box-shadow: 0 8px 32px rgba(0,0,0,0.6);
  color: #e5e7eb;
}

.card h2 {
  margin-bottom: 1.5rem;
  color: var(--text-color);
  font-size: 1.5rem;
}

.stats {
  display: grid;
  gap: 1.5rem;
}

.stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  font-weight: 500;
}

.app.dark .stat {
  background: #071028;
}

.stat span:last-child {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--text-color);
}
@media (min-width: 1000px) {
  .middle-row {
    grid-template-columns: 1fr 1fr; /* 💻 tablet+ */
  }

  
  main {
    padding: 0 1rem 1rem;
  }
  
  .card {
    padding: 2rem;
  }
  
  header h1 {
    font-size: 2rem;
  }
}
</style>