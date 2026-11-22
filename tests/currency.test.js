const { buildPortfolio } = require('../server');

const stocks = [
	{
		symbol: 'AAPL',
		quantity: 10,
		purchasePrice: 50,
		currentPrice: 100,
		sector: 'Tech',
		annualDividend: 10,
	},
	{ symbol: 'LLOY.L', quantity: 1000, purchasePrice: 20, currentPrice: 20, sector: 'Banks' },
];
const live = {
	AAPL: { price: 100, currency: 'USD' },
	'LLOY.L': { price: 20, currency: 'GBp' },
};

describe('currency conversion', () => {
	test('converts holdings to GBP before totalling', () => {
		const result = buildPortfolio({ stocks }, live, { USD: 0.8 });

		// AAPL $1,000 → £800, LLOY.L £200
		expect(result.baseCurrency).toBe('GBP');
		expect(result.sectors).toEqual({ Tech: '80.00', Banks: '20.00' });
		expect(result.portfolioDividendYield).toBeCloseTo((10 / 1000) * 100);
		// cost: AAPL $500 → £400, LLOY.L £200
		expect(result.portfolioYieldOnCost).toBeCloseTo((10 / 600) * 100);
		expect(result.fxRates).toEqual({ USD: 0.8 });
		expect(result.currencyConverted).toBe(true);
		expect(result.unconvertedSymbols).toEqual([]);
	});

	test('keeps native prices in the sector detail', () => {
		const result = buildPortfolio({ stocks }, live, { USD: 0.8 });
		const aapl = result.sectorDetails.Tech[0];
		expect(aapl.currentPrice).toBe(100);
		expect(aapl.currency).toBe('USD');
	});

	test('leaves holdings without a rate out of the totals and lists them', () => {
		const result = buildPortfolio({ stocks }, live, {});

		expect(result.unconvertedSymbols).toEqual(['AAPL']);
		expect(result.sectors).toEqual({ Banks: '100.00' });
		expect(result.currencyConverted).toBe(false);
	});

	test('works out per-holding dividend yields on GBP values', () => {
		const result = buildPortfolio({ stocks }, live, { USD: 0.8 });
		const aapl = result.dividendYields.find((row) => row.symbol === 'AAPL');

		// £10 dividend on £800 value (from $1,000) and £400 cost (from $500)
		expect(aapl.yield).toBeCloseTo((10 / 800) * 100);
		expect(aapl.yieldOnCost).toBeCloseTo((10 / 400) * 100);
	});

	test('leaves holdings without a rate out of the dividend yields', () => {
		const result = buildPortfolio({ stocks }, live, {});

		expect(result.dividendYields.map((row) => row.symbol)).not.toContain('AAPL');
		expect(result.unconvertedSymbols).toEqual(['AAPL']);
	});

	test('an all-GBP portfolio needs no rates', () => {
		const result = buildPortfolio({ stocks: [stocks[1]] }, live);
		expect(result.sectors).toEqual({ Banks: '100.00' });
		expect(result.currencyConverted).toBe(false);
	});
});
