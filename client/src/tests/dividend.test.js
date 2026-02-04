import { describe, it, expect } from 'vitest'

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
})