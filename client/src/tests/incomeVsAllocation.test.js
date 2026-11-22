import { describe, it, expect } from 'vitest'
import { incomeVsAllocation } from '../incomeVsAllocation.js'

describe('incomeVsAllocation', () => {
	const sectors = { Tech: '50.00', Energy: '30.00', Mining: '20.00' }
	const sectorDetails = {
		Tech: [{ symbol: 'AAPL' }, { symbol: 'MSFT' }],
		Energy: [{ symbol: 'BP.L' }],
		Mining: [{ symbol: 'RIO.L' }],
	}

	it("adds up each sector's share of dividends next to its share of the portfolio", () => {
		const rows = incomeVsAllocation(sectors, sectorDetails, [
			{ symbol: 'AAPL', dividendShare: 10 },
			{ symbol: 'MSFT', dividendShare: 15 },
			{ symbol: 'BP.L', dividendShare: 75 },
		])

		expect(rows).toEqual([
			{ sector: 'Energy', allocation: 30, income: 75 },
			{ sector: 'Tech', allocation: 50, income: 25 },
			{ sector: 'Mining', allocation: 20, income: 0 },
		])
	})

	it('ignores dividend payers with no sector, as they have no allocation', () => {
		const rows = incomeVsAllocation(sectors, sectorDetails, [
			{ symbol: 'BP.L', dividendShare: 80 },
			{ symbol: 'UNKNOWN', dividendShare: 20 },
		])

		expect(rows.find((row) => row.sector === 'Energy').income).toBe(80)
		expect(rows.map((row) => row.sector)).not.toContain(undefined)
	})

	it('returns nothing before the portfolio has loaded', () => {
		expect(incomeVsAllocation()).toEqual([])
		expect(incomeVsAllocation(undefined, undefined, undefined)).toEqual([])
	})
})
