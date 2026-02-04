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

  test('dividend calculations work correctly', () => {
    const dividends = {
      '2022': 1200,
      '2023': 1800,
      '2024': 2400
    };
    
    const monthlyAverages = Object.keys(dividends).map(year => 
      (dividends[year] / 12).toFixed(2)
    );
    const dailyAverages = Object.keys(dividends).map(year => 
      (dividends[year] / 365).toFixed(2)
    );
    
    expect(monthlyAverages).toEqual(['100.00', '150.00', '200.00']);
    expect(dailyAverages[0]).toBe('3.29'); // 1200/365
    expect(dailyAverages[1]).toBe('4.93'); // 1800/365
  });
});