const mockQuote = jest.fn();

jest.mock('yahoo-finance2', () => ({
	__esModule: true,
	default: jest.fn().mockImplementation(() => ({ quote: mockQuote })),
}));

const quoteFor = (sym) => ({ regularMarketPrice: 100, currency: 'USD', shortName: sym });

const loadService = () => {
	let service;
	jest.isolateModules(() => {
		service = require('../server/priceService');
	});
	return service;
};

beforeEach(() => {
	mockQuote.mockReset();
	jest.spyOn(console, 'log').mockImplementation(() => {});
	jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('getPrices', () => {
	test('fetches symbols not covered by an in-flight fetch', async () => {
		let release;
		const gate = new Promise((resolve) => {
			release = resolve;
		});
		mockQuote.mockImplementation(async (sym) => {
			if (sym === 'AAPL') {
				await gate;
			}
			return quoteFor(sym);
		});
		const { getPrices } = loadService();

		const first = getPrices(['AAPL']);
		const second = getPrices(['AAPL', 'MSFT']);
		release();
		await first;
		const prices = await second;

		expect(prices.AAPL.price).toBe(100);
		expect(prices.MSFT.price).toBe(100);
	});
});

describe('failed quotes', () => {
	test('are retried on the next call instead of cached for the TTL', async () => {
		mockQuote
			.mockRejectedValueOnce(new Error('upstream down'))
			.mockResolvedValueOnce(quoteFor('AAPL'));
		const { getPrices } = loadService();

		const first = await getPrices(['AAPL']);
		expect(first.AAPL).toBeNull();

		const second = await getPrices(['AAPL']);
		expect(second.AAPL.price).toBe(100);
		expect(mockQuote).toHaveBeenCalledTimes(2);
	});
});
