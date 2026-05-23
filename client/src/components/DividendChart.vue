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
    dividends: {
      type: Object,
      default: () => ({})
    },
    darkMode: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    chartData() {
      if (!Object.keys(this.dividends).length) return { labels: [], datasets: [] }
      
      const years = Object.keys(this.dividends).sort()
      const monthlyAverages = years.map(year => (this.dividends[year] / 12).toFixed(2))
      const dailyAverages = years.map(year => (this.dividends[year] / 365).toFixed(2))
      
      return {
        labels: years,
        datasets: [
          {
            label: 'Monthly Average',
            data: monthlyAverages,
            borderColor: '#36A2EB',
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            tension: 0.4,
            pointRadius: 5,
            datalabels: {
              backgroundColor: '#36A2EB',
              color: 'white',
              borderRadius: 4,
              font: { size: 10, weight: 'bold' },
              formatter: (value) => `£${parseFloat(value).toFixed(0)}`,
              align: 'top',
              offset: 8
            }
          },
          {
            label: 'Daily Average',
            data: dailyAverages,
            borderColor: '#FF0000',
            backgroundColor: 'rgba(255, 99, 132, 0.1)',
            tension: 0.4,
            pointRadius: 5,
            datalabels: {
              backgroundColor: '#FF0000',
              color: 'white',
              borderRadius: 4,
              font: { size: 10, weight: 'bold' },
              formatter: (value) => `£${parseFloat(value).toFixed(2)}`,
              align: 'bottom',
              offset: 8
            }
          }
        ]
      }
    },
    chartOptions() {
      const textColor = this.darkMode ? '#fff' : '#000'

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
            bodyColor: textColor,
            titleColor: textColor,
            callbacks: {
              label: (context) => `${context.dataset.label}: £${context.parsed.y}`
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: textColor
            },
            grid: {
              color: this.darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: textColor,
              callback: (value) => `£${value}`
            },
            grid: {
              color: this.darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
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
  /* prevent scroll container from stretching parent */
  min-width: 0;
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