<template>
  <div class="dividend-summary">
    <h3>Annual Dividends</h3>
    <div class="chart-container">
      <Bar :key="darkMode ? 'dark' : 'light'" :data="chartData" :options="chartOptions" />
    </div>
    <div class="total">
      <span>Total: £{{ totalDividends.toFixed(2) }}</span>
    </div>

    <!-- Yield per holding table -->
    <div v-if="sortedYields.length" class="yield-section">
      <div class="yield-header">
        <h4>Dividend Yield per Holding</h4>
        <span class="yield-subtitle">Sorted by current yield</span>
      </div>
      <div class="yield-table-wrapper">
        <table class="yield-table">
          <thead>
            <tr>
              <th>Holding</th>
              <th>Annual Div.</th>
              <th>Yield</th>
              <th>Yield on Cost</th>
              <th class="yield-bar-col"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="holding in sortedYields" :key="holding.symbol">
              <td class="symbol">{{ holding.companyName && holding.companyName !== holding.symbol ? `${holding.companyName} (${holding.symbol})` : holding.symbol }}</td>
              <td class="amount">£{{ holding.annualDividend.toFixed(2) }}</td>
              <td class="yield-pct" :class="yieldClass(holding.yield)">
                {{ holding.yield.toFixed(2) }}%
              </td>
              <td class="yield-pct yoc" :class="yocClass(holding.yield, holding.yoc)">
                {{ holding.yoc.toFixed(2) }}%
                <span v-if="holding.yoc > holding.yield" class="yoc-badge">↑</span>
                <span v-else-if="holding.yoc < holding.yield" class="yoc-badge down">↓</span>
              </td>
              <td class="yield-bar-col">
                <div class="yield-bar-track">
                  <div
                    class="yield-bar-fill"
                    :class="yieldClass(holding.yield)"
                    :style="{ width: barWidth(holding.yield) }"
                  ></div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="yield-note">Yield on Cost ↑ means you're earning more than today's buyers</p>
    </div>
  </div>
</template>

<script>
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { Bar } from 'vue-chartjs'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, ChartDataLabels)

export default {
  components: { Bar },
  props: {
    dividends: {
      type: Object,
      default: () => ({})
    },
    dividendYields: {
      type: Array,
      default: () => []
    },
    darkMode: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    totalDividends() {
      return Object.values(this.dividends).reduce((sum, amount) => sum + amount, 0)
    },
    sortedYields() {
      return this.dividendYields
        .filter(h => h.currentValue > 0 && h.costBasis > 0)
        .map(h => ({
          ...h,
          yield: (h.annualDividend / h.currentValue) * 100,
          yoc: (h.annualDividend / h.costBasis) * 100
        }))
        .sort((a, b) => b.yield - a.yield)
    },
    maxYield() {
      return this.sortedYields.length
        ? Math.max(...this.sortedYields.map(h => h.yield))
        : 1
    },
    chartData() {
      if (!Object.keys(this.dividends).length) return { labels: [], datasets: [] }

      const years = Object.keys(this.dividends).sort()
      const amounts = years.map(year => this.dividends[year])

      return {
        labels: years,
        datasets: [{
          data: amounts,
          backgroundColor: '#28a745',
          borderColor: '#1e7e34',
          borderWidth: 1
        }]
      }
    },
    chartOptions() {
      const textColor = this.darkMode ? '#e5e7eb' : '#0b1220'

      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            titleColor: textColor,
            bodyColor: textColor,
            callbacks: {
              label: (context) => `£${context.parsed.y.toFixed(2)}`
            }
          },
          datalabels: {
            color: textColor,
            font: { weight: 'bold', size: 11 },
            formatter: (value) => `£${value.toFixed(0)}`,
            anchor: 'end',
            align: 'top',
            offset: 4
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: textColor,
              callback: (value) => `£${value}`
            }
          }
        }
      }
    }
  },
  methods: {
    barWidth(yieldPct) {
      return `${Math.min((yieldPct / this.maxYield) * 100, 100)}%`
    },
    yieldClass(yieldPct) {
      if (yieldPct >= 5) return 'high'
      if (yieldPct >= 2) return 'mid'
      return 'low'
    },
    yocClass(yieldPct, yoc) {
      // If YoC beats current yield, always show green regardless of absolute level
      if (yoc > yieldPct) return 'high'
      return this.yieldClass(yoc)
    }
  }
}
</script>

<style scoped>
/* Bridge App.vue tokens → legacy component tokens */
.dividend-summary {
  --text-color:    var(--text, #0b1220);
  --muted-color:   var(--text-muted, #6b7280);
  --table-bg:      var(--bg-card, #fff);
  --table-head-bg: var(--bg-stat, #f8f9fc);
  --table-border:  var(--border, rgba(0,0,0,0.08));
}

.dividend-summary h3 {
  margin-bottom: 1rem;
  color: var(--text-color);
}

.chart-container {
  position: relative;
  height: 400px;
  width: 100%;
  margin-bottom: 1rem;
}

.total {
  padding: 0.75rem;
  background: var(--table-head-bg);
  border-radius: 6px;
  text-align: center;
  font-weight: bold;
  font-size: 1.1rem;
  color: var(--text-color);
  border: 1px solid var(--table-border);
}

/* Yield section */
.yield-section {
  margin-top: 1.5rem;
}

.yield-header {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.yield-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-color, #0b1220);
}

.yield-subtitle {
  font-size: 0.78rem;
  color: var(--muted-color, #6b7280);
}

.yield-table-wrapper {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid var(--table-border);
  background: var(--table-bg);
}

.yield-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  background: var(--table-bg);
}

.yield-table thead tr {
  background: var(--table-head-bg);
}

.yield-table th {
  padding: 0.5rem 0.75rem;
  text-align: left;
  font-weight: 600;
  color: var(--muted-color);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  background: var(--table-head-bg);
}

.yield-table td {
  padding: 0.55rem 0.75rem;
  border-top: 1px solid var(--table-border);
  color: var(--text-color);
  white-space: nowrap;
  background: var(--table-bg);
}

.yield-table tbody tr:hover td {
  background: var(--table-head-bg);
}

.symbol {
  font-weight: 700;
  font-family: monospace;
  font-size: 0.9rem;
}

.amount {
  color: var(--muted-color, #6b7280);
}

.yield-pct {
  font-weight: 700;
  min-width: 60px;
}

.yield-pct.high { color: #16a34a; }
.yield-pct.mid  { color: #d97706; }
.yield-pct.low  { color: var(--muted-color, #6b7280); }

.yoc {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.yoc-badge {
  font-size: 0.75rem;
  font-weight: 800;
  color: #16a34a;
}

.yoc-badge.down {
  color: #dc2626;
}

/* Mini bar */
.yield-bar-col {
  width: 100%;
  min-width: 80px;
}

.yield-bar-track {
  background: var(--table-border);
  border-radius: 999px;
  height: 6px;
  overflow: hidden;
}

.yield-bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.4s ease;
}

.yield-bar-fill.high { background: #16a34a; }
.yield-bar-fill.mid  { background: #d97706; }
.yield-bar-fill.low  { background: #9ca3af; }

.yield-note {
  margin-top: 0.6rem;
  font-size: 0.75rem;
  color: var(--muted-color, #6b7280);
}
</style>