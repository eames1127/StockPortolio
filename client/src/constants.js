export const TIME_PERIODS = ['1M', '1Y', 'YTD', '5Y'];

export const CHART_COLORS = [
  '#FF6384',
  '#36A2EB', 
  '#FFCE56',
  '#4BC0C0',
  '#9966FF',
  '#FF9F40'
];

export const API_ENDPOINTS = {
  PORTFOLIO: '/api/portfolio',
  PERFORMANCE: '/api/performance'
};

export const DEFAULT_PERIOD = '1Y';

// CommonJS compatibility for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TIME_PERIODS, CHART_COLORS, API_ENDPOINTS, DEFAULT_PERIOD }
}