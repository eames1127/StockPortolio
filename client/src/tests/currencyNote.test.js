import { describe, it, expect } from 'vitest'
import { currencyNote } from '../currencyNote.js'

describe('currencyNote', () => {
  it('is null for an all-GBP portfolio', () => {
    expect(currencyNote({ baseCurrency: 'GBP', fxRates: {}, currencyConverted: false, unconvertedSymbols: [] })).toBeNull()
  })

  it('explains the conversion and shows the rate used', () => {
    const note = currencyNote({ baseCurrency: 'GBP', fxRates: { USD: 0.79 }, currencyConverted: true, unconvertedSymbols: [] })
    expect(note).toMatch(/^Estimate/)
    expect(note).toContain('1 USD = 0.7900 GBP')
  })

  it('names holdings that could not be converted', () => {
    const note = currencyNote({ baseCurrency: 'GBP', fxRates: {}, currencyConverted: false, unconvertedSymbols: ['AAPL'] })
    expect(note).toContain('AAPL')
  })
})
