<template>
  <div class="chart-container">
    <Pie :key="darkMode ? 'dark' : 'light'" :data="chartData" :options="chartOptions" />
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
          hoverOffset: 15
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