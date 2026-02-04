const performanceData = require('../data/performance');

describe('Server Logic', () => {
  test('performance data has correct structure', () => {
    const data = performanceData['1Y'];
    expect(data).toHaveProperty('labels');
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.labels)).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('performance data returns correct period', () => {
    const generatePerformance = (period = '1Y') => {
      return performanceData[period] || performanceData['1Y'];
    };
    
    const result = generatePerformance('1M');
    expect(result.labels).toEqual(['Week 1', 'Week 2', 'Week 3', 'Week 4']);
  });

  test('portfolio calculation with sector details', () => {
    const mockPortfolioData = {
      stocks: [
        { symbol: 'AAPL', quantity: 100, purchasePrice: 150, sector: 'Technology' },
        { symbol: 'MSFT', quantity: 50, purchasePrice: 200, sector: 'Technology' },
        { symbol: 'JNJ', quantity: 75, purchasePrice: 160, sector: 'Healthcare' }
      ]
    };
    
    const totals = {};
    const stocksBySector = {};
    let totalValue = 0;

    mockPortfolioData.stocks.forEach(stock => {
      const value = stock.quantity * stock.purchasePrice;
      totals[stock.sector] = (totals[stock.sector] || 0) + value;
      
      if (!stocksBySector[stock.sector]) {
        stocksBySector[stock.sector] = [];
      }
      stocksBySector[stock.sector].push({
        symbol: stock.symbol,
        value: value
      });
      
      totalValue += value;
    });

    const sectorDetails = {};
    Object.keys(totals).forEach(sector => {
      sectorDetails[sector] = stocksBySector[sector].map(stock => ({
        symbol: stock.symbol,
        percentage: ((stock.value / totals[sector]) * 100).toFixed(2)
      }));
    });

    expect(sectorDetails.Technology).toHaveLength(2);
    expect(sectorDetails.Technology[0].symbol).toBe('AAPL');
    expect(sectorDetails.Technology[0].percentage).toBe('60.00');
    expect(sectorDetails.Healthcare).toHaveLength(1);
    expect(sectorDetails.Healthcare[0].percentage).toBe('100.00');
  });
});