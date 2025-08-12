# Pricing-Power Portfolio MVP - Rapid Build Plan

## MVP Scope (1-2 weeks)
Minimal working system with simplified scoring, basic optimization, and web interface.

## Core Features Only

### 1. Data Layer (Day 1-2)
- [ ] Single provider: Alpha Vantage (existing) + Yahoo Finance fallback
- [ ] SQLite database (no PostgreSQL for MVP)
- [ ] 4 tables only: securities, fundamentals, prices, scores
- [ ] Manual ticker list (20-50 stocks to start)

### 2. Simplified Scoring (Day 3-4)
- [ ] 2 pillars only:
  - **Economics**: ROIC, FCF margin, Revenue growth
  - **Pricing Power**: Basic gross margin trend + revenue/unit analysis
- [ ] Simple 0-100 scoring (percentile-based)
- [ ] No business model templates
- [ ] Basic penalties: negative FCF (-20 points)

### 3. Basic Optimizer (Day 5)
- [ ] Simple rule: `weight = score² / volatility`
- [ ] Max position: 5%
- [ ] Normalize to 100%
- [ ] No sector constraints, no covariance

### 4. Minimal API (Day 6)
- [ ] FastAPI with 3 endpoints:
  - `GET /scores` - all stock scores
  - `GET /portfolio` - current weights
  - `POST /rebalance` - trigger rebalance
- [ ] No authentication for MVP

### 5. Simple Frontend (Day 7-8)
- [ ] Enhance existing React app
- [ ] 3 views:
  - Score table (sortable)
  - Portfolio pie chart
  - Rebalance button + last run time

## Tech Stack (Simplified)

```
Backend:
- Python 3.11
- FastAPI
- SQLite
- pandas, numpy, yfinance
- No Celery, no Redis

Frontend:
- Existing React app
- Recharts for charts
- Axios for API calls
```

## File Structure (MVP)

```
mvp/
├── backend/
│   ├── main.py          # FastAPI app
│   ├── database.py      # SQLite setup
│   ├── providers.py     # Data fetching
│   ├── scoring.py       # Score calculation
│   ├── optimizer.py     # Weight calculation
│   └── models.py        # Pydantic models
├── frontend/
│   └── [existing React structure]
├── data/
│   └── portfolio.db     # SQLite database
└── config.yaml          # Settings
```

## Implementation Steps

### Day 1: Setup
```python
# 1. Initialize backend
pip install fastapi sqlalchemy pandas yfinance numpy

# 2. Create SQLite schema
CREATE TABLE securities (
    ticker TEXT PRIMARY KEY,
    name TEXT,
    sector TEXT
);

CREATE TABLE fundamentals (
    ticker TEXT,
    date TEXT,
    revenue REAL,
    fcf REAL,
    roic REAL,
    gross_margin REAL
);

CREATE TABLE prices (
    ticker TEXT,
    date TEXT,
    close REAL,
    returns REAL
);

CREATE TABLE scores (
    ticker TEXT,
    run_date TEXT,
    economics REAL,
    pricing_power REAL,
    final_score REAL,
    weight REAL
);
```

### Day 2: Data Fetching
```python
# providers.py
def fetch_fundamentals(tickers):
    # Use yfinance for basics
    # Alpha Vantage for detailed metrics
    pass

def fetch_prices(tickers):
    # 1 year of daily prices
    pass

def calculate_volatility(returns):
    # Simple standard deviation
    pass
```

### Day 3-4: Scoring Engine
```python
# scoring.py
def calculate_scores(ticker_data):
    # Economics: avg(ROIC, FCF_margin, Rev_growth)
    # Pricing: avg(GM_trend, Rev_per_unit)
    # Final: 0.6*Econ + 0.4*Pricing
    pass
```

### Day 5: Optimizer
```python
# optimizer.py
def optimize_portfolio(scores, volatilities):
    weights = {}
    for ticker in scores:
        raw_weight = (scores[ticker]**2) / volatilities[ticker]
        weights[ticker] = min(raw_weight, 0.05)  # 5% cap
    
    # Normalize to 100%
    total = sum(weights.values())
    return {t: w/total for t, w in weights.items()}
```

### Day 6: API
```python
# main.py
@app.get("/scores")
def get_scores():
    return {"scores": fetch_latest_scores()}

@app.get("/portfolio")
def get_portfolio():
    return {"weights": fetch_latest_weights()}

@app.post("/rebalance")
def trigger_rebalance():
    # Run pipeline
    data = fetch_all_data()
    scores = calculate_scores(data)
    weights = optimize_portfolio(scores, data.volatilities)
    save_results(scores, weights)
    return {"status": "success", "timestamp": datetime.now()}
```

### Day 7-8: Frontend Integration
```javascript
// New components
<ScoreTable />    // Display scores with sorting
<PortfolioPie />   // Recharts pie of weights
<RebalancePanel /> // Button + status

// API service
const api = {
  getScores: () => axios.get('/api/scores'),
  getPortfolio: () => axios.get('/api/portfolio'),
  rebalance: () => axios.post('/api/rebalance')
}
```

## Test Universe (20 stocks)
```yaml
tickers:
  tech: [MSFT, GOOGL, META, CRM, ADBE]
  consumer: [AMZN, NFLX, NKE, SBUX, MCD]
  finance: [V, MA, JPM, GS, BRK-B]
  healthcare: [UNH, JNJ, PFE, TMO, ABT]
```

## Success Criteria (MVP)
- [ ] Fetches data for 20+ stocks
- [ ] Calculates scores 0-100
- [ ] Generates portfolio weights
- [ ] Display results in React UI
- [ ] Manual rebalance trigger works
- [ ] Full cycle < 60 seconds

## What's Excluded (Add Later)
- Authentication
- Scheduled jobs
- Complex pillars (PPI components)
- Business model templates
- Sector constraints
- Covariance/risk models
- Historical backtesting
- Report generation
- PostgreSQL
- Redis/Celery

## Next Steps After MVP
1. Add more sophisticated scoring
2. Implement proper risk model
3. Add PostgreSQL for scale
4. Build scheduling system
5. Enhance UI with analytics

## Estimated Timeline
- **Day 1-2**: Backend setup + data layer
- **Day 3-4**: Scoring engine
- **Day 5**: Optimizer
- **Day 6**: API endpoints
- **Day 7-8**: Frontend integration
- **Day 9-10**: Testing + polish

**Total: 10 days for working MVP**

---
*MVP Version: 0.1.0*
*Full Version Target: 2.0.0*