<template>
  <div class="chart-scroll">
    <div class="chart-container">
      <Line :data="chartData" :options="chartOptions" />
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
    }
  },
  computed: {
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
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: ${context.parsed.y}%`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => `${value}%`
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
  overflow-x: scroll;              /* 👈 scrolling happens here */
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}

.chart-container {
  position: relative;
  height: 400px;
  min-width: 600px;              /* 👈 chart gets breathing room */
}

/* Defensive: prevent canvas shrinkage */
.chart-container canvas {
  min-width: 600px;
}
</style>