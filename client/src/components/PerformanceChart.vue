<template>
  <div class="chart-container">
    <Line :key="darkMode ? 'dark' : 'light'" :data="chartData" :options="chartOptions" />
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
  Filler
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { Line } from 'vue-chartjs'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler, ChartDataLabels)

export default {
  components: { Line },
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
  computed: {
    textColor() {
      return this.darkMode ? '#e5e7eb' : '#0b1220'
    },
    gridColor() {
      return this.darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
    },
    chartData() {
      if (!this.data.labels || !this.data.data) return { labels: [], datasets: [] }

      return {
        labels: this.data.labels,
        datasets: [{
          data: this.data.data,
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#4CAF50',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6
        }]
      }
    },
    chartOptions() {
      const textColor = this.textColor
      const gridColor = this.gridColor

      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            titleColor: textColor,
            bodyColor: textColor,
            callbacks: {
              label: (context) => `Growth: ${context.parsed.y}%`
            }
          },
          datalabels: {
            color: textColor,
            font: {
              weight: 'bold',
              size: 12
            },
            formatter: (value) => `${value}%`,
            align: 'top',
            offset: 8
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
              display: false
            }
          }
        }
      }
    }
  }
}
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 400px;
  width: 100%;
}
</style>