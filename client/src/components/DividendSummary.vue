<template>
  <div class="dividend-summary">
    <h3>Annual Dividends</h3>
    <div class="chart-container">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
    <div class="total">
      <span>Total: £{{ totalDividends.toFixed(2) }}</span>
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
    }
  },
  computed: {
    totalDividends() {
      return Object.values(this.dividends).reduce((sum, amount) => sum + amount, 0)
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
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `£${context.parsed.y.toFixed(2)}`
            }
          },
          datalabels: {
            color: '#333',
            font: {
              weight: 'bold',
              size: 11
            },
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
              callback: (value) => `£${value}`
            }
          }
        }
      }
    }
  }
}
</script>

<style scoped>
.dividend-summary h3 {
  margin-bottom: 1rem;
  color: #333;
}

.chart-container {
  position: relative;
  height: 250px;
  width: 100%;
  margin-bottom: 1rem;
}

.total {
  padding: 0.75rem;
  background: #e9ecef;
  border-radius: 6px;
  text-align: center;
  font-weight: bold;
  font-size: 1.1rem;
  color: #333;
}
</style>