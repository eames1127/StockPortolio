/**
 * Explains why portfolio totals are estimates when the API had to convert
 * foreign holdings to the base currency, or couldn't convert some at all.
 * Returns null when every holding was already in the base currency.
 */
export function currencyNote(portfolio = {}) {
  const base = portfolio.baseCurrency || 'GBP'
  const rates = Object.entries(portfolio.fxRates || {})
  const unconverted = portfolio.unconvertedSymbols || []
  const parts = []

  if (portfolio.currencyConverted && rates.length > 0) {
    const rateText = rates.map(([currency, rate]) => `1 ${currency} = ${Number(rate).toFixed(4)} ${base}`).join(', ')
    parts.push(
      `Estimate: foreign holdings are converted to ${base} at the latest exchange rate (${rateText}), ` +
      'refreshed with prices. Rates move, and cost basis uses today\'s rate rather than the rate when you bought.'
    )
  }
  if (unconverted.length > 0) {
    parts.push(`No exchange rate was available for ${unconverted.join(', ')}, so they're left out of these figures.`)
  }

  return parts.length > 0 ? parts.join(' ') : null
}
