const mockQuote = jest.fn();

jest.mock('yahoo-finance2', () => ({
	__esModule: true,
	default: jest.fn().mockImplementation(() => ({ quote: mockQuote })),
}));

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

describe('getFxRates', () => {
	test('fetches a GBP rate for each foreign currency', async () => {
		mockQuote.mockImplementation(async (sym) => ({
			regularMarketPrice: sym === 'USDGBP=X' ? 0.79 : 0.85,
		}));
		const { getFxRates } = loadService();

		const rates = await getFxRates(['USD', 'EUR', 'GBP', 'USD']);

		expect(rates).toEqual({ USD: 0.79, EUR: 0.85 });
		expect(mockQuote).toHaveBeenCalledTimes(2);
	});

	test('omits a currency whose rate is unavailable', async () => {
		mockQuote.mockRejectedValue(new Error('no such symbol'));
		const { getFxRates } = loadService();

		expect(await getFxRates(['USD'])).toEqual({});
	});
});
