# Pricing Power Portfolio MVP

## Overview
A minimal viable product that transforms stock fundamentals into a **Pricing Power v2** composite score and generates optimized portfolio weights using a score²/volatility approach.

## Features
- **Simplified Scoring**: Economics (ROIC, FCF, Growth) + Pricing Power scores
- **Basic Optimization**: Weight = Score²/Volatility with 5% position cap
- **20-Stock Universe**: Tech, Consumer, Finance, Healthcare sectors
- **Web Interface**: Score table, portfolio pie chart, rebalance trigger
- **Real-time Data**: Yahoo Finance + Alpha Vantage integration

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 16+
- Git

### Installation & Running

#### Option 1: Automated (Recommended)
```bash
# Run both backend and frontend
./start-mvp.sh
```

#### Option 2: Manual Setup

**Backend Setup:**
```bash
cd backend
pip install -r requirements.txt
python main.py
# API will run on http://localhost:8000
# API docs at http://localhost:8000/docs
```

**Frontend Setup:**
```bash
# In a new terminal
npm install
npm start
# UI will open at http://localhost:3000
```

## Usage

1. **Start the Application**
   - Run `./start-mvp.sh` or follow manual setup
   - Wait for both servers to start

2. **Initial Rebalance**
   - Navigate to http://localhost:3000
   - Click "Rebalance" tab
   - Click "Run Rebalance" button
   - Wait 30-60 seconds for data processing

3. **View Results**
   - **Stock Scores Tab**: See all stocks with Economics/Pricing Power scores
   - **Portfolio Tab**: View optimized weights as pie chart
   - **Rebalance Tab**: Trigger new portfolio optimization

## API Endpoints

- `GET /scores` - Get all stock scores
- `GET /portfolio` - Get current portfolio weights  
- `POST /rebalance` - Trigger portfolio rebalance
- `GET /health` - API health check
- `GET /docs` - Interactive API documentation

## Test Universe (20 Stocks)

**Tech**: MSFT, GOOGL, META, CRM, ADBE  
**Consumer**: AMZN, NFLX, NKE, SBUX, MCD  
**Finance**: V, MA, JPM, GS, BRK-B  
**Healthcare**: UNH, JNJ, PFE, TMO, ABT

## Scoring Logic

### Economics Score (60% weight)
- ROIC (Return on Invested Capital)
- FCF Margin (Free Cash Flow / Revenue)
- Revenue Growth Rate
- Penalty: -20 points for negative FCF

### Pricing Power Score (40% weight)
- Gross Margin level and stability
- Revenue growth with margin preservation
- Calculated as pricing leverage indicator

### Final Score
`Final = 0.6 × Economics + 0.4 × Pricing Power`

## Portfolio Optimization

```python
weight = (score^2) / volatility
# Apply 5% position cap
# Normalize to 100%
```

## File Structure
```
mvp/
├── backend/
│   ├── main.py         # FastAPI application
│   ├── database.py     # SQLite models
│   ├── providers.py    # Data fetching
│   ├── scoring.py      # Score calculation
│   └── optimizer.py    # Portfolio weights
├── src/
│   ├── components/
│   │   ├── Dashboard.js
│   │   ├── ScoreTable.js
│   │   ├── PortfolioPie.js
│   │   └── RebalancePanel.js
│   └── services/
│       └── portfolioApi.js
├── data/
│   └── portfolio.db    # SQLite database
└── config.yaml         # Configuration

```

## Troubleshooting

**Backend won't start:**
- Check Python version: `python3 --version` (needs 3.11+)
- Install dependencies: `pip install -r backend/requirements.txt`
- Check port 8000 is free: `lsof -i :8000`

**Frontend won't start:**
- Check Node version: `node --version` (needs 16+)
- Clear cache: `rm -rf node_modules package-lock.json && npm install`
- Check port 3000 is free: `lsof -i :3000`

**No data showing:**
- Click "Run Rebalance" first to populate data
- Check API health: http://localhost:8000/health
- Check browser console for errors

**Rebalance fails:**
- Yahoo Finance rate limits: wait 1 minute and retry
- Check internet connection
- Try with fewer stocks initially

## Development

**Run Backend Tests:**
```bash
cd backend
python -m pytest
```

**Run Frontend Tests:**
```bash
npm test
```

**Database Reset:**
```bash
rm data/portfolio.db
# Restart backend to recreate
```

## Next Steps (Full Version)

After MVP validation, the full system will add:
- [ ] PostgreSQL database
- [ ] 4-pillar scoring (Economics, PPI, Durability, Moat)
- [ ] Business model templates
- [ ] Sector constraints
- [ ] Covariance-based risk model
- [ ] Scheduled quarterly rebalancing
- [ ] Historical backtesting
- [ ] Factor exposures
- [ ] Authentication

## Performance

- Rebalance time: ~30-60 seconds for 20 stocks
- API response: <200ms (cached)
- Database: SQLite (adequate for <100 stocks)

## License
MIT

---
*MVP Version: 0.1.0*  
*Last Updated: 2025-08-12*