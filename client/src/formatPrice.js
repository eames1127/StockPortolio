const SYMBOLS = { USD: '$', GBP: '£', EUR: '€' }

export function formatPrice(price, currency) {
	if (price == null) {
		return '–'
	}
	const fmt = (n) => parseFloat(n.toFixed(4)).toString()
	// Yahoo quotes LSE stocks in pence as 'GBp'; every other currency is shown as quoted.
	if (currency === 'GBp') {
		return `£${fmt(price / 100)}`
	}
	const sym = SYMBOLS[currency] || (currency ? `${currency} ` : '')
	return `${sym}${fmt(price)}`
}
