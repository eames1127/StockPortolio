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
              <th>Symbol</th>
              <th>Sector</th>
              <th>Allocation</th>
              <th class="bar-col"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="stock in filteredStocks" :key="stock.symbol">
              <td class="symbol">{{ stock.symbol }}</td>
              <td class="sector-label">
                <span class="dot" :style="{ background: sectorColor(stock.sector) }"></span>
                {{ stock.sector }}
              </td>
              <td class="pct">{{ stock.percentage }}%</td>
              <td class="bar-col">
                <div class="bar-track">
                  <div
                    class="bar-fill"
                    :style="{
                      width: barWidth(stock.percentage),
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
                    tooltip.push(`${stock.symbol}: ${stock.percentage}%`)
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
    maxPercentage() {
      return this.allStocks.length
        ? Math.max(...this.allStocks.map(s => parseFloat(s.percentage)))
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
      return `${Math.min((parseFloat(pct) / this.maxPercentage) * 100, 100)}%`
    }
  }
}
</script>

<style scoped>
.sector-wrapper {
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
  color: var(--text-color, #0b1220);
}

.sector-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.clear-btn {
  background: none;
  border: 1px solid rgba(128,128,128,0.3);
  border-radius: 6px;
  padding: 0.2rem 0.6rem;
  font-size: 0.75rem;
  cursor: pointer;
  color: var(--muted-color, #6b7280);
  transition: all 0.15s;
}

.clear-btn:hover {
  background: rgba(128,128,128,0.1);
}

.stocks-table-wrapper {
  max-height: 220px;
  overflow-y: auto;
  border-radius: 8px;
  border: 1px solid rgba(128,128,128,0.15);
  scrollbar-width: thin;
  scrollbar-color: rgba(128,128,128,0.3) transparent;
}

.stocks-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.stocks-table thead tr {
  background: rgba(128,128,128,0.07);
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
  color: var(--muted-color, #6b7280);
  white-space: nowrap;
  background: inherit;
}

.stocks-table td {
  padding: 0.45rem 0.75rem;
  border-top: 1px solid rgba(128,128,128,0.1);
  color: var(--text-color, #0b1220);
  white-space: nowrap;
}

.stocks-table tbody tr:hover {
  background: rgba(128,128,128,0.05);
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
  color: var(--muted-color, #6b7280);
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