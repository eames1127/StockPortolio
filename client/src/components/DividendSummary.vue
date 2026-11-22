<template>
	<div class="dividend-summary">
		<div class="dividend-head">
			<h3>Annual Dividends</h3>
			<div
				v-if="showDividendValues"
				class="mode-toggle"
				role="group"
				aria-label="Show dividends as"
			>
				<button
					type="button"
					:class="{ active: mode === 'value' }"
					:aria-pressed="mode === 'value'"
					@click="$emit('update:mode', 'value')"
				>
					£
				</button>
				<button
					type="button"
					:class="{ active: mode === 'percent' }"
					:aria-pressed="mode === 'percent'"
					@click="$emit('update:mode', 'percent')"
				>
					%
				</button>
			</div>
		</div>
		<div v-if="showValues" class="view-tabs" role="tablist" aria-label="Chart dividends">
			<button
				v-for="tab in chartTabs"
				:key="tab.id"
				type="button"
				role="tab"
				:class="{ active: chartView === tab.id }"
				:aria-selected="chartView === tab.id"
				@click="chartView = tab.id"
			>
				{{ tab.label }}
			</button>
		</div>
		<!-- A % chart by year would duplicate Dividend Growth in the yearly growth chart,
		     so the yearly chart is £ only and % mode shows income by sector instead. -->
		<div v-if="showValues && chartView === 'year'" class="chart-container">
			<Bar :key="darkMode ? 'dark' : 'light'" :data="chartData" :options="chartOptions" />
		</div>
		<IncomeVsAllocation v-else :rows="sectorIncome" :dark-mode="darkMode" />
		<div class="total">
			<span v-if="showValues">Total: £{{ totalDividends.toFixed(2) }}</span>
			<span v-else>Latest year vs previous</span>
			<span
				v-if="totalDividendGrowth != null"
				class="total-growth"
				:class="growthClass(totalDividendGrowth)"
			>
				{{ formatGrowth(totalDividendGrowth) }}
			</span>
		</div>

		<!-- Yield per holding table -->
		<div v-if="sortedYields.length" class="yield-section">
			<div class="yield-header">
				<h4>Dividend Yield per Holding</h4>
				<span class="yield-subtitle">Sorted by current yield</span>
			</div>
			<div class="yield-table-wrapper">
				<table class="yield-table">
					<thead>
						<tr>
							<th>Holding</th>
							<th>{{ showValues ? 'Annual Div.' : 'Share of Dividends' }}</th>
							<th>Yield</th>
							<th>Yield on Cost</th>
							<th class="yield-bar-col"></th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="holding in sortedYields" :key="holding.symbol">
							<td class="symbol">
								{{
									holding.companyName && holding.companyName !== holding.symbol
										? `${holding.companyName} (${holding.symbol})`
										: holding.symbol
								}}
								<span
									v-if="convertedSymbols.includes(holding.symbol)"
									class="estimate-marker"
									role="img"
									aria-label="Estimate"
									:title="currencyNote"
									>≈</span
								>
							</td>
							<td class="amount">
								{{
									showValues
										? `£${holding.annualDividend.toFixed(2)}`
										: `${holding.dividendShare.toFixed(2)}%`
								}}
							</td>
							<td class="yield-pct" :class="yieldClass(holding.yield)">
								{{ holding.yield.toFixed(2) }}%
							</td>
							<td class="yield-pct yoc" :class="yocClass(holding.yield, holding.yieldOnCost)">
								{{ holding.yieldOnCost.toFixed(2) }}%
								<span v-if="holding.yieldOnCost > holding.yield" class="yoc-badge">↑</span>
								<span v-else-if="holding.yieldOnCost < holding.yield" class="yoc-badge down"
									>↓</span
								>
							</td>
							<td class="yield-bar-col">
								<div class="yield-bar-track">
									<div
										class="yield-bar-fill"
										:class="yieldClass(holding.yield)"
										:style="{ width: barWidth(holding.yield) }"
									></div>
								</div>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
			<p class="yield-note">Yield on Cost ↑ means you're earning more than today's buyers</p>
			<!-- Shown in full rather than only on hover, so touch users can read it too. -->
			<p v-if="currencyNote" class="yield-note currency-note" role="note">{{ currencyNote }}</p>
		</div>
	</div>
</template>

<script>
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { Bar } from 'vue-chartjs'
import IncomeVsAllocation from './IncomeVsAllocation.vue'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, ChartDataLabels)

export default {
	components: { Bar, IncomeVsAllocation },
	props: {
		dividends: {
			type: Object,
			default: () => ({}),
		},
		dividendYields: {
			type: Array,
			default: () => [],
		},
		dividendIndex: {
			type: Object,
			default: () => ({}),
		},
		// Each sector's share of dividends and of the portfolio, from incomeVsAllocation.
		sectorIncome: {
			type: Array,
			default: () => [],
		},
		darkMode: {
			type: Boolean,
			default: false,
		},
		showDividendValues: {
			type: Boolean,
			default: false,
		},
		// Holdings whose values were converted to GBP, so their yields are estimates.
		convertedSymbols: {
			type: Array,
			default: () => [],
		},
		currencyNote: {
			type: String,
			default: null,
		},
		mode: {
			type: String,
			default: 'percent',
			validator: (value) => ['value', 'percent'].includes(value),
		},
	},
	emits: ['update:mode'],
	data() {
		return {
			chartView: 'year',
			chartTabs: [
				{ id: 'year', label: 'By year' },
				{ id: 'sector', label: 'By sector' },
			],
		}
	},
	computed: {
		// The server only sends £ amounts when the setting is on, so both must agree.
		showValues() {
			return this.showDividendValues && this.mode === 'value'
		},
		// Yearly totals for the growth figure:£ totals, or each year as a % of the first year.
		series() {
			return this.showValues ? this.dividends : this.dividendIndex
		},
		totalDividends() {
			return Object.values(this.dividends).reduce((sum, amount) => sum + amount, 0)
		},
		totalDividendGrowth() {
			const years = Object.keys(this.series || {})
				.filter((year) => year && !Number.isNaN(Number(year)))
				.sort((a, b) => Number(a) - Number(b))

			if (years.length < 2) {
				return null
			}

			const latestYear = years[years.length - 1]
			const previousYear = years[years.length - 2]
			const latestTotal = Number(this.series[latestYear]) || 0
			const previousTotal = Number(this.series[previousYear]) || 0

			if (previousTotal === 0) {
				return null
			}

			return ((latestTotal - previousTotal) / previousTotal) * 100
		},
		sortedYields() {
			return this.dividendYields.slice().sort((a, b) => b.yield - a.yield)
		},
		maxYield() {
			return this.sortedYields.length ? Math.max(...this.sortedYields.map((h) => h.yield)) : 1
		},
		chartData() {
			if (!Object.keys(this.dividends).length) {
				return { labels: [], datasets: [] }
			}

			const years = Object.keys(this.dividends).sort()
			const amounts = years.map((year) => this.dividends[year])

			return {
				labels: years,
				datasets: [
					{
						data: amounts,
						backgroundColor: '#28a745',
						borderColor: '#1e7e34',
						borderWidth: 1,
					},
				],
			}
		},
		chartOptions() {
			const textColor = this.darkMode ? '#e5e7eb' : '#0b1220'
			const format = (value, decimals) => `£${Number(value).toFixed(decimals)}`

			return {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: { display: false },
					tooltip: {
						titleColor: textColor,
						bodyColor: textColor,
						callbacks: {
							label: (context) => format(context.parsed.y, 2),
						},
					},
					datalabels: {
						color: textColor,
						font: { weight: 'bold', size: 11 },
						formatter: (value) => format(value, 0),
						anchor: 'end',
						align: 'top',
						offset: 4,
					},
				},
				scales: {
					y: {
						beginAtZero: true,
						ticks: {
							color: textColor,
							callback: (value) => format(value, 0),
						},
					},
				},
			}
		},
	},
	methods: {
		barWidth(yieldPct) {
			return `${Math.min((yieldPct / this.maxYield) * 100, 100)}%`
		},
		yieldClass(yieldPct) {
			if (yieldPct >= 5) {
				return 'high'
			}
			if (yieldPct >= 2) {
				return 'mid'
			}
			return 'low'
		},
		yocClass(yieldPct, yoc) {
			// If YoC beats current yield, always show green regardless of absolute level
			if (yoc > yieldPct) {
				return 'high'
			}
			return this.yieldClass(yoc)
		},
		formatGrowth(value) {
			const prefix = value > 0 ? '+' : ''
			return `${prefix}${value.toFixed(2)}%`
		},
		growthClass(value) {
			if (value > 0) {
				return 'high'
			}
			if (value < 0) {
				return 'mid'
			}
			return 'low'
		},
	},
}
</script>

<style scoped>
.dividend-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
}

.mode-toggle {
	display: inline-flex;
	border: 1px solid var(--table-border);
	border-radius: 6px;
	overflow: hidden;
}

.mode-toggle button {
	padding: 4px 10px;
	border: none;
	background: transparent;
	color: inherit;
	font: inherit;
	cursor: pointer;
}

.mode-toggle button.active {
	background: #28a745;
	color: #fff;
}

.view-tabs {
	display: flex;
	gap: 1rem;
	margin-bottom: 1rem;
	border-bottom: 1px solid var(--table-border);
}

.view-tabs button {
	padding: 0.4rem 0;
	border: none;
	border-bottom: 2px solid transparent;
	margin-bottom: -1px;
	background: transparent;
	color: var(--muted-color);
	font: inherit;
	font-size: 0.875rem;
	font-weight: 600;
	cursor: pointer;
}

.view-tabs button.active {
	border-bottom-color: #28a745;
	color: var(--text-color);
}

/* Bridge App.vue tokens → legacy component tokens */
.dividend-summary {
	--text-color: var(--text, #0b1220);
	--muted-color: var(--text-muted, #6b7280);
	--table-bg: var(--bg-card, #fff);
	--table-head-bg: var(--bg-stat, #f8f9fc);
	--table-border: var(--border, rgba(0, 0, 0, 0.08));
}

.dividend-summary h3 {
	margin-bottom: 1rem;
	color: var(--text-color);
}

.chart-container {
	position: relative;
	height: 400px;
	width: 100%;
	margin-bottom: 1rem;
}

.total {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.75rem;
	padding: 0.75rem;
	background: var(--table-head-bg);
	border-radius: 6px;
	text-align: center;
	font-weight: bold;
	font-size: 1.1rem;
	color: var(--text-color);
	border: 1px solid var(--table-border);
}

.total-growth {
	font-size: 0.95rem;
	font-weight: 700;
}

.total-growth.high {
	color: #16a34a;
}
.total-growth.mid {
	color: #d97706;
}
.total-growth.low {
	color: var(--muted-color, #6b7280);
}

/* Yield section */
.yield-section {
	margin-top: 1.5rem;
}

.yield-header {
	display: flex;
	align-items: baseline;
	gap: 0.75rem;
	margin-bottom: 0.75rem;
}

.yield-header h4 {
	margin: 0;
	font-size: 1rem;
	font-weight: 700;
	color: var(--text-color, #0b1220);
}

.yield-subtitle {
	font-size: 0.78rem;
	color: var(--muted-color, #6b7280);
}

.yield-table-wrapper {
	overflow-x: auto;
	border: 1px solid var(--table-border);
	scrollbar-width: thin;
	scrollbar-color: rgba(128, 128, 128, 0.3) transparent;
}

.yield-table {
	width: 100%;
	border-collapse: collapse;
	font-size: 0.875rem;
	background: var(--table-bg);
}

.yield-table thead tr {
	background: var(--table-head-bg);
}

.yield-table th {
	padding: 0.5rem 0.75rem;
	text-align: left;
	font-weight: 600;
	color: var(--muted-color);
	font-size: 0.75rem;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	white-space: nowrap;
	background: var(--table-head-bg);
}

.yield-table td {
	padding: 0.55rem 0.75rem;
	border-top: 1px solid var(--table-border);
	color: var(--text-color);
	white-space: nowrap;
	background: var(--table-bg);
}

.yield-table tbody tr:hover td {
	background: var(--table-head-bg);
}

.symbol {
	font-weight: 700;
	font-family: monospace;
	font-size: 0.9rem;
}

.amount {
	color: var(--muted-color, #6b7280);
}

.yield-pct {
	font-weight: 700;
	min-width: 60px;
}

.yield-pct.high {
	color: #16a34a;
}
.yield-pct.mid {
	color: #d97706;
}
.yield-pct.low {
	color: var(--muted-color, #6b7280);
}

.yoc {
	display: flex;
	align-items: center;
	gap: 0.3rem;
}

.yoc-badge {
	font-size: 0.75rem;
	font-weight: 800;
	color: #16a34a;
}

.yoc-badge.down {
	color: #dc2626;
}

/* Mini bar */
.yield-bar-col {
	width: 100%;
	min-width: 80px;
}

.yield-bar-track {
	background: var(--table-border);
	border-radius: 999px;
	height: 6px;
	overflow: hidden;
}

.yield-bar-fill {
	height: 100%;
	border-radius: 999px;
	transition: width 0.4s ease;
}

.yield-bar-fill.high {
	background: #16a34a;
}
.yield-bar-fill.mid {
	background: #d97706;
}
.yield-bar-fill.low {
	background: #9ca3af;
}

.yield-note {
	margin-top: 0.6rem;
	font-size: 0.75rem;
	color: var(--muted-color, #6b7280);
}

/* Matches the estimate marker on the summary figures in App.vue. */
.estimate-marker {
	margin-left: 0.25rem;
	padding: 0 0.3rem;
	border: 1px solid var(--table-border);
	border-radius: 4px;
	background: var(--table-head-bg);
	color: var(--muted-color);
	font-family: inherit;
	font-weight: 400;
	line-height: 1.3;
	cursor: help;
}
</style>
