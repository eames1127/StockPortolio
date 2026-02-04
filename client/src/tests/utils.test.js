import { describe, it, expect } from 'vitest'
import { TIME_PERIODS, CHART_COLORS, API_ENDPOINTS, DEFAULT_PERIOD } from '../constants.js'

describe('Constants', () => {
  it('has correct time periods', () => {
    expect(TIME_PERIODS).toEqual(['1M', '1Y', 'YTD', '5Y'])
  })

  it('has chart colors array', () => {
    expect(CHART_COLORS).toHaveLength(6)
    expect(CHART_COLORS[0]).toBe('#FF6384')
  })

  it('has API endpoints', () => {
    expect(API_ENDPOINTS.PORTFOLIO).toBe('/api/portfolio')
    expect(API_ENDPOINTS.PERFORMANCE).toBe('/api/performance')
  })

  it('has default period', () => {
    expect(DEFAULT_PERIOD).toBe('1Y')
  })
})