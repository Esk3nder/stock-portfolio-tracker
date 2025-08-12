# 8x8 Framework Implementation Plan

## Executive Summary
Transform the existing Pricing Power Portfolio system into the 8x8 Framework - a rules-based system that selects exactly 8 stocks based on 8 fundamental pillars, each scored 0-8 points.

## Phase 1: Backend Core - Scoring Engine (Week 1)

### 1.1 Extend Database Schema
**File:** `/backend/database.py`

Add new columns to `Fundamentals` table:
```python
# Additional metrics needed for 8x8 Framework
debt_to_ebitda = Column(Float)
ebitda = Column(Float)
total_debt = Column(Float)
revenue_3y_ago = Column(Float)
revenue_cagr_3y = Column(Float)
rule_of_40 = Column(Float)
industry_gross_margin_percentile = Column(Float)
roe = Column(Float)
fcf_multiple = Column(Float)
buyback_yield = Column(Float)
market_share = Column(Float)
market_share_trend = Column(String)  # 'gaining', 'stable', 'losing'
tam_growth_rate = Column(Float)
```

Add new `PillarScores` table:
```python
class PillarScores(Base):
    __tablename__ = 'pillar_scores'
    
    id = Column(Integer, primary_key=True)
    ticker = Column(String, ForeignKey('securities.ticker'))
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Individual pillar scores (0-8 each)
    moat_score = Column(Integer)  # ROIC
    fortress_score = Column(Integer)  # Debt/EBITDA
    engine_score = Column(Integer)  # Revenue CAGR
    efficiency_score = Column(Integer)  # Rule of 40
    pricing_power_score = Column(Integer)  # Gross Margin vs Peers
    capital_allocation_score = Column(Integer)  # ROE + Buybacks
    cash_generation_score = Column(Integer)  # FCF Margin
    durability_score = Column(Integer)  # Market Share × TAM
    
    # Aggregate scores
    total_score = Column(Integer)  # Sum of all pillars (0-64)
    is_eliminated = Column(Boolean, default=False)  # Any pillar = 0
    elimination_reason = Column(String)  # Which pillar caused elimination
```

### 1.2 Create 8x8 Scoring Module
**New File:** `/backend/scoring_8x8.py`

```python
from typing import Dict, Optional, Tuple
import numpy as np

class EightByEightScorer:
    """Implements the 8x8 Framework scoring logic"""
    
    @staticmethod
    def score_moat(roic: float) -> int:
        """Pillar 1: ROIC-based moat assessment"""
        if roic < 0.20: return 0  # Eliminated
        if roic >= 0.40: return 8
        if roic >= 0.35: return 7
        if roic >= 0.30: return 6
        if roic >= 0.25: return 5
        return 4
    
    @staticmethod
    def score_fortress(debt_to_ebitda: Optional[float]) -> int:
        """Pillar 2: Balance sheet strength"""
        if debt_to_ebitda is None or debt_to_ebitda < 0:
            return 8  # Net cash position
        if debt_to_ebitda > 2.5: return 0  # Eliminated
        if debt_to_ebitda <= 0.5: return 7
        if debt_to_ebitda <= 1.0: return 6
        if debt_to_ebitda <= 1.5: return 5
        return 4
    
    @staticmethod
    def score_engine(revenue_cagr_3y: float) -> int:
        """Pillar 3: Revenue growth engine"""
        if revenue_cagr_3y < 0.10: return 0  # Eliminated
        if revenue_cagr_3y > 0.30: return 8
        if revenue_cagr_3y >= 0.25: return 7
        if revenue_cagr_3y >= 0.20: return 6
        if revenue_cagr_3y >= 0.15: return 5
        return 4
    
    @staticmethod
    def score_efficiency(rule_of_40: float) -> int:
        """Pillar 4: Growth + profitability efficiency"""
        if rule_of_40 < 40: return 0  # Eliminated
        if rule_of_40 > 70: return 8
        if rule_of_40 >= 60: return 7
        if rule_of_40 >= 50: return 6
        if rule_of_40 >= 45: return 5
        return 4
    
    @staticmethod
    def score_pricing_power(gross_margin_percentile: float) -> int:
        """Pillar 5: Pricing power vs industry peers"""
        if gross_margin_percentile < 60: return 0  # Below top 40% - Eliminated
        if gross_margin_percentile >= 95: return 8  # Top 5%
        if gross_margin_percentile >= 90: return 7  # Top 10%
        if gross_margin_percentile >= 80: return 6  # Top 20%
        if gross_margin_percentile >= 70: return 5  # Top 30%
        return 4  # Top 40%
    
    @staticmethod
    def score_capital_allocation(roe: float, buyback_quality: str) -> int:
        """Pillar 6: Management capital allocation"""
        if roe < 0.15: return 0  # Eliminated
        if roe > 0.30 and buyback_quality == 'disciplined': return 8
        if roe > 0.25 and buyback_quality in ['disciplined', 'moderate']: return 7
        if roe > 0.20: return 6
        if roe >= 0.15 and roe <= 0.20: return 5
        return 4
    
    @staticmethod
    def score_cash_generation(fcf_margin: float) -> int:
        """Pillar 7: Free cash flow generation"""
        if fcf_margin < 0.12: return 0  # Eliminated
        if fcf_margin > 0.30: return 8
        if fcf_margin >= 0.25: return 7
        if fcf_margin >= 0.20: return 6
        if fcf_margin >= 0.15: return 5
        return 4
    
    @staticmethod
    def score_durability(market_share_trend: str, tam_growth: float) -> int:
        """Pillar 8: Competitive position durability"""
        if market_share_trend == 'losing' or tam_growth < 0: 
            return 0  # Eliminated
        
        if market_share_trend == 'gaining':
            if tam_growth > 0.20: return 8
            if tam_growth >= 0.15: return 7
            if tam_growth >= 0.10: return 5
            return 4
        
        # Stable share
        if tam_growth > 0.20: return 6
        if tam_growth >= 0.10: return 4
        return 0  # Eliminated if stable in shrinking market
    
    @classmethod
    def calculate_total_score(cls, fundamentals: Dict) -> Tuple[Dict[str, int], int, bool]:
        """Calculate all pillar scores and total"""
        scores = {
            'moat': cls.score_moat(fundamentals.get('roic', 0)),
            'fortress': cls.score_fortress(fundamentals.get('debt_to_ebitda')),
            'engine': cls.score_engine(fundamentals.get('revenue_cagr_3y', 0)),
            'efficiency': cls.score_efficiency(fundamentals.get('rule_of_40', 0)),
            'pricing_power': cls.score_pricing_power(
                fundamentals.get('industry_gross_margin_percentile', 0)
            ),
            'capital_allocation': cls.score_capital_allocation(
                fundamentals.get('roe', 0),
                fundamentals.get('buyback_quality', 'none')
            ),
            'cash_generation': cls.score_cash_generation(
                fundamentals.get('fcf_margin', 0)
            ),
            'durability': cls.score_durability(
                fundamentals.get('market_share_trend', 'stable'),
                fundamentals.get('tam_growth', 0)
            )
        }
        
        # Check for elimination (any 0 score)
        is_eliminated = any(score == 0 for score in scores.values())
        elimination_reason = None
        if is_eliminated:
            elimination_reason = [k for k, v in scores.items() if v == 0]
        
        total_score = sum(scores.values()) if not is_eliminated else 0
        
        return scores, total_score, is_eliminated, elimination_reason
```

### 1.3 Enhanced Data Provider
**Update:** `/backend/providers.py`

Add methods to fetch extended fundamentals:
```python
def fetch_extended_fundamentals(ticker: str) -> Dict:
    """Fetch all metrics required for 8x8 Framework"""
    stock = yf.Ticker(ticker)
    
    # Get financial statements
    income_stmt = stock.income_stmt
    balance_sheet = stock.balance_sheet
    cash_flow = stock.cash_flow
    
    # Calculate required metrics
    fundamentals = {
        # Existing metrics...
        
        # New metrics for 8x8
        'ebitda': calculate_ebitda(income_stmt),
        'total_debt': get_total_debt(balance_sheet),
        'debt_to_ebitda': calculate_debt_to_ebitda(balance_sheet, income_stmt),
        'revenue_3y_ago': get_revenue_3y_ago(income_stmt),
        'revenue_cagr_3y': calculate_revenue_cagr(income_stmt),
        'rule_of_40': calculate_rule_of_40(income_stmt, cash_flow),
        'roe': calculate_roe(income_stmt, balance_sheet),
        'fcf_multiple': calculate_fcf_multiple(stock),
        'buyback_yield': calculate_buyback_yield(cash_flow),
        'buyback_quality': assess_buyback_quality(cash_flow, stock)
    }
    
    # Industry comparison (requires additional data source)
    fundamentals['industry_gross_margin_percentile'] = get_industry_percentile(
        ticker, 
        fundamentals['gross_margin'],
        stock.info.get('industry')
    )
    
    # Market share and TAM (requires external data or estimates)
    fundamentals.update(estimate_market_position(ticker, stock.info))
    
    return fundamentals
```

## Phase 2: Portfolio Selection & Optimization (Week 1-2)

### 2.1 New Portfolio Optimizer
**New File:** `/backend/optimizer_8x8.py`

```python
class EightByEightOptimizer:
    """Implements strict 8x8 portfolio selection and weighting"""
    
    @staticmethod
    def select_top_8(scored_stocks: List[Dict]) -> List[Dict]:
        """Select exactly 8 highest-scoring stocks"""
        # Filter out eliminated stocks
        qualified = [s for s in scored_stocks if not s['is_eliminated']]
        
        # Must have at least 32 points to qualify
        qualified = [s for s in qualified if s['total_score'] >= 32]
        
        # Sort by total score, then by tie-breakers
        qualified.sort(key=lambda x: (
            x['total_score'],
            x['lowest_pillar_score'],  # Higher minimum score
            x['median_pillar_score'],   # Higher median score
            -x.get('p_fcf', float('inf')),  # Lower P/FCF
            x.get('fcf_absolute', 0)   # Higher absolute FCF
        ), reverse=True)
        
        # Return exactly top 8
        return qualified[:8]
    
    @staticmethod
    def calculate_weights(selected_stocks: List[Dict]) -> Dict[str, float]:
        """Calculate position weights using 8x8 formula"""
        weights = {}
        
        # Calculate points above base (30)
        points_above_base = []
        for stock in selected_stocks:
            points = stock['total_score'] - 30
            points_above_base.append((stock['ticker'], points))
        
        # Sum total points above base
        total_points = sum(p for _, p in points_above_base)
        
        # Calculate weights
        for ticker, points in points_above_base:
            weights[ticker] = points / total_points
        
        return weights
    
    @staticmethod
    def handle_tie_breakers(stock: Dict) -> Tuple:
        """Calculate tie-breaker metrics"""
        pillar_scores = [
            stock['scores']['moat'],
            stock['scores']['fortress'],
            stock['scores']['engine'],
            stock['scores']['efficiency'],
            stock['scores']['pricing_power'],
            stock['scores']['capital_allocation'],
            stock['scores']['cash_generation'],
            stock['scores']['durability']
        ]
        
        return (
            min(pillar_scores),  # Lowest pillar score
            np.median(pillar_scores),  # Median pillar score
        )
```

### 2.2 Update Main API
**Update:** `/backend/main.py`

Replace existing scoring endpoint:
```python
from scoring_8x8 import EightByEightScorer
from optimizer_8x8 import EightByEightOptimizer

@app.post("/api/rebalance-8x8")
async def rebalance_8x8(universe: str = "sp500"):
    """Execute 8x8 Framework rebalancing"""
    
    # 1. Get universe of stocks
    tickers = get_universe_tickers(universe)
    
    # 2. Score all stocks
    all_scores = []
    for ticker in tickers:
        try:
            # Fetch extended fundamentals
            fundamentals = fetch_extended_fundamentals(ticker)
            
            # Calculate 8x8 scores
            scores, total, eliminated, reason = EightByEightScorer.calculate_total_score(fundamentals)
            
            all_scores.append({
                'ticker': ticker,
                'scores': scores,
                'total_score': total,
                'is_eliminated': eliminated,
                'elimination_reason': reason,
                'fundamentals': fundamentals
            })
            
            # Save to database
            save_pillar_scores(ticker, scores, total, eliminated, reason)
            
        except Exception as e:
            logger.error(f"Error scoring {ticker}: {e}")
            continue
    
    # 3. Select top 8
    selected = EightByEightOptimizer.select_top_8(all_scores)
    
    # 4. Calculate weights
    weights = EightByEightOptimizer.calculate_weights(selected)
    
    # 5. Save portfolio
    save_portfolio_8x8(selected, weights)
    
    return {
        'portfolio': [
            {
                'ticker': stock['ticker'],
                'weight': weights[stock['ticker']],
                'total_score': stock['total_score'],
                'pillar_scores': stock['scores']
            }
            for stock in selected
        ],
        'total_scored': len(all_scores),
        'eliminated_count': sum(1 for s in all_scores if s['is_eliminated']),
        'timestamp': datetime.utcnow().isoformat()
    }

@app.get("/api/portfolio-8x8")
async def get_portfolio_8x8():
    """Get current 8x8 portfolio"""
    portfolio = get_latest_portfolio_8x8()
    return portfolio

@app.get("/api/scores-8x8")
async def get_all_scores_8x8():
    """Get all scored stocks with details"""
    scores = get_all_pillar_scores()
    return scores
```

## Phase 3: Frontend Updates (Week 2)

### 3.1 Update Dashboard Component
**Update:** `/src/components/Dashboard.js`

Add 8x8 Framework view:
```javascript
import React, { useState, useEffect } from 'react';
import { PillarScoreCard } from './PillarScoreCard';
import { PortfolioWeights } from './PortfolioWeights';
import { EliminatedStocks } from './EliminatedStocks';

const Dashboard8x8 = () => {
  const [portfolio, setPortfolio] = useState([]);
  const [allScores, setAllScores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastRebalance, setLastRebalance] = useState(null);
  
  const handleRebalance = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/rebalance-8x8', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ universe: 'sp500' })
      });
      const data = await response.json();
      setPortfolio(data.portfolio);
      setLastRebalance(new Date());
      await fetchAllScores();
    } catch (error) {
      console.error('Rebalance failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAllScores = async () => {
    const response = await fetch('/api/scores-8x8');
    const data = await response.json();
    setAllScores(data);
  };
  
  return (
    <div className="dashboard-8x8">
      <header>
        <h1>8x8 Framework Portfolio</h1>
        <div className="framework-rules">
          8 Pillars × 8 Stocks = Systematic Excellence
        </div>
      </header>
      
      <div className="control-panel">
        <button 
          onClick={handleRebalance}
          disabled={loading}
          className="rebalance-btn"
        >
          {loading ? 'Scoring Universe...' : 'Execute Quarterly Rebalance'}
        </button>
        {lastRebalance && (
          <span>Last rebalance: {lastRebalance.toLocaleString()}</span>
        )}
      </div>
      
      <div className="portfolio-grid">
        {portfolio.map((stock, index) => (
          <div key={stock.ticker} className="portfolio-card">
            <div className="rank">#{index + 1}</div>
            <h3>{stock.ticker}</h3>
            <div className="weight">{(stock.weight * 100).toFixed(1)}%</div>
            <div className="total-score">
              <span className="score-value">{stock.total_score}</span>
              <span className="score-label">/ 64</span>
            </div>
            <PillarScoreCard scores={stock.pillar_scores} />
          </div>
        ))}
      </div>
      
      <div className="detailed-scores">
        <h2>All Scored Stocks</h2>
        <ScoreTable 
          scores={allScores}
          highlightPortfolio={portfolio.map(p => p.ticker)}
        />
      </div>
      
      <div className="eliminated-section">
        <h2>Eliminated Stocks</h2>
        <EliminatedStocks 
          stocks={allScores.filter(s => s.is_eliminated)}
        />
      </div>
    </div>
  );
};
```

### 3.2 Create Pillar Visualization Components
**New File:** `/src/components/PillarScoreCard.js`

```javascript
const PillarScoreCard = ({ scores }) => {
  const pillars = [
    { key: 'moat', label: 'Moat (ROIC)', icon: '🏰' },
    { key: 'fortress', label: 'Fortress (Debt)', icon: '🛡️' },
    { key: 'engine', label: 'Engine (Growth)', icon: '🚀' },
    { key: 'efficiency', label: 'Efficiency (R40)', icon: '⚡' },
    { key: 'pricing_power', label: 'Pricing Power', icon: '💎' },
    { key: 'capital_allocation', label: 'Capital Alloc', icon: '🎯' },
    { key: 'cash_generation', label: 'Cash Gen', icon: '💰' },
    { key: 'durability', label: 'Durability', icon: '🔒' }
  ];
  
  return (
    <div className="pillar-scores">
      {pillars.map(pillar => (
        <div key={pillar.key} className="pillar-score">
          <span className="pillar-icon">{pillar.icon}</span>
          <span className="pillar-label">{pillar.label}</span>
          <ScoreBar score={scores[pillar.key]} />
        </div>
      ))}
    </div>
  );
};

const ScoreBar = ({ score }) => {
  const getScoreColor = (score) => {
    if (score === 0) return '#ff0000';  // Red for elimination
    if (score <= 4) return '#ffa500';   // Orange for minimum
    if (score <= 6) return '#ffff00';   // Yellow for good
    return '#00ff00';                   // Green for excellent
  };
  
  return (
    <div className="score-bar">
      <div 
        className="score-fill"
        style={{
          width: `${(score / 8) * 100}%`,
          backgroundColor: getScoreColor(score)
        }}
      >
        {score}
      </div>
    </div>
  );
};
```

## Phase 4: Automation & Monitoring (Week 3)

### 4.1 Quarterly Scheduler
**New File:** `/backend/scheduler.py`

```python
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime
import calendar

class QuarterlyRebalancer:
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.setup_quarterly_jobs()
    
    def setup_quarterly_jobs(self):
        """Schedule rebalancing for first Monday of each quarter"""
        # Q1: January, Q2: April, Q3: July, Q4: October
        quarter_months = [1, 4, 7, 10]
        
        for month in quarter_months:
            self.scheduler.add_job(
                func=self.execute_rebalance,
                trigger='cron',
                month=month,
                day='1-7',  # First week
                day_of_week='mon',  # Monday
                hour=9,
                minute=30,
                id=f'quarterly_rebalance_q{(month-1)//3 + 1}'
            )
    
    def execute_rebalance(self):
        """Execute quarterly rebalancing"""
        logger.info(f"Executing quarterly rebalance at {datetime.now()}")
        
        # Run the rebalancing
        result = rebalance_8x8('sp500')
        
        # Log results
        logger.info(f"Rebalance complete: {result}")
        
        # Send notifications
        self.notify_rebalance_complete(result)
    
    def start(self):
        self.scheduler.start()
```

### 4.2 Emergency Monitor
**New File:** `/backend/emergency_monitor.py`

```python
class EmergencyMonitor:
    """Monthly check for any holdings scoring 0 on any pillar"""
    
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.setup_monthly_check()
    
    def setup_monthly_check(self):
        """Check holdings on the 15th of each month"""
        self.scheduler.add_job(
            func=self.check_for_eliminations,
            trigger='cron',
            day=15,
            hour=10,
            minute=0,
            id='monthly_emergency_check'
        )
    
    def check_for_eliminations(self):
        """Check if any current holding should be eliminated"""
        portfolio = get_current_portfolio_8x8()
        
        eliminated = []
        for holding in portfolio:
            # Re-score with latest data
            fundamentals = fetch_extended_fundamentals(holding['ticker'])
            scores, total, is_eliminated, reason = EightByEightScorer.calculate_total_score(fundamentals)
            
            if is_eliminated:
                eliminated.append({
                    'ticker': holding['ticker'],
                    'reason': reason,
                    'previous_score': holding['total_score'],
                    'new_score': 0
                })
        
        if eliminated:
            self.execute_emergency_rebalance(eliminated)
    
    def execute_emergency_rebalance(self, eliminated_stocks):
        """Replace eliminated stocks immediately"""
        logger.warning(f"EMERGENCY: Stocks eliminated: {eliminated_stocks}")
        
        # Get next highest scorers
        all_scores = get_all_current_scores()
        current_portfolio = get_current_portfolio_8x8()
        
        # Remove eliminated stocks
        remaining = [s for s in current_portfolio 
                    if s['ticker'] not in [e['ticker'] for e in eliminated_stocks]]
        
        # Find replacements
        replacements_needed = 8 - len(remaining)
        candidates = [s for s in all_scores 
                     if s['ticker'] not in [r['ticker'] for r in remaining]
                     and not s['is_eliminated']]
        
        # Sort and select top replacements
        candidates.sort(key=lambda x: x['total_score'], reverse=True)
        replacements = candidates[:replacements_needed]
        
        # Create new portfolio
        new_portfolio = remaining + replacements
        
        # Recalculate weights
        weights = EightByEightOptimizer.calculate_weights(new_portfolio)
        
        # Save and notify
        save_emergency_rebalance(new_portfolio, weights, eliminated_stocks)
        notify_emergency_rebalance(eliminated_stocks, replacements)
```

## Phase 5: Testing & Validation (Week 3-4)

### 5.1 Unit Tests for Scoring Logic
**New File:** `/backend/tests/test_8x8_scoring.py`

```python
import pytest
from scoring_8x8 import EightByEightScorer

class TestEightByEightScoring:
    def test_moat_scoring(self):
        assert EightByEightScorer.score_moat(0.45) == 8
        assert EightByEightScorer.score_moat(0.35) == 7
        assert EightByEightScorer.score_moat(0.15) == 0  # Eliminated
    
    def test_total_score_calculation(self):
        fundamentals = {
            'roic': 0.35,  # 7 points
            'debt_to_ebitda': 0.5,  # 7 points
            'revenue_cagr_3y': 0.25,  # 7 points
            'rule_of_40': 60,  # 7 points
            'industry_gross_margin_percentile': 90,  # 7 points
            'roe': 0.25,  # 7 points
            'buyback_quality': 'disciplined',
            'fcf_margin': 0.25,  # 7 points
            'market_share_trend': 'gaining',
            'tam_growth': 0.15  # 7 points
        }
        
        scores, total, eliminated, reason = EightByEightScorer.calculate_total_score(fundamentals)
        assert total == 56  # 7 * 8
        assert not eliminated
    
    def test_elimination_detection(self):
        fundamentals = {
            'roic': 0.15,  # 0 points - ELIMINATED
            # ... other metrics
        }
        
        scores, total, eliminated, reason = EightByEightScorer.calculate_total_score(fundamentals)
        assert eliminated
        assert 'moat' in reason
```

### 5.2 Integration Tests
**New File:** `/backend/tests/test_8x8_integration.py`

```python
class TestEightByEightIntegration:
    def test_portfolio_selection(self):
        """Test that exactly 8 stocks are selected"""
        # Create 20 mock stocks with varying scores
        mock_stocks = create_mock_scored_stocks(20)
        
        selected = EightByEightOptimizer.select_top_8(mock_stocks)
        assert len(selected) == 8
        
        # Verify they're the highest scoring
        scores = [s['total_score'] for s in selected]
        assert scores == sorted(scores, reverse=True)
    
    def test_weight_calculation(self):
        """Test portfolio weighting formula"""
        selected = [
            {'ticker': 'A', 'total_score': 58},
            {'ticker': 'B', 'total_score': 56},
            # ... 6 more stocks
        ]
        
        weights = EightByEightOptimizer.calculate_weights(selected)
        
        # Weights should sum to 1.0
        assert abs(sum(weights.values()) - 1.0) < 0.001
        
        # Higher scores get higher weights
        assert weights['A'] > weights['B']
```

## Phase 6: Configuration & Deployment (Week 4)

### 6.1 Configuration System
**New File:** `/backend/config_8x8.py`

```python
class Config8x8:
    # Universe selection
    UNIVERSE = 'sp500'  # Options: 'sp500', 'russell1000', 'global'
    
    # Scoring thresholds
    MIN_QUALIFYING_SCORE = 32
    
    # Rebalancing schedule
    QUARTERLY_REBALANCE_ENABLED = True
    EMERGENCY_MONITOR_ENABLED = True
    
    # Position limits
    MAX_POSITIONS = 8
    MIN_POSITIONS = 8
    
    # Data sources
    PRIMARY_DATA_PROVIDER = 'yahoo_finance'
    FALLBACK_DATA_PROVIDER = 'mock_data'
    
    # Notification settings
    EMAIL_NOTIFICATIONS = True
    NOTIFICATION_RECIPIENTS = ['portfolio@example.com']
```

### 6.2 Deployment Scripts
**New File:** `/deploy_8x8.sh`

```bash
#!/bin/bash

# Database migration
echo "Running database migrations..."
python backend/migrate_to_8x8.py

# Install dependencies
echo "Installing dependencies..."
pip install -r backend/requirements_8x8.txt
npm install

# Run tests
echo "Running test suite..."
pytest backend/tests/test_8x8_*.py
npm test

# Build frontend
echo "Building frontend..."
npm run build

# Start services
echo "Starting 8x8 Framework services..."
python backend/main.py --enable-8x8 &
python backend/scheduler.py &
python backend/emergency_monitor.py &

echo "8x8 Framework deployed successfully!"
```

## Implementation Timeline

### Week 1: Core Backend
- Day 1-2: Database schema and models
- Day 3-4: 8x8 scoring engine
- Day 5: Data provider enhancements

### Week 2: Selection & Frontend
- Day 1-2: Portfolio optimizer
- Day 3-4: API endpoints
- Day 5: Frontend components

### Week 3: Automation
- Day 1-2: Quarterly scheduler
- Day 3-4: Emergency monitor
- Day 5: Notification system

### Week 4: Testing & Deployment
- Day 1-2: Unit tests
- Day 3: Integration tests
- Day 4: Configuration
- Day 5: Deployment

## Success Criteria

1. **Scoring Accuracy**: All 8 pillars calculate correctly with proper elimination rules
2. **Portfolio Selection**: Exactly 8 stocks selected based on highest scores
3. **Weight Calculation**: Proper implementation of (Score - 30) / Sum formula
4. **Automation**: Quarterly rebalancing executes on schedule
5. **Emergency Protocol**: Monthly checks detect and handle eliminations
6. **UI Display**: Clear visualization of scores, weights, and pillar breakdowns
7. **Performance**: Full universe scoring completes in < 5 minutes
8. **Data Quality**: All required metrics fetched reliably

## Risk Mitigation

1. **Data Availability**: Implement fallback calculations for missing metrics
2. **API Limits**: Cache data and implement rate limiting
3. **Market Hours**: Schedule rebalancing for market open
4. **Error Handling**: Comprehensive logging and rollback mechanisms
5. **Testing**: Extensive test coverage before production deployment

## Conclusion

This implementation plan transforms the existing Pricing Power Portfolio into the 8x8 Framework while leveraging the robust infrastructure already in place. The modular approach allows for incremental development and testing, ensuring a smooth transition to the new systematic investment framework.