<template>
  <div class="chart-scroll">
    <div class="chart-container">
      <Line :key="darkMode ? 'dark' : 'light'" :data="chartData" :options="chartOptions" />
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
    darkMode: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    textColor() {
      return this.darkMode ? '#e5e7eb' : '#0b1220'
    },
    gridColor() {
      return this.darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
    },
    chartData() {
      if (!Object.keys(this.growth).length) return { labels: [], datasets: [] }

      const years = Object.keys(this.growth).sort()
      const yearlyGrowth = years.map(year => (this.growth[year]).toFixed(2))

      return {
        labels: years,
        datasets: [
          {
            label: 'Growth',
            data: yearlyGrowth,
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            tension: 0.4,
            pointRadius: 5,
            datalabels: {
              backgroundColor: '#4CAF50',
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
            beginAtZero: true,
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
  overflow-x: scroll;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}

.chart-container {
  position: relative;
  height: 400px;
  min-width: 600px;
}

.chart-container canvas {
  min-width: 600px;
}
</style>