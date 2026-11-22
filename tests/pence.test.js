const { buildPortfolio } = require('../server');

const holding = (symbol, extra = {}) => ({
  symbol, quantity: 10, purchasePrice: 100, currentPrice: 100, sector: 'Funds', ...extra
});
const detailFor = (result, symbol) =>
  result.sectorDetails.Funds.find(s => s.symbol === symbol);

describe('pence detection', () => {
  test('a GBP-quoted .L listing is not divided by 100', () => {
    const result = buildPortfolio(
      { stocks: [holding('VUSA.L')] },
      { 'VUSA.L': { price: 85, currency: 'GBP' } }
    );
    expect(detailFor(result, 'VUSA.L').currentPrice).toBe(85);
  });

  test('a GBp live quote is converted to pounds', () => {
    const result = buildPortfolio(
      { stocks: [holding('LLOY.L')] },
      { 'LLOY.L': { price: 55, currency: 'GBp' } }
    );
    const lloy = detailFor(result, 'LLOY.L');
    expect(lloy.currentPrice).toBeCloseTo(0.55);
    expect(lloy.currency).toBe('GBP');
  });

  test('stored prices for a .L ticker default to pence', () => {
    const result = buildPortfolio({ stocks: [holding('LLOY.L', { currentPrice: 55 })] });
    expect(detailFor(result, 'LLOY.L').currentPrice).toBeCloseTo(0.55);
  });

  test('a stored currency field overrides the .L default', () => {
    const result = buildPortfolio({ stocks: [holding('VUSA.L', { currentPrice: 85, currency: 'GBP' })] });
    const vusa = detailFor(result, 'VUSA.L');
    expect(vusa.currentPrice).toBe(85);
    expect(vusa.currency).toBe('GBP');
  });
});
