import { describe, it, expect } from 'vitest'
import { yearOnYearGrowth } from '../yearOnYearGrowth.js'

describe('yearOnYearGrowth', () => {
	it('works out each year as a % change on the year before', () => {
		const growth = yearOnYearGrowth({ 2024: 150, 2022: 100, 2023: 125 })

		expect(Object.keys(growth)).toEqual(['2023', '2024'])
		expect(growth['2023']).toBeCloseTo(25)
		expect(growth['2024']).toBeCloseTo(20)
	})

	it('shows a fall as negative growth', () => {
		expect(yearOnYearGrowth({ 2019: 100, 2020: 10 })['2020']).toBeCloseTo(-90)
	})

	it('leaves out years with nothing the year before', () => {
		expect(yearOnYearGrowth({ 2021: 0, 2022: 100, 2023: 150 })).toEqual({ 2023: 50 })
	})

	it('returns nothing for fewer than two years', () => {
		expect(yearOnYearGrowth({ 2023: 100 })).toEqual({})
		expect(yearOnYearGrowth()).toEqual({})
	})
})
