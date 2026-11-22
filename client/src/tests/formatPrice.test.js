import { describe, it, expect } from 'vitest'
import App from '../App.vue'

const { formatPrice } = App.methods

describe('formatPrice', () => {
	it('shows a dash for a missing price', () => {
		expect(formatPrice(null, 'USD')).toBe('–')
	})

	it('converts pence (GBp) to pounds', () => {
		expect(formatPrice(99.15, 'GBp')).toBe('£0.9915')
	})

	it('leaves pound (GBP) prices as they are', () => {
		expect(formatPrice(12.34, 'GBP')).toBe('£12.34')
	})

	it('uses the symbol of a foreign currency', () => {
		expect(formatPrice(150, 'USD')).toBe('$150')
		expect(formatPrice(80.5, 'EUR')).toBe('€80.5')
	})

	it('falls back to the currency code when there is no symbol', () => {
		expect(formatPrice(42, 'CHF')).toBe('CHF 42')
	})
})
