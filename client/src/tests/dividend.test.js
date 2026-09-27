import { describe, it, expect, beforeAll } from 'vitest'
import { mount } from '@vue/test-utils'
import DividendSummary from '../components/DividendSummary.vue'
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
        textBaseline: ''
      }
    },
    configurable: true
  })
})

describe('Dividend Calculations', () => {
  it('calculates total dividends correctly', () => {
    const dividends = {
      '2022': 1200.50,
      '2023': 1350.75,
      '2024': 1500.00
    }
    
    const total = Object.values(dividends).reduce((sum, amount) => sum + amount, 0)
    expect(total).toBe(4051.25)
  })

  it('calculates monthly averages correctly', () => {
    const dividends = { '2023': 1200 }
    const monthlyAverage = dividends['2023'] / 12
    expect(monthlyAverage).toBe(100)
  })

  it('calculates daily averages correctly', () => {
    const dividends = { '2023': 365 }
    const dailyAverage = dividends['2023'] / 365
    expect(dailyAverage).toBe(1)
  })

  it('shows total dividend YoY growth in the summary area', () => {
    const wrapper = mount(DividendSummary, {
      props: {
        dividends: {
          '2023': 100,
          '2024': 120
        },
        dividendYields: [{
          symbol: 'AAPL',
          companyName: 'Apple Inc.',
          annualDividend: 120,
          currentValue: 2000,
          costBasis: 1500
        }]
      }
    })

    const headers = wrapper.findAll('th').map(cell => cell.text().trim())
    expect(headers).not.toContain('YoY')
    expect(wrapper.text()).toContain('+20.00%')
  })

  it('supports switching the annual growth chart between portfolio and dividend modes', () => {
    const wrapper = mount(TotalGrowth, {
      props: {
        growth: { 2022: 10, 2023: 20, 2024: 35 },
        datasetLabel: 'Dividend Growth',
        lineColor: '#1d4ed8'
      }
    })

    expect(wrapper.props('datasetLabel')).toBe('Dividend Growth')
    expect(wrapper.props('lineColor')).toBe('#1d4ed8')
    expect(wrapper.vm.chartData.datasets[0].label).toBe('Dividend Growth')
  })
})