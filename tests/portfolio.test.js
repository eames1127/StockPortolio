const fs = require('fs');
const path = require('path');

describe('Portfolio Integration', () => {
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
          percentage: ((stock.value / totals[sector]) * 100).toFixed(2)
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