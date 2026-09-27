<template>
  <div class="chart-scroll">
    <div class="mode-toggle" v-if="showModeToggle">
      <button
        type="button"
        :class="{ active: selectedMode === 'portfolio' }"
        @click="selectedMode = 'portfolio'"
      >
        Portfolio Growth
      </button>
      <button
        type="button"
        :class="{ active: selectedMode === 'dividend' }"
        @click="selectedMode = 'dividend'"
      >
        Dividend Growth
      </button>
    </div>
    <div class="chart-container">
      <Line :key="chartKey" :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script>
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { Line } from 'vue-chartjs'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, ChartDataLabels)

export default {
  components: { Line },
  props: {
    growth: {
      type: Object,
      default: () => ({})
    },
    dividendGrowth: {
      type: Object,
      default: () => ({})
    },
    darkMode: {
      type: Boolean,
      default: false
    },
    showModeToggle: {
      type: Boolean,
      default: true
    },
    datasetLabel: {
      type: String,
      default: 'Growth'
    },
    lineColor: {
      type: String,
      default: '#4CAF50'
    }
  },
  data() {
    return {
      selectedMode: 'portfolio'
    }
  },
  computed: {
    textColor() {
      return this.darkMode ? '#e5e7eb' : '#0b1220'
    },
    gridColor() {
      return this.darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
    },
    chartKey() {
      return `${this.darkMode ? 'dark' : 'light'}-${this.selectedMode}`
    },
    activeSeries() {
      if (this.selectedMode === 'dividend') {
        return this.dividendGrowth && Object.keys(this.dividendGrowth).length
          ? this.dividendGrowth
          : {}
      }
      return this.growth || {}
    },
    chartData() {
      if (!Object.keys(this.activeSeries).length) return { labels: [], datasets: [] }

      const years = Object.keys(this.activeSeries).sort()
      const yearlyGrowth = years.map(year => Number(this.activeSeries[year]).toFixed(2))
      const label = this.selectedMode === 'dividend' ? 'Dividend Growth' : (this.datasetLabel || 'Growth')
      const color = this.selectedMode === 'dividend' ? (this.lineColor || '#1d4ed8') : '#4CAF50'

      return {
        labels: years,
        datasets: [
          {
            label,
            data: yearlyGrowth,
            borderColor: color,
            backgroundColor: this.selectedMode === 'dividend' ? 'rgba(29, 78, 216, 0.1)' : 'rgba(54, 162, 235, 0.1)',
            tension: 0.4,
            pointRadius: 5,
            datalabels: {
              backgroundColor: color,
              color: 'white',
              borderRadius: 4,
              font: { size: 10, weight: 'bold' },
              formatter: (value) => `${parseFloat(value).toFixed(0)}%`,
              align: 'top',
              offset: 8
            }
          }
        ]
      }
    },
    chartOptions() {
      const textColor = this.textColor
      const gridColor = this.gridColor

      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: textColor
            }
          },
          tooltip: {
            titleColor: textColor,
            bodyColor: textColor,
            callbacks: {
              label: (context) => `${context.dataset.label}: ${context.parsed.y}%`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            ticks: {
              color: textColor,
              callback: (value) => `${value}%`
            },
            grid: {
              color: gridColor
            }
          },
          x: {
            ticks: {
              color: textColor
            },
            grid: {
              color: gridColor
            }
          }
        }
      }
    }
  }
}
</script>

<style scoped>
.chart-scroll {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  min-width: 0;
}

.mode-toggle {
  display: inline-flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding: 0.25rem;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.12);
}

.mode-toggle button {
  border: none;
  border-radius: 999px;
  padding: 0.45rem 0.8rem;
  font-weight: 600;
  color: var(--text-color, #0b1220);
  background: transparent;
  cursor: pointer;
}

.mode-toggle button.active {
  background: #4CAF50;
  color: white;
}

.chart-container {
  position: relative;
  height: 300px;
  min-width: 500px;
}

@media (min-width: 600px) {
  .chart-container {
    height: 380px;
    min-width: 600px;
  }
}
</style>