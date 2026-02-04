const express = require('express');
const fs = require('fs');
const path = require('path');
const performanceData = require('../data/performance');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const DEFAULT_PERIOD = '1Y';

app.use(express.json());

const loadPortfolio = () => {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/portfolio.json')));
  const totals = {};
  const stocksBySector = {};
  let totalValue = 0;

  data.stocks.forEach(stock => {
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

  return {
    sectors,
    sectorDetails,
    dividends: data.dividends || {},
    stockCount: data.stocks.length,
    diversification: Object.keys(totals).length
  };
};

const generatePerformance = (period = DEFAULT_PERIOD) => {
  return performanceData[period] || performanceData[DEFAULT_PERIOD];
};

app.get('/api/portfolio', (req, res) => {
  try {
    res.json(loadPortfolio());
  } catch (error) {
    res.status(500).json({ error: 'Failed to load portfolio' });
  }
});

app.get('/api/performance', (req, res) => {
  try {
    const period = req.query.period || DEFAULT_PERIOD;
    res.json(generatePerformance(period));
  } catch (error) {
    res.status(500).json({ error: 'Failed to load performance' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  try {
    const portfolio = loadPortfolio();
    console.log(`Loaded ${portfolio.stockCount} stocks, ${portfolio.diversification} sectors`);
  } catch (error) {
    console.error('Portfolio load failed');
  }
});