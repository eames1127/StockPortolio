// Growth is a ratio between years, so a % index gives the same result as £ totals.
// A year with nothing the year before has no meaningful growth, so it is left out.
export function yearOnYearGrowth(totalsByYear = {}) {
	const years = Object.keys(totalsByYear).sort((a, b) => Number(a) - Number(b))
	const growth = {}

	for (let i = 1; i < years.length; i += 1) {
		const previousTotal = Number(totalsByYear[years[i - 1]]) || 0
		const currentTotal = Number(totalsByYear[years[i]]) || 0

		if (previousTotal === 0) {
			continue
		}
		growth[years[i]] = ((currentTotal - previousTotal) / previousTotal) * 100
	}

	return growth
}
