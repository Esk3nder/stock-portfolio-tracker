# Eight Pillars Elite Stock Screener

A sophisticated React application for screening and analyzing stocks using the Eight Pillars Framework - a systematic approach to identifying elite compounding equities.

## Features

- 🎯 **Eight Pillars Framework**: Comprehensive stock analysis across 8 critical dimensions
- 🔍 **Smart Screening**: Batch analyze multiple stocks simultaneously
- 📊 **Visual Analytics**: Interactive charts and dashboards for analysis results
- 💼 **Portfolio Management**: Track and optimize holdings based on Eight Pillars scores
- 📈 **Real-time Data**: Integration with Financial Modeling Prep for comprehensive financials
- 📚 **Framework Guide**: Built-in documentation and methodology explanation
- 💾 **Persistent Storage**: Save screening results and portfolio data
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile

## Getting Started

1. Clone and navigate to the project:
```bash
cd stock-portfolio-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## API Configuration

The app requires a Financial Modeling Prep (FMP) API key for comprehensive financial data:

1. **Get an API Key**: Sign up at [Financial Modeling Prep](https://financialmodelingprep.com/developer)
   - Free tier: 250 API calls/day
   - Paid tiers: $14-299/month for higher limits

2. **Configure Environment Variables**:
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Edit .env and add your API key
   REACT_APP_FMP_API_KEY=your_fmp_api_key_here
   ```

3. **Optional Additional APIs** (for fallback/enhanced data):
   - Alpha Vantage: [Get key](https://www.alphavantage.co/support/#api-key)
   - Polygon.io: [Get key](https://polygon.io/dashboard/api-keys)

## The Eight Pillars Framework

The app analyzes stocks across eight critical dimensions:

1. **Moat Test**: ROIC > 20% - Sustainable competitive advantages
2. **Fortress Test**: Debt/EBITDA < 2.5x - Financial strength
3. **Engine Test**: Revenue CAGR > 10% - Growth momentum
4. **Efficiency Test**: Rule of 40 > 40% - Balance of growth and profitability
5. **Pricing Power Test**: High gross margins - Competitive differentiation
6. **Capital Allocation Test**: ROE improvement + disciplined buybacks
7. **Cash Generation Test**: FCF margin > 15% + conversion > 80%
8. **Durability Test**: Growing market share in expanding TAMs

## Usage Notes

- **API Rate Limits**: FMP free tier allows 250 calls/day
- **Batch Analysis**: Screen multiple stocks by entering symbols separated by commas
- **Data Persistence**: Screening results and portfolio data saved in localStorage
- **Real-time Updates**: Financial data refreshed on each analysis request

## Tech Stack

- React 18
- Axios for API calls
- Recharts for data visualization
- CSS Grid for responsive layout
- localStorage for data persistence

## Project Structure

```
src/
├── components/        # React components
│   ├── StockSearch.js    # Stock search functionality
│   ├── StockCard.js      # Individual stock display
│   └── PortfolioSummary.js # Portfolio overview
├── services/         # API services
│   └── stockService.js   # Alpha Vantage API integration
├── hooks/           # Custom React hooks
│   └── usePortfolio.js   # Portfolio state management
└── config/          # Configuration files
    └── api.js           # API settings
```

## Available Scripts

- `npm start` - Run development server
- `npm test` - Run tests
- `npm run build` - Build for production
- `npm run eject` - Eject from Create React App