# Stock Portfolio Tracker

> **Note**: This application was scaffolded from a single AI prompt and currently works with mock performance data only. Portfolio allocation is calculated from your actual stock data, but performance charts display simulated historical data at this moment in time.

A Vue.js web application for tracking stock portfolio growth and diversification by sector, inspired by sovereign wealth fund principles. The application prioritises privacy: it never shows total portfolio value. Showing dividend amounts in £ is optional and off by default.

## Features

-  **Sector Diversification Visualization**: Interactive pie chart with detailed stock breakdowns on hover
-  **Performance Tracking**: Historical growth tracking with selectable time periods (1M, 1Y, YTD, 5Y)
-  **Performance Yearly Growth**: Annual portfolio growth analysis
-  **Dividend Tracking**: Annual dividend summaries with trend analysis, shown as percentages or (optionally) £ amounts with monthly/daily averages
-  **Dividend Yield per Holding**: Current yield % and yield on cost % per stock, colour-coded with directional indicators
-  **Privacy-First Design**: Total portfolio value is never displayed; dividend £ amounts are optional
-  **Responsive Design**: Works seamlessly across desktop, tablet, and mobile devices
-  **Secure Data Handling**: Personal portfolio data excluded from git commits
-  **Unit Tested**: Comprehensive test coverage for core functionality

## Architecture

- **Frontend**: Vue.js 3 with Vite, Chart.js with data labels plugin
- **Backend**: Node.js with Express, RESTful API endpoints
- **Testing**: Jest (server) and Vitest (client) with unit test coverage

For the data flow, currency handling and privacy boundary, see [docs/architecture.md](docs/architecture.md).

## Data Storage

- **Stock Data**: JSON file (`data/portfolio.json`) for portfolio information (git-ignored)
- **Template**: `data/portfolio.template.json` for setup reference (committed)
- **Performance Data**: Mock data in `data/performance.js` (committed)
- **Configuration**: Environment variables (.env file) for server settings

## Setup Instructions

### 1. Install Dependencies

```bash
npm run install-all
```

### 2. Configure Stock Data

Copy the template and add your personal stock data:

```bash
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
      "currentPrice": 180.50,
      "annualDividend": 220.24,
      "sector": "Technology"
    }
  ],
  "dividends": {
    "2022": 1200.50,
    "2023": 1350.75,
    "2024": 1500.00
  },
  "growth": {
    "2022": -17.14,
    "2023": 30.68,
    "2024": -17.76
  }
}
```

**Supported Sectors**: Technology, Healthcare, Financial, Energy, Consumer, Industrial, Utilities, Materials

> **Dividend fields**: Only include `annualDividend` on stocks that pay a dividend. This should be the **total pounds received** for that holding in the year, not a per-share figure. Stocks without this field are excluded from the yield table automatically.

> **Dividend amounts**: By default dividends are shown only as percentages (share of dividends per holding, and each year as a % of the first year), and the API does not send £ amounts at all. To show £ amounts, set `SHOW_DIVIDEND_VALUES=true` in `.env` and restart the server. The dividend section then gets a £ / % toggle, and the monthly/daily averages chart appears in £ mode.

> **UK stocks (LSE)**: Symbols ending in `.l` are automatically detected as priced in pence. Both current yield and yield on cost are adjusted accordingly — no manual conversion needed.

### 3. Start the Application

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### 4. Build and Deploy for Production

The production build compiles **only the frontend**. The Express API is plain
Node.js and does not need a separate build step. Deploy the frontend and API
as separate services, or host them on the same machine with a web server that
serves the frontend and proxies `/api` requests to the API.

#### Build the frontend

From the project root, install dependencies and create the production build:

```bash
npm ci
npm ci --prefix client
npm run build
```

The static site is generated in `client/dist/`. Copy the **contents** of this
directory (including `index.html` and `assets/`) to the document root used by
your web server or static hosting provider. Do not deploy the `client/src/`
directory as the production site.

#### Deploy the API

Copy these files and directories to the API server, keeping their relative
layout:

```text
package.json
package-lock.json
server/
  index.js
  priceService.js
data/
  performance.js
  portfolio.json
```

`data/portfolio.json` contains private portfolio data and is excluded from
Git. Transfer it securely and ensure it is present on the server; the API
cannot load the portfolio without it. Do not copy `node_modules/` from your
development machine.

On the API server, from the directory containing `package.json`, install
production dependencies and start the API:

```bash
npm ci --omit=dev
NODE_ENV=production PORT=3001 node server/index.js
```

Set `NODE_ENV` and `PORT` in your process manager or hosting platform for
persistent deployments. Keep the process running with a service manager such
as systemd or PM2, and allow the web server to reach the configured API port.
The API does not serve the built frontend itself.

#### Configure web-server routing

Configure the web server to:

1. Serve the files copied from `client/dist/` for website requests.
2. Forward requests under `/api/` to the running Node.js API (for example,
   `http://127.0.0.1:3001`).

The frontend calls the API using same-origin `/api/...` paths. The `/api`
proxy in `client/vite.config.js` is for the local development server only; it
does not configure production routing. This setup expects the frontend and API
to share a domain. Hosting them on different domains requires changing the
frontend API URL and configuring cross-origin access before building.

#### Deploying updates

After changing frontend code, run `npm run build` again and replace the
deployed frontend files. After changing API code, deploy the changed server
files and restart the Node.js process. `data/portfolio.json` is read for each
request, so portfolio-data edits do not require an API restart; live quotes
are cached for up to one hour unless refreshed through the API.

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
  "dividendIndex": {
    "2020": 100,
    "2021": 110.44,
    "2022": 113.66,
    "2023": 126.42,
    "2024": 132
  },
  "growth": {
    "2022": -17.14,
    "2023": 30.68,
    "2024": -17.76
  },
  "dividendYields": [
    { "symbol": "XOM", "dividendShare": 52.54, "yield": 4.24, "yieldOnCost": 5.1 },
    { "symbol": "JNJ", "dividendShare": 47.46, "yield": 5.59, "yieldOnCost": 6.2 }
  ],
  "config": { "showDividendValues": false },
  "stockCount": 10,
  "diversification": 3
}
```

With `SHOW_DIVIDEND_VALUES=true`, the response also includes `dividends` (£ totals per year) and `annualDividend` / `previousAnnualDividend` on each `dividendYields` row.

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

### PerformanceChart.vue (Currently disabled)
**Purpose**: Line chart displaying portfolio growth over selectable time periods
- **Props**: `data` (Object) - Time-series data with labels and values
- **Features**: 
  - Smooth line curves with area fill
  - Data point labels showing percentages
  - Time period selector (1M, 1Y, YTD, 5Y)
  - Responsive design

### TotalGrowth.vue
**Purpose**: Line chart displaying portfolio growth over time
- **Props**: `growth` (Object) - Yearly growth percentage data
- **Features**: 
  - Smooth line curves with area fill
  - Data point labels showing percentages
  - Responsive design

### DividendSummary.vue
**Purpose**: Bar chart of annual dividends (as £ totals or as a % of the first year) plus a yield-per-holding table
- **Props**: 
  - `dividends` (Object) - Yearly dividend £ totals (only sent when `SHOW_DIVIDEND_VALUES=true`)
  - `dividendIndex` (Object) - Yearly dividends as a % of the first year
  - `dividendYields` (Array) - Per-stock `{ symbol, dividendShare, yield, yieldOnCost }`, plus `annualDividend` when £ values are on
  - `showDividendValues` (Boolean) - Whether the £ / % toggle is offered
  - `mode` (String, `v-model:mode`) - `'value'` or `'percent'`
- **Features**: 
  - Interactive bar chart with data labels
  - Total dividend calculation (£ mode) or year-on-year growth (% mode)
  - Yield per holding table sorted highest to lowest, colour-coded: green ≥5%, amber 2–5%, grey <2%
  - Yield on Cost column showing return relative to purchase price, with ↑/↓ indicator vs current yield
  - Only dividend-paying stocks are shown

### DividendChart.vue
**Purpose**: Line chart showing dividend trends and averages (only shown in £ mode)
- **Props**: `dividends` (Object) - Yearly dividend data
- **Features**: 
  - Dual-line chart (monthly and daily averages)
  - Color-coded data labels
  - Responsive design

### App.vue
**Purpose**: Main dashboard orchestrating all components
- **Features**: 
  - Responsive grid layout
  - Data fetching with error handling
  - Time period state management
  - Dividend display mode (£ / %), remembered in `localStorage` and forced to % when `SHOW_DIVIDEND_VALUES` is off

## Yield on Cost

Yield on Cost (YoC) shows the dividend return relative to what you originally paid, rather than the current market price. A ↑ indicator means your YoC exceeds the current yield — you bought at a better price than today's buyers are getting. A ↓ means the stock has appreciated to the point where your entry price gives a lower yield than current market.

Random Example:
- **Current yield**: £220.24 / £5,982 (6034 × 99.15p) = **3.68%**
- **Yield on cost**: £220.24 / £3,834 (6034 × 63.56p) = **5.74% ↑**

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
- **Server**: API endpoints, portfolio calculations, sector details logic, dividend calculations
- **Client**: Utility functions, constants, component structure, dividend logic
- **Integration**: Portfolio data processing and validation

## Data Privacy & Security

- **No Portfolio Value**: Total portfolio value, holding values and stock quantities are never sent to the frontend
- **Optional Dividend Amounts**: £ dividend amounts are only sent when `SHOW_DIVIDEND_VALUES=true`; otherwise dividends are percentages only
- **Git Privacy**: Personal portfolio.json excluded from version control
- **Server-Side Calculations**: All sensitive computations performed on backend
- **No Tracking**: No user data collection or external analytics

## Mock Data Notice

**Performance data is currently simulated**. The application:
- ✅ Calculates real portfolio allocation from your stock data
- ✅ Shows accurate sector diversification and stock breakdowns
- ✅ Shows dividend yield and yield on cost from your actual stock data
- ✅ Uses live stock prices from Yahoo Finance (via `yahoo-finance2`), cached for an hour and falling back to the `currentPrice` in `portfolio.json` if a quote is unavailable
- ❌ Uses mock historical performance data for charts

To integrate real performance data, replace the `generatePerformance()` function in `server/index.js` with calls to your preferred stock API.

## Customization

### Adding New Stocks
Update `data/portfolio.json`. Include `annualDividend` (total £ received) only for stocks that pay one:
```json
{
  "stocks": [
    {
      "symbol": "TSLA",
      "name" : "Stock Name",
      "quantity": 50,
      "purchasePrice": 800.00,
      "currentPrice": 850.00,
      "sector": "Technology"
    },
    {
     "symbol": "JNJ",
      "name" : "Stock Name",
      "quantity": 30,
      "purchasePrice": 160.00,
      "currentPrice": 165.50,
      "sector": "Healthcare",
      "annualDividend": 4.76
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
   - Required fields: `symbol`, `quantity`, `purchasePrice`, `currentPrice`, `sector`
   - Optional field: `annualDividend` (total £ received, dividend-paying stocks only)

2. **Dividend yield table not appearing**
   - Check that at least one stock in `portfolio.json` has an `annualDividend` field greater than 0
   - Check that the stock has a `quantity`, `purchasePrice` and current price above 0, as rows without a cost basis or value are left out
   - Verify the `/api/portfolio` response includes a non-empty `dividendYields` array

3. **UK stock yields look wrong**
   - Ensure LSE symbols end in `.l` (e.g. `Lloy.l`) so pence-to-pounds conversion is applied

### Development Tips

- Use browser dev tools to inspect API responses
- Check server logs for JSON parsing errors
- Validate portfolio.json file format

## Future Enhancements

-  **Historical Data Persistence**: Store and track actual portfolio performance over time
-  **Multi-Currency**: Support for international stock markets

## Contributing

Contributions are welcome. Before opening a pull request, read:

- [docs/architecture.md](docs/architecture.md): how the API and dashboard fit together, and which file owns what
- [docs/styling.md](docs/styling.md): code style, Vue and CSS conventions, and the visual language
- [CLAUDE.md](CLAUDE.md): working rules for AI coding agents, which also apply to people (privacy rules, tests, branches and commits)

Never include real portfolio data in issues, pull requests or tests.

To report a security or privacy issue, follow [SECURITY.md](SECURITY.md) rather than opening a public issue.

## AI Development Note

🤖 This entire application was scaffolded from a single AI prompt.

## License

This project is licensed under the MIT License - see the LICENSE file for details.