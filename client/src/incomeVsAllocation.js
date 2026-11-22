// Compares each sector's share of dividend income with its share of the portfolio,
// using only the percentages the API already sends.
export function incomeVsAllocation(sectors = {}, sectorDetails = {}, dividendYields = []) {
	const sectorBySymbol = {}
	Object.entries(sectorDetails).forEach(([sector, holdings]) => {
		holdings.forEach((holding) => {
			sectorBySymbol[holding.symbol] = sector
		})
	})

	const incomeBySector = {}
	dividendYields.forEach((holding) => {
		const sector = sectorBySymbol[holding.symbol]
		// A dividend payer missing from the sector breakdown was left out of the
		// portfolio totals (no exchange rate), so it has no allocation to compare with.
		if (!sector) {
			return
		}
		incomeBySector[sector] = (incomeBySector[sector] || 0) + (Number(holding.dividendShare) || 0)
	})

	return Object.entries(sectors)
		.map(([sector, allocation]) => ({
			sector,
			allocation: Number(allocation) || 0,
			income: incomeBySector[sector] || 0,
		}))
		.sort((a, b) => b.income - a.income || b.allocation - a.allocation)
}
