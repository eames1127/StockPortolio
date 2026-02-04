# Stock Portfolio Tracker

> **Note**: This application was scaffolded from a single AI prompt and currently works with mock performance data only. Portfolio allocation is calculated from your actual stock data, but performance charts display simulated historical data at this moment in time.

A Vue.js web application for tracking stock portfolio growth and diversification by sector, inspired by sovereign wealth fund principles. The application prioritizes privacy by displaying only percentage allocations and growth rates without revealing absolute monetary values.

## Features

-  **Sector Diversification Visualization**: Interactive pie chart with detailed stock breakdowns on hover
-  **Performance Tracking**: Historical growth tracking with selectable time periods (1M, 1Y, YTD, 5Y)
-  **Privacy-First Design**: No absolute values displayed, only percentages and ratios
-  **Responsive Design**: Works seamlessly across desktop, tablet, and mobile devices
-  **Secure Data Handling**: Personal portfolio data excluded from git commits
-  **Unit Tested**: Comprehensive test coverage for core functionality

## Architecture

- **Frontend**: Vue.js 3 with Vite, Chart.js with data labels plugin
- **Backend**: Node.js with Express, RESTful API endpoints
- **Testing**: Jest (server) and Vitest (client) with unit test coverage

## Data Storage

- **Stock Data**: JSON file (`data/portfolio.json`) for portfolio information (git-ignored)
- **Template**: `data/portfolio.template.json` for setup reference (committed)
- **Performance Data**: Mock data in `data/performance.js` (committed)
- **Configuration**: Environment variables (.env file) for server settings

## Setup Instructions

### 1. Install Dependencies

```bash
# Install root dependencies
npm run install-all
```

### 2. Configure Stock Data

Copy the template and add your personal stock data:

```bash
# Copy template to create your personal portfolio file
cp data/portfolio.template.json data/portfolio.json
```

Edit `data/portfolio.json` with your stock holdings:

```json
{
  "stocks": [
    {
      "symbol": "AAPL",
      "quantity": 100,
      "purchasePrice": 150.50,
      "sector": "Technology"
    }
  ]
}
```

**Supported Sectors**: Technology, Healthcare, Financial, Energy, Consumer, Industrial, Utilities, Materials

### 3. Start the Application

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### 4. Build for Production

```bash
npm run build
```

## API Endpoints

### GET /api/portfolio
Returns portfolio allocation by sector with detailed stock breakdowns

```json
{
  "sectors": {
    "Technology": "45.50",
    "Healthcare": "25.30",
    "Financial": "29.20"
  },
  "sectorDetails": {
    "Technology": [
      { "symbol": "AAPL", "percentage": "60.00" },
      { "symbol": "MSFT", "percentage": "40.00" }
    ]
  },
  "stockCount": 10,
  "diversification": 3
}
```

### GET /api/performance?period=1Y
Returns mock historical performance data for charts

```json
{
  "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  "data": [2.1, 4.3, 1.8, 6.2, 3.9, 5.1]
}
```

**Available periods**: 1M, 1Y, YTD, 5Y

## Component Documentation

### SectorChart.vue
**Purpose**: Interactive pie chart showing portfolio allocation with detailed tooltips
- **Props**: `data` (Object) - Portfolio data with sectors and sectorDetails
- **Features**: 
  - Hover explosion effects
  - Detailed tooltips showing individual stocks within sectors
  - Percentage labels on chart slices
  - Responsive design with color-coded sectors

### PerformanceChart.vue
**Purpose**: Line chart displaying portfolio growth over selectable time periods
- **Props**: `data` (Object) - Time-series data with labels and values
- **Features**: 
  - Smooth line curves with area fill
  - Data point labels showing percentages
  - Time period selector (1M, 1Y, YTD, 5Y)
  - Responsive design

### App.vue
**Purpose**: Main dashboard orchestrating all components
- **Features**: 
  - Responsive grid layout with performance chart as hero element
  - Data fetching with error handling
  - Time period state management

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run server tests only
npm run test:server

# Run client tests only
npm run test:client
```

### Test Coverage
- **Server**: API endpoints, portfolio calculations, sector details logic
- **Client**: Utility functions, constants, component structure
- **Integration**: Portfolio data processing and validation

## Data Privacy & Security

- **No Absolute Values**: Stock quantities and prices never exposed to frontend
- **Git Privacy**: Personal portfolio.json excluded from version control
- **Server-Side Calculations**: All sensitive computations performed on backend
- **No Tracking**: No user data collection or external analytics

## Mock Data Notice

**Performance data is currently simulated**. The application:
- ✅ Calculates real portfolio allocation from your stock data
- ✅ Shows accurate sector diversification and stock breakdowns
- ❌ Uses mock historical performance data for charts
- ❌ Does not connect to live stock price APIs

To integrate real performance data, replace the `generatePerformance()` function in `server/index.js` with calls to your preferred stock API.

## Customization

### Adding New Stocks
Update the `data/portfolio.json` file:
```json
{
  "stocks": [
    {
      "symbol": "TSLA",
      "quantity": 50,
      "purchasePrice": 800.00,
      "sector": "Technology"
    }
  ]
}
```

### Modifying Chart Colors
Edit the `CHART_COLORS` constant in `client/src/constants.js`:
```javascript
export const CHART_COLORS = [
  '#FF6384', // Red
  '#36A2EB', // Blue
  '#FFCE56', // Yellow
  // Add more colors...
]
```

### Integrating Live Performance Data
Replace mock data in `data/performance.js` and update `generatePerformance()` in `server/index.js`:
1. Choose a stock API (Alpha Vantage, Yahoo Finance, etc.)
2. Replace static data with API calls
3. Update data structure to match existing format

## Troubleshooting

### Common Issues

1. **Invalid Stock Data Format**
   - Ensure JSON is valid in `data/portfolio.json`
   - Required fields: symbol, quantity, purchasePrice, sector

### Development Tips

- Use browser dev tools to inspect API responses
- Check server logs for JSON parsing errors
- Validate portfolio.json file format

## Future Enhancements

-  **Live Stock Price Integration**: Connect to real-time APIs for current performance data
-  **Historical Data Persistence**: Store and track actual portfolio performance over time
-  **Multi-Currency**: Support for international stock markets

## AI Development Note

🤖 This entire application was scaffolded from a single AI prompt.

## License

This project is licensed under the MIT License - see the LICENSE file for details.