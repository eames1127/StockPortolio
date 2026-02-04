const performanceData = require('../data/performance');

describe('Performance Data', () => {
  test('has correct structure for all periods', () => {
    const periods = ['1M', '1Y', 'YTD', '5Y'];
    periods.forEach(period => {
      const data = performanceData[period];
      expect(data).toHaveProperty('labels');
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.labels)).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });
  });

  test('1M period has weekly data', () => {
    const data = performanceData['1M'];
    expect(data.labels).toHaveLength(4);
    expect(data.labels[0]).toBe('Week 1');
  });
});