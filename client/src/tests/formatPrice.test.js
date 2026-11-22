import { describe, it, expect } from 'vitest'
import { formatPrice } from '../formatPrice.js'

describe('formatPrice', () => {
	it('shows a dash for a missing price', () => {
		expect(formatPrice(null, 'USD')).toBe('–')
		expect(formatPrice(undefined, 'GBP')).toBe('–')
	})

	it('converts pence (GBp) to pounds', () => {
		expect(formatPrice(180, 'GBp')).toBe('£1.8')
		expect(formatPrice(99.15, 'GBp')).toBe('£0.9915')
	})

	it('leaves pound (GBP) prices as they are', () => {
		expect(formatPrice(1.8, 'GBP')).toBe('£1.8')
		expect(formatPrice(12.34, 'GBP')).toBe('£12.34')
	})

	it('uses the symbol of a foreign currency', () => {
		expect(formatPrice(150, 'USD')).toBe('$150')
		expect(formatPrice(80.5, 'EUR')).toBe('€80.5')
	})

	it('falls back to the currency code when there is no symbol', () => {
		expect(formatPrice(12.5, 'CHF')).toBe('CHF 12.5')
	})

	it('shows the bare number when the currency is missing', () => {
		expect(formatPrice(12.5)).toBe('12.5')
		expect(formatPrice(12.5, '')).toBe('12.5')
	})
})
