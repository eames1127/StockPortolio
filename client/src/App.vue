<template>
  <div class="app">
    <header>
      <h1>📈 Stock Portfolio Tracker</h1>
      <p>Sovereign Fund Inspired Diversification</p>
    </header>
    <main>
      <div class="dashboard">
        <div class="card performance-card">
          <div class="performance-header">
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
          <PerformanceChart :data="performanceData" />
        </div>
        <div class="bottom-row">
          <div class="card">
            <h2>Portfolio Allocation</h2>
            <SectorChart :data="portfolioData" />
          </div>
          <div class="card">
            <h2>Portfolio Stats</h2>
            <div class="stats">
              <div class="stat">
                <span>Total Stocks</span>
                <span>{{ portfolioData.stockCount || 0 }}</span>
              </div>
              <div class="stat">
                <span>Sectors</span>
                <span>{{ portfolioData.diversification || 0 }}</span>
              </div>
              <div class="stat">
                <span>Best Period</span>
                <span>{{ bestPerformance }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { TIME_PERIODS, DEFAULT_PERIOD } from './constants.js'
import SectorChart from './components/SectorChart.vue'
import PerformanceChart from './components/PerformanceChart.vue'
import axios from 'axios'

export default {
  components: { SectorChart, PerformanceChart },
  data: () => ({
    portfolioData: {},
    performanceData: {},
    selectedPeriod: DEFAULT_PERIOD,
    timePeriods: TIME_PERIODS
  }),
  computed: {
    bestPerformance() {
      const values = this.performanceData.data || []
      return values.length ? Math.max(...values).toFixed(2) : '0.00'
    }
  },
  async mounted() {
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
    }
  }
}
</script>

<style scoped>
.app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

header {
  text-align: center;
  padding: 2rem;
  color: white;
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

.bottom-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 3rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.card h2 {
  margin-bottom: 1.5rem;
  color: #333;
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

.stat span:last-child {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

@media (max-width: 768px) {
  .bottom-row {
    grid-template-columns: 1fr;
    gap: 1rem;
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