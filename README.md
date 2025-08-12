# Stock Portfolio Tracker

A React application for tracking stock portfolios with real-time data from Alpha Vantage API.

## Features

- 🔍 Search and add stocks to your portfolio
- 📊 Real-time stock price updates
- 💼 Track portfolio value and daily changes
- 📈 Set number of shares for each stock
- 🔄 Manual and automatic refresh options
- 💾 Persistent storage using localStorage
- 📱 Responsive design

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

The app uses Alpha Vantage's free API. To use your own API key:

1. Get a free API key from [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
2. Update `src/config/api.js`:
```javascript
export const API_KEY = 'your-api-key-here';
```

## Usage Notes

- **Free Tier Limitations**: 5 API calls per minute, 500 calls per day
- **Demo API Key**: The default 'demo' key only works with specific symbols (IBM, TSLA, AAPL)
- **Auto-refresh**: Updates all stocks every minute when enabled
- **Data Persistence**: Portfolio data is saved in browser's localStorage

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