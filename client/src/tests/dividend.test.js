import { describe, it, expect, beforeAll } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../App.vue'
import DividendSummary from '../components/DividendSummary.vue'
import IncomeVsAllocation from '../components/IncomeVsAllocation.vue'
import TotalGrowth from '../components/TotalGrowth.vue'

beforeAll(() => {
	Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
		value() {
			return {
				canvas: {},
				clearRect: () => {},
				fillRect: () => {},
				drawImage: () => {},
				save: () => {},
				restore: () => {},
				setTransform: () => {},
				scale: () => {},
				translate: () => {},
				measureText: () => ({ width: 0 }),
				fillText: () => {},
				beginPath: () => {},
				moveTo: () => {},
				lineTo: () => {},
				closePath: () => {},
				arc: () => {},
				fill: () => {},
				stroke: () => {},
				strokeRect: () => {},
				fillStyle: '',
				strokeStyle: '',
				lineWidth: 0,
				font: '',
				textAlign: '',
				textBaseline: '',
			}
		},
		configurable: true,
	})
})

describe('Dividend Calculations', () => {
	it('calculates yearly performance stats from ordered annual returns', () => {
		const portfolioData = { growth: { 2024: -20, 2022: 10, 2023: 30 } }
		const yearlyPerformance = App.computed.yearlyPerformance.call({ portfolioData })
		const context = { yearlyPerformance }

		expect(yearlyPerformance.map(({ year }) => year)).toEqual(['2022', '2023', '2024'])
		expect(App.computed.bestPerformance.call(context)).toBe('30.00')
		expect(App.computed.bestPerformanceYear.call(context)).toBe('2023')
		expect(App.computed.worstPerformance.call(context)).toBe('-20.00')
		expect(App.computed.worstPerformanceYear.call(context)).toBe('2024')
		expect(App.computed.growthYearRange.call(context)).toBe('2022–2024')
		expect(App.computed.cagr.call(context)).toBe('4.59')
	})

	it('shows the top holding and formats portfolio yield stats', () => {
		const portfolioData = {
			sectorDetails: {
				Financial: [{ symbol: 'LLOY.L', companyName: 'Lloyds', percentage: '27.00' }],
				Technology: [{ symbol: 'AAPL', companyName: 'Apple', percentage: '18.00' }],
			},
			portfolioDividendYield: 3.456,
			portfolioYieldOnCost: 4.5,
		}
		const context = { portfolioData }
		const computedContext = { ...context, topHolding: App.computed.topHolding.call(context) }

		expect(computedContext.topHolding.symbol).toBe('LLOY.L')
		expect(App.computed.topHoldingWeight.call(computedContext)).toBe('27.00')
		expect(App.computed.topHoldingName.call(computedContext)).toBe('Lloyds')
		expect(App.computed.portfolioDividendYield.call(context)).toBe('3.46')
		expect(App.computed.portfolioYieldOnCost.call(context)).toBe('4.50')
	})

	it('calculates total dividends correctly', () => {
		const dividends = {
			2022: 1200.5,
			2023: 1350.75,
			2024: 1500.0,
		}

		const total = Object.values(dividends).reduce((sum, amount) => sum + amount, 0)
		expect(total).toBe(4051.25)
	})

	it('calculates monthly averages correctly', () => {
		const dividends = { 2023: 1200 }
		const monthlyAverage = dividends['2023'] / 12
		expect(monthlyAverage).toBe(100)
	})

	it('calculates daily averages correctly', () => {
		const dividends = { 2023: 365 }
		const dailyAverage = dividends['2023'] / 365
		expect(dailyAverage).toBe(1)
	})

	it('shows total dividend YoY growth in the summary area', () => {
		const wrapper = mount(DividendSummary, {
			props: {
				dividends: {
					2023: 100,
					2024: 120,
				},
				dividendYields: [
					{
						symbol: 'AAPL',
						companyName: 'Apple Inc.',
						annualDividend: 120,
						dividendShare: 100,
						yield: 6,
						yieldOnCost: 8,
					},
				],
				showDividendValues: true,
				mode: 'value',
			},
		})

		const headers = wrapper.findAll('th').map((cell) => cell.text().trim())
		expect(headers).not.toContain('YoY')
		expect(wrapper.text()).toContain('+20.00%')
	})

	describe('dividend values setting', () => {
		const percentProps = {
			dividendIndex: { 2023: 100, 2024: 120 },
			dividendYields: [
				{
					symbol: 'AAPL',
					companyName: 'Apple Inc.',
					dividendShare: 62.5,
					yield: 6,
					yieldOnCost: 8,
				},
			],
		}

		it('shows only percentages and no toggle when £ values are disabled', () => {
			const wrapper = mount(DividendSummary, { props: { ...percentProps, mode: 'value' } })

			expect(wrapper.find('.mode-toggle').exists()).toBe(false)
			expect(wrapper.text()).not.toContain('£')
			expect(wrapper.text()).toContain('Share of Dividends')
			expect(wrapper.text()).toContain('62.50%')
			expect(wrapper.text()).toContain('+20.00%')
		})

		it('hides the yearly chart in % mode, since the growth chart already shows dividend growth', () => {
			const wrapper = mount(DividendSummary, {
				props: { ...percentProps, showDividendValues: true, mode: 'percent' },
			})

			expect(wrapper.find('.chart-container').exists()).toBe(false)
			expect(wrapper.text()).toContain('Latest year vs previous')
			expect(wrapper.text()).toContain('+20.00%')
		})

		it('shows income vs allocation by sector in % mode, with no tabs', () => {
			const sectorIncome = [{ sector: 'Tech', income: 100, allocation: 60 }]
			const wrapper = mount(DividendSummary, {
				props: { ...percentProps, sectorIncome, showDividendValues: true, mode: 'percent' },
			})
			const incomeChart = wrapper.findComponent(IncomeVsAllocation)

			expect(wrapper.find('.view-tabs').exists()).toBe(false)
			expect(wrapper.text()).toContain('Income vs Allocation')
			expect(incomeChart.vm.chartData.labels).toEqual(['Tech'])
			expect(incomeChart.vm.chartData.datasets.map((d) => d.data)).toEqual([[100], [60]])
		})

		it('switches between the yearly £ chart and income by sector in £ mode', async () => {
			const wrapper = mount(DividendSummary, {
				props: {
					dividends: { 2023: 100, 2024: 120 },
					sectorIncome: [{ sector: 'Tech', income: 100, allocation: 60 }],
					showDividendValues: true,
					mode: 'value',
				},
			})
			const tabs = wrapper.findAll('.view-tabs button')

			expect(tabs.map((tab) => tab.text())).toEqual(['By year', 'By sector'])
			expect(tabs[0].attributes('aria-selected')).toBe('true')
			expect(wrapper.find('.chart-container').exists()).toBe(true)
			expect(wrapper.findComponent(IncomeVsAllocation).exists()).toBe(false)

			await tabs[1].trigger('click')
			expect(tabs[1].attributes('aria-selected')).toBe('true')
			expect(wrapper.findComponent(IncomeVsAllocation).exists()).toBe(true)
			expect(wrapper.text()).toContain('Total: £220.00')
		})

		it('charts the £ totals in £ mode', () => {
			const wrapper = mount(DividendSummary, {
				props: { dividends: { 2023: 100, 2024: 120 }, showDividendValues: true, mode: 'value' },
			})

			expect(wrapper.find('.chart-container').exists()).toBe(true)
			expect(wrapper.vm.chartData.labels).toEqual(['2023', '2024'])
			expect(wrapper.vm.chartData.datasets[0].data).toEqual([100, 120])
		})

		it('offers a £ / % toggle when £ values are enabled', async () => {
			const wrapper = mount(DividendSummary, {
				props: { ...percentProps, showDividendValues: true, mode: 'percent' },
			})

			const buttons = wrapper.findAll('.mode-toggle button')
			expect(buttons.map((b) => b.text())).toEqual(['£', '%'])
			expect(wrapper.text()).not.toContain('Total: £')

			await buttons[0].trigger('click')
			expect(wrapper.emitted('update:mode')).toEqual([['value']])
		})

		it('forces percentage mode in the app when the server disables £ values', () => {
			const context = { dividendMode: 'value', showDividendValues: false }
			expect(App.computed.dividendDisplayMode.get.call(context)).toBe('percent')
			expect(
				App.computed.dividendDisplayMode.get.call({ ...context, showDividendValues: true }),
			).toBe('value')
		})

		it('works out dividend growth from the index', () => {
			const portfolioData = { dividendIndex: { 2022: 100, 2023: 125, 2024: 150 } }
			const growth = App.computed.dividendGrowth.call({ portfolioData })

			expect(growth['2023']).toBeCloseTo(25)
			expect(growth['2024']).toBeCloseTo(20)
		})
	})

	describe('currency estimates in the yield table', () => {
		const props = {
			dividendYields: [
				{
					symbol: 'AAPL',
					companyName: 'Apple Inc.',
					dividendShare: 50,
					yield: 1.25,
					yieldOnCost: 2.5,
				},
				{ symbol: 'LLOY.L', companyName: 'Lloyds', dividendShare: 50, yield: 5, yieldOnCost: 6 },
			],
			convertedSymbols: ['AAPL'],
			currencyNote: 'Estimate: foreign holdings are converted to GBP at the latest exchange rate.',
		}

		it('marks converted holdings as estimates and explains why', () => {
			const wrapper = mount(DividendSummary, { props })
			const rows = wrapper.findAll('tbody tr')
			const row = (symbol) => rows.find((r) => r.text().includes(symbol))

			expect(row('AAPL').find('.estimate-marker').exists()).toBe(true)
			expect(row('LLOY.L').find('.estimate-marker').exists()).toBe(false)
			expect(wrapper.find('.currency-note').text()).toContain(props.currencyNote)
		})

		it('shows no marker or note when nothing was converted', () => {
			const wrapper = mount(DividendSummary, {
				props: { dividendYields: props.dividendYields },
			})

			expect(wrapper.find('.estimate-marker').exists()).toBe(false)
			expect(wrapper.find('.currency-note').exists()).toBe(false)
		})

		it('lists holdings priced in another currency as converted', () => {
			const portfolioData = {
				baseCurrency: 'GBP',
				sectorDetails: {
					Tech: [{ symbol: 'AAPL', currency: 'USD' }],
					Banks: [{ symbol: 'LLOY.L', currency: 'GBP' }],
				},
			}

			expect(App.computed.convertedSymbols.call({ portfolioData })).toEqual(['AAPL'])
		})
	})

	it('supports switching the annual growth chart between portfolio and dividend modes', () => {
		const wrapper = mount(TotalGrowth, {
			props: {
				growth: { 2022: 10, 2023: 20, 2024: 35 },
				datasetLabel: 'Dividend Growth',
				lineColor: '#1d4ed8',
			},
		})

		expect(wrapper.props('datasetLabel')).toBe('Dividend Growth')
		expect(wrapper.props('lineColor')).toBe('#1d4ed8')
		expect(wrapper.vm.chartData.datasets[0].label).toBe('Dividend Growth')
	})
})
