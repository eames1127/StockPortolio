<template>
  <div class="sector-wrapper">
    <div class="chart-container">
      <Pie
        ref="pieChart"
        :key="darkMode ? 'dark' : 'light'"
        :data="chartData"
        :options="chartOptions"
        @click="onPieClick"
      />
    </div>

    <!-- Stocks table -->
    <div v-if="allStocks.length" class="stocks-section">
      <div class="stocks-header">
        <span class="stocks-title">
          <span
            v-if="selectedSector"
            class="sector-dot"
            :style="{ background: selectedSectorColor }"
          ></span>
          {{ selectedSector || 'All Holdings' }}
        </span>
        <button v-if="selectedSector" class="clear-btn" @click="clearSelection">
          Show all ✕
        </button>
      </div>
      <div class="stocks-table-wrapper">
        <table class="stocks-table">
          <thead>
            <tr>
              <th>Holding</th>
              <th>Sector</th>
              <th>Price</th>
              <th>Allocation</th>
              <th class="bar-col"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="stock in filteredStocks" :key="stock.symbol">
              <td class="symbol">{{ stock.companyName && stock.companyName !== stock.symbol ? `${stock.companyName} (${stock.symbol})` : stock.symbol }}</td>
              <td class="sector-label">
                <span class="dot" :style="{ background: sectorColor(stock.sector) }"></span>
                {{ stock.sector }}
              </td>
              <td class="price">{{ formatPrice(stock.currentPrice, stock.currency) }}</td>
              <td class="pct" :title="`${stock.sectorPercentage}% of ${stock.sector} sector`">{{ stock.percentage }}%</td>
              <td class="bar-col" :title="`${stock.sectorPercentage}% of ${stock.sector} sector`">
                <div class="bar-track">
                  <div
                    class="bar-fill"
                    :style="{
                      width: barWidth(stock.sectorPercentage),
                      background: sectorColor(stock.sector)
                    }"
                  ></div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { Pie } from 'vue-chartjs'
import { CHART_COLORS } from '../constants.js'

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels)

export default {
  components: { Pie },
  props: {
    data: {
      type: Object,
      default: () => ({})
    },
    darkMode: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      selectedSector: null,
      selectedSectorIndex: null
    }
  },
  computed: {
    textColor() {
      return this.darkMode ? '#e5e7eb' : '#0b1220'
    },
    chartData() {
      if (!this.data.sectors) return { labels: [], datasets: [] }

      return {
        labels: Object.keys(this.data.sectors),
        datasets: [{
          data: Object.values(this.data.sectors).map(Number),
          backgroundColor: CHART_COLORS,
          hoverOffset: 15,
          borderWidth: this.selectedSectorIndex !== null
            ? Object.keys(this.data.sectors).map((_, i) =>
                i === this.selectedSectorIndex ? 4 : 2
              )
            : 2,
          borderColor: this.selectedSectorIndex !== null
            ? Object.keys(this.data.sectors).map((_, i) =>
                i === this.selectedSectorIndex ? '#ffffff' : (this.darkMode ? '#0b1220' : '#fff')
              )
            : (this.darkMode ? '#0b1220' : '#fff')
        }]
      }
    },
    chartOptions() {
      const textColor = this.textColor

      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: textColor,
              padding: 20,
              usePointStyle: true
            }
          },
          tooltip: {
            titleColor: textColor,
            bodyColor: textColor,
            callbacks: {
              title: (context) => context[0].label,
              label: (context) => {
                const sectorName = context.label
                const sectorPercentage = context.parsed
                const sectorDetails = this.data.sectorDetails?.[sectorName] || []

                let tooltip = [`Sector: ${sectorPercentage}%`]

                if (sectorDetails.length > 0) {
                  tooltip.push('')
                  tooltip.push('Stocks:')
                  sectorDetails.forEach(stock => {
                    const name = stock.companyName || stock.symbol
                    tooltip.push(`${name === stock.symbol ? stock.symbol : `${name} (${stock.symbol})`}: ${stock.percentage}%`)
                  })
                }

                return tooltip
              }
            }
          },
          datalabels: {
            color: 'white',
            font: {
              weight: 'bold',
              size: 14
            },
            formatter: (value) => `${value}%`,
            display: (context) => context.parsed > 5
          }
        },
        layout: {
          padding: 20
        },
        elements: {
          arc: {
            borderWidth: 2,
            borderColor: this.darkMode ? '#0b1220' : '#fff'
          }
        },
        onHover: (event, elements) => {
          event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default'
        }
      }
    },
    allStocks() {
      if (!this.data.sectorDetails) return []
      const stocks = []
      const sectors = Object.keys(this.data.sectorDetails)
      sectors.forEach(sector => {
        this.data.sectorDetails[sector].forEach(stock => {
          stocks.push({ ...stock, sector })
        })
      })
      return stocks.sort((a, b) => b.percentage - a.percentage)
    },
    filteredStocks() {
      if (!this.selectedSector) return this.allStocks
      return this.allStocks.filter(s => s.sector === this.selectedSector)
    },
    maxSectorPercentage() {
      return this.filteredStocks.length
        ? Math.max(...this.filteredStocks.map(s => parseFloat(s.sectorPercentage)))
        : 1
    },
    selectedSectorColor() {
      if (!this.selectedSector || !this.data.sectors) return ''
      const idx = Object.keys(this.data.sectors).indexOf(this.selectedSector)
      return CHART_COLORS[idx] || '#888'
    }
  },
  methods: {
    onPieClick(event) {
      const chart = this.$refs.pieChart?.chart
      if (!chart) return

      const elements = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, false)
      if (!elements.length) {
        this.clearSelection()
        return
      }

      const idx = elements[0].index
      const label = this.chartData.labels[idx]

      if (this.selectedSector === label) {
        this.clearSelection()
      } else {
        this.selectedSector = label
        this.selectedSectorIndex = idx
      }
    },
    clearSelection() {
      this.selectedSector = null
      this.selectedSectorIndex = null
    },
    sectorColor(sector) {
      if (!this.data.sectors) return '#888'
      const idx = Object.keys(this.data.sectors).indexOf(sector)
      return CHART_COLORS[idx] || '#888'
    },
    barWidth(pct) {
      return `${Math.min((parseFloat(pct) / this.maxSectorPercentage) * 100, 100)}%`
    },
    formatPrice(price, currency) {
      if (price == null) return '–'
      const fmt = (n) => parseFloat(n.toFixed(4)).toString()
      if (currency === 'GBp') {
        return `£${fmt(price / 100)}`
      }
      const symbols = { USD: '$', GBP: '£', EUR: '€' }
      const sym = symbols[currency] || (currency ? `${currency} ` : '')
      return `${sym}${fmt(price)}`
    }
  }
}
</script>

<style scoped>
/* Bridge App.vue tokens → component tokens */
.sector-wrapper {
  --text-color:   var(--text, #0b1220);
  --muted-color:  var(--text-muted, #6b7280);
  --table-bg:     var(--bg-card, #fff);
  --table-head-bg:var(--bg-stat, #f8f9fc);
  --table-border: var(--border, rgba(0,0,0,0.08));

  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.chart-container {
  position: relative;
  height: 400px;
  width: 100%;
}

/* Stocks table */
.stocks-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stocks-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stocks-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--text-color);
}

.sector-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.clear-btn {
  background: none;
  border: 1px solid var(--table-border);
  border-radius: 6px;
  padding: 0.2rem 0.6rem;
  font-size: 0.75rem;
  cursor: pointer;
  color: var(--muted-color);
  transition: all 0.15s;
}

.clear-btn:hover {
  background: rgba(128,128,128,0.1);
}

.stocks-table-wrapper {
  overflow-y: auto;
  border-radius: 8px;
  border: 1px solid var(--table-border);
  background: var(--table-bg);
  scrollbar-width: thin;
  scrollbar-color: rgba(128,128,128,0.3) transparent;
}

.stocks-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  background: var(--table-bg);
}

.stocks-table thead tr {
  background: var(--table-head-bg);
  position: sticky;
  top: 0;
  z-index: 1;
}

.stocks-table th {
  padding: 0.45rem 0.75rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--muted-color);
  white-space: nowrap;
  background: var(--table-head-bg);
}

.stocks-table td {
  padding: 0.45rem 0.75rem;
  border-top: 1px solid var(--table-border);
  color: var(--text-color);
  white-space: nowrap;
  background: var(--table-bg);
}

.stocks-table tbody tr:hover td {
  background: var(--table-head-bg);
}

.symbol {
  font-weight: 700;
  font-family: monospace;
  font-size: 0.88rem;
}

.sector-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--muted-color);
  font-size: 0.8rem;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.pct {
  font-weight: 600;
  min-width: 48px;
}

.price {
  text-align: right;
  min-width: 90px;
  color: var(--text-color);
}

.bar-col {
  width: 100%;
  min-width: 70px;
}

.bar-track {
  background: rgba(128,128,128,0.12);
  border-radius: 999px;
  height: 5px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.35s ease;
  opacity: 0.85;
}
</style>