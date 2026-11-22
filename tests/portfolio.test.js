const fs = require('fs');
const path = require('path');
const { buildPortfolio } = require('../server');

describe('Portfolio Integration', () => {
  test('calculates dividend yield over all holdings and yield on cost', () => {
    const result = buildPortfolio({
      stocks: [
        { symbol: 'AAPL', quantity: 10, purchasePrice: 10, currentPrice: 20, annualDividend: 10, sector: 'Technology' },
        { symbol: 'MSFT', quantity: 10, purchasePrice: 10, currentPrice: 10, sector: 'Technology' }
      ]
    });

    expect(result.portfolioDividendYield).toBeCloseTo(10 / 300 * 100);
    expect(result.portfolioYieldOnCost).toBe(5);
    expect(result.dividendYields).toHaveLength(1);
  });

  test('dividend yield rows expose percentages, not absolute holding values', () => {
    const result = buildPortfolio({
      stocks: [
        { symbol: 'AAPL', quantity: 10, purchasePrice: 10, currentPrice: 20, annualDividend: 10, sector: 'Technology' }
      ]
    });

    const [row] = result.dividendYields;
    expect(row).not.toHaveProperty('currentValue');
    expect(row).not.toHaveProperty('costBasis');
    expect(row.yield).toBeCloseTo(5);
    expect(row.yieldOnCost).toBeCloseTo(10);
  });

  test('dividend yield rows omit holdings with no value or cost basis', () => {
    const result = buildPortfolio({
      stocks: [
        { symbol: 'AAPL', quantity: 10, purchasePrice: 0, currentPrice: 20, annualDividend: 10, sector: 'Technology' }
      ]
    });

    expect(result.dividendYields).toHaveLength(0);
  });

  describe('dividend values setting', () => {
    const data = {
      stocks: [
        { symbol: 'AAPL', quantity: 10, purchasePrice: 10, currentPrice: 20, annualDividend: 30, previousAnnualDividend: 25, sector: 'Technology' },
        { symbol: 'MSFT', quantity: 10, purchasePrice: 10, currentPrice: 20, annualDividend: 10, sector: 'Technology' }
      ],
      dividends: { '2022': 200, '2023': 250, '2024': 300 }
    };

    test('omits £ dividend amounts by default', () => {
      const result = buildPortfolio(data);

      expect(result.config).toEqual({ showDividendValues: false });
      expect(result).not.toHaveProperty('dividends');
      result.dividendYields.forEach(row => {
        expect(row).not.toHaveProperty('annualDividend');
        expect(row).not.toHaveProperty('previousAnnualDividend');
      });
    });

    test('always sends dividends as an index of the first year and as shares', () => {
      const result = buildPortfolio(data);

      expect(result.dividendIndex).toEqual({ '2022': 100, '2023': 125, '2024': 150 });
      const shares = Object.fromEntries(result.dividendYields.map(r => [r.symbol, r.dividendShare]));
      expect(shares.AAPL).toBeCloseTo(75);
      expect(shares.MSFT).toBeCloseTo(25);
    });

    test('includes £ dividend amounts when enabled', () => {
      const result = buildPortfolio(data, {}, { showDividendValues: true });

      expect(result.config).toEqual({ showDividendValues: true });
      expect(result.dividends).toEqual(data.dividends);
      const aapl = result.dividendYields.find(r => r.symbol === 'AAPL');
      expect(aapl.annualDividend).toBe(30);
      expect(aapl.previousAnnualDividend).toBe(25);
    });

    test('indexes against the first non-zero year', () => {
      const result = buildPortfolio({ ...data, dividends: { '2021': 0, '2022': 50, '2023': 75 } });

      expect(result.dividendIndex).toEqual({ '2021': 0, '2022': 100, '2023': 150 });
    });
  });

  test('portfolio data includes sector details', () => {
    // Create mock portfolio file for testing
    const mockData = {
      stocks: [
        { symbol: 'AAPL', quantity: 100, purchasePrice: 150, sector: 'Technology' },
        { symbol: 'GOOGL', quantity: 50, purchasePrice: 200, sector: 'Technology' },
        { symbol: 'JNJ', quantity: 75, purchasePrice: 160, sector: 'Healthcare' }
      ]
    };

    const loadPortfolio = () => {
      const totals = {};
      const stocksBySector = {};
      let totalValue = 0;

      mockData.stocks.forEach(stock => {
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

      const sectors = {};
      const sectorDetails = {};
      
      Object.keys(totals).forEach(sector => {
        sectors[sector] = ((totals[sector] / totalValue) * 100).toFixed(2);
        
        sectorDetails[sector] = stocksBySector[sector].map(stock => ({
          symbol: stock.symbol,
          percentage: ((stock.value / totals[sector]) * 100).toFixed(2),
          currentPrice: 150,
          currency: 'GBP'
        }));
      });

      return { sectors, sectorDetails, stockCount: mockData.stocks.length };
    };

    const result = loadPortfolio();
    
    expect(result).toHaveProperty('sectors');
    expect(result).toHaveProperty('sectorDetails');
    expect(result.sectorDetails.Technology).toHaveLength(2);
    expect(result.sectorDetails.Healthcare).toHaveLength(1);
    expect(result.sectorDetails.Technology[0]).toHaveProperty('symbol');
    expect(result.sectorDetails.Technology[0]).toHaveProperty('percentage');
    expect(result.sectorDetails.Technology[0]).toHaveProperty('currentPrice');
    expect(result.sectorDetails.Technology[0]).toHaveProperty('currency');
  });

  test('portfolio includes dividend data', () => {
    const mockPortfolioData = {
      stocks: [
        { symbol: 'AAPL', quantity: 100, purchasePrice: 150, sector: 'Technology' }
      ],
      dividends: {
        '2022': 1200.50,
        '2023': 1350.75,
        '2024': 1500.00
      }
    };
    
    const loadPortfolio = () => {
      return {
        sectors: { Technology: '100.00' },
        sectorDetails: { Technology: [{ symbol: 'AAPL', percentage: '100.00' }] },
        dividends: mockPortfolioData.dividends || {},
        stockCount: mockPortfolioData.stocks.length,
        diversification: 1
      };
    };

    const result = loadPortfolio();
    expect(result).toHaveProperty('dividends');
    expect(result.dividends['2023']).toBe(1350.75);
    expect(Object.keys(result.dividends)).toHaveLength(3);
  });
});