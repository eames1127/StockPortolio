<template>
	<div v-if="rows.length" class="income-vs-allocation">
		<div class="income-header">
			<h4>Income vs Allocation</h4>
			<span class="income-subtitle">Each sector's share of dividends and of the portfolio</span>
		</div>
		<div class="chart-container" :style="{ height: `${chartHeight}px` }">
			<Bar :key="darkMode ? 'dark' : 'light'" :data="chartData" :options="chartOptions" />
		</div>
	</div>
</template>

<script>
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { Bar } from 'vue-chartjs'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, ChartDataLabels)

// Room per sector for its pair of bars, plus space for the legend and axis.
const ROW_HEIGHT = 56
const CHART_CHROME_HEIGHT = 70

export default {
	components: { Bar },
	props: {
		// Rows of { sector, income, allocation }, all percentages.
		rows: {
			type: Array,
			default: () => [],
		},
		darkMode: {
			type: Boolean,
			default: false,
		},
	},
	computed: {
		chartHeight() {
			return this.rows.length * ROW_HEIGHT + CHART_CHROME_HEIGHT
		},
		chartData() {
			return {
				labels: this.rows.map((row) => row.sector),
				datasets: [
					{
						label: 'Share of dividends',
						data: this.rows.map((row) => row.income),
						backgroundColor: '#28a745',
						borderColor: '#1e7e34',
						borderWidth: 1,
					},
					{
						label: 'Share of portfolio',
						data: this.rows.map((row) => row.allocation),
						backgroundColor: '#9ca3af',
						borderColor: '#6b7280',
						borderWidth: 1,
					},
				],
			}
		},
		chartOptions() {
			const textColor = this.darkMode ? '#e5e7eb' : '#0b1220'
			const format = (value, decimals) => `${Number(value).toFixed(decimals)}%`

			return {
				indexAxis: 'y',
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						position: 'top',
						labels: { color: textColor, boxWidth: 12 },
					},
					tooltip: {
						titleColor: textColor,
						bodyColor: textColor,
						callbacks: {
							label: (context) => `${context.dataset.label}: ${format(context.parsed.x, 2)}`,
						},
					},
					datalabels: {
						color: textColor,
						font: { weight: 'bold', size: 10 },
						formatter: (value) => format(value, 0),
						anchor: 'end',
						align: 'right',
						offset: 2,
					},
				},
				scales: {
					x: {
						beginAtZero: true,
						// Headroom so the labels on the longest bar aren't cut off.
						grace: '10%',
						ticks: { color: textColor, callback: (value) => format(value, 0) },
					},
					y: {
						ticks: { color: textColor },
						grid: { display: false },
					},
				},
			}
		},
	},
}
</script>

<style scoped>
.income-vs-allocation {
	margin-bottom: 1rem;
}

.income-header {
	display: flex;
	align-items: baseline;
	flex-wrap: wrap;
	gap: 0.75rem;
	margin-bottom: 0.75rem;
}

.income-header h4 {
	margin: 0;
	font-size: 1rem;
	font-weight: 700;
	color: var(--text, #0b1220);
}

.income-subtitle {
	font-size: 0.78rem;
	color: var(--text-muted, #6b7280);
}

.chart-container {
	position: relative;
	width: 100%;
}
</style>
