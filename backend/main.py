from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from database import get_db, init_db, Security, Fundamental, Price, Score, PillarScores, Portfolio8x8
from models import (
    ScoresResponse, PortfolioResponse, RebalanceResponse,
    StockScore, PortfolioWeight, RebalanceRequest
)
from providers import DataProvider
from scoring import ScoringEngine
from optimizer import PortfolioOptimizer

# 8x8 Framework imports
from providers_8x8 import DataProvider8x8
from scoring_8x8 import EightByEightScorer
from optimizer_8x8 import EightByEightOptimizer

app = FastAPI(title="Pricing Power Portfolio API", version="0.1.0")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
data_provider = DataProvider()
scoring_engine = ScoringEngine()
optimizer = PortfolioOptimizer()

# 8x8 Framework components
data_provider_8x8 = DataProvider8x8()
scorer_8x8 = EightByEightScorer()
optimizer_8x8 = EightByEightOptimizer()

@app.on_event("startup")
async def startup_event():
    init_db()
    print("Database initialized")

@app.get("/")
async def root():
    return {"message": "Pricing Power Portfolio API", "version": "0.1.0"}

@app.get("/scores", response_model=ScoresResponse)
async def get_scores(db: Session = Depends(get_db)):
    # Get latest scores from database
    latest_scores = db.query(Score).order_by(Score.run_date.desc()).all()
    
    if not latest_scores:
        raise HTTPException(status_code=404, detail="No scores found. Run rebalance first.")
    
    # Get unique run date
    run_date = latest_scores[0].run_date
    
    # Filter scores for this run
    scores_for_run = [s for s in latest_scores if s.run_date == run_date]
    
    # Get security info
    stock_scores = []
    for score in scores_for_run:
        security = db.query(Security).filter(Security.ticker == score.ticker).first()
        stock_scores.append(StockScore(
            ticker=score.ticker,
            name=security.name if security else score.ticker,
            sector=security.sector if security else "Unknown",
            economics_score=score.economics_score,
            pricing_power_score=score.pricing_power_score,
            final_score=score.final_score,
            volatility=score.volatility
        ))
    
    # Sort by final score
    stock_scores.sort(key=lambda x: x.final_score, reverse=True)
    
    return ScoresResponse(run_date=run_date, scores=stock_scores)

@app.get("/portfolio", response_model=PortfolioResponse)
async def get_portfolio(db: Session = Depends(get_db)):
    # Get latest portfolio weights
    latest_scores = db.query(Score).filter(Score.weight > 0).order_by(Score.run_date.desc()).all()
    
    if not latest_scores:
        raise HTTPException(status_code=404, detail="No portfolio found. Run rebalance first.")
    
    # Get unique run date
    run_date = latest_scores[0].run_date
    
    # Filter for this run
    portfolio_stocks = [s for s in latest_scores if s.run_date == run_date and s.weight > 0]
    
    # Build response
    weights = []
    for score in portfolio_stocks:
        security = db.query(Security).filter(Security.ticker == score.ticker).first()
        weights.append(PortfolioWeight(
            ticker=score.ticker,
            name=security.name if security else score.ticker,
            weight=score.weight,
            score=score.final_score,
            sector=security.sector if security else "Unknown"
        ))
    
    # Sort by weight
    weights.sort(key=lambda x: x.weight, reverse=True)
    
    return PortfolioResponse(
        run_date=run_date,
        total_stocks=len(weights),
        weights=weights
    )

@app.post("/rebalance", response_model=RebalanceResponse)
async def trigger_rebalance(db: Session = Depends(get_db)):
    try:
        run_date = datetime.now()
        
        # Get test universe
        tickers = data_provider.get_test_universe()
        
        # Track progress
        processed = 0
        scores_dict = {}
        volatilities_dict = {}
        sector_map = {}
        
        print(f"Starting rebalance for {len(tickers)} stocks...")
        
        for ticker in tickers:
            try:
                # Fetch or update security info
                security = db.query(Security).filter(Security.ticker == ticker).first()
                if not security:
                    info = data_provider.fetch_stock_info(ticker)
                    security = Security(**info)
                    db.add(security)
                
                sector_map[ticker] = security.sector
                
                # Fetch fundamentals
                fundamentals = data_provider.fetch_fundamentals(ticker)
                if fundamentals:
                    # Store in database
                    fundamental = Fundamental(**fundamentals)
                    db.add(fundamental)
                    
                    # Calculate scores
                    economics_score = scoring_engine.calculate_economics_score(fundamentals)
                    pricing_power_score = scoring_engine.calculate_pricing_power_score(fundamentals)
                    final_score = scoring_engine.calculate_final_score(economics_score, pricing_power_score)
                    
                    scores_dict[ticker] = final_score
                    
                    # Fetch prices and calculate volatility
                    prices_df = data_provider.fetch_prices(ticker, period="6mo")
                    if not prices_df.empty:
                        # Store recent prices
                        for _, row in prices_df.tail(30).iterrows():  # Last 30 days
                            price = Price(**row.to_dict())
                            db.add(price)
                        
                        # Calculate volatility
                        returns = prices_df['returns'].tolist()
                        volatility = data_provider.calculate_volatility(returns)
                        volatilities_dict[ticker] = volatility
                    else:
                        volatilities_dict[ticker] = 0.25  # Default
                    
                    processed += 1
                    print(f"Processed {ticker}: Score={final_score:.2f}, Vol={volatilities_dict[ticker]:.3f}")
                
            except Exception as e:
                print(f"Error processing {ticker}: {e}")
                continue
        
        # Optimize portfolio
        print("\nOptimizing portfolio...")
        weights = optimizer.optimize_weights(scores_dict, volatilities_dict, min_score=50)
        
        # Save scores and weights to database
        for ticker in tickers:
            score = Score(
                ticker=ticker,
                run_date=run_date,
                economics_score=scores_dict.get(ticker, 0) * 0.6,
                pricing_power_score=scores_dict.get(ticker, 0) * 0.4,
                final_score=scores_dict.get(ticker, 0),
                volatility=volatilities_dict.get(ticker, 0.25),
                weight=weights.get(ticker, 0)
            )
            db.add(score)
        
        # Commit all changes
        db.commit()
        
        # Calculate portfolio metrics
        metrics = optimizer.calculate_portfolio_metrics(weights, volatilities_dict, scores_dict)
        
        message = (
            f"Rebalance complete. "
            f"Portfolio: {len(weights)} stocks, "
            f"Avg Score: {metrics['weighted_score']:.1f}, "
            f"Vol: {metrics['portfolio_volatility']:.1%}"
        )
        
        return RebalanceResponse(
            status="success",
            timestamp=run_date,
            stocks_processed=processed,
            message=message
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Rebalance failed: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}

# ==================== 8x8 Framework Endpoints ====================

@app.get("/api/cached-stocks")
async def get_cached_stocks(db: Session = Depends(get_db)):
    """Get list of cached stocks that have been analyzed"""
    try:
        # Get unique tickers from PillarScores table
        recent_scores = db.query(PillarScores.ticker, PillarScores.total_score).distinct(PillarScores.ticker).order_by(PillarScores.ticker).all()
        
        cached_stocks = [{
            "ticker": score.ticker,
            "total_score": score.total_score
        } for score in recent_scores]
        
        return {
            "cached_stocks": cached_stocks,
            "count": len(cached_stocks)
        }
    except Exception as e:
        print(f"Error fetching cached stocks: {e}")
        return {"cached_stocks": [], "count": 0}

@app.post("/api/rebalance-8x8")
async def rebalance_8x8(request: RebalanceRequest, db: Session = Depends(get_db)):
    """Execute 8x8 Framework rebalancing"""
    try:
        run_date = datetime.now()
        
        # Get universe of stocks
        if request.universe == "manual" and request.tickers:
            # Use manually provided tickers
            tickers = request.tickers[:20]  # Limit to 20 stocks for API protection
        elif request.universe == "cached":
            # Use previously analyzed stocks from database
            recent_scores = db.query(PillarScores).distinct(PillarScores.ticker).limit(100).all()
            tickers = [score.ticker for score in recent_scores]
            if not tickers:
                tickers = data_provider_8x8.get_test_universe_8x8()
        elif request.universe == "sp500":
            # WARNING: This will make 500 API calls
            tickers = data_provider_8x8.get_sp500_universe()[:50]  # Limit to 50 for safety
        else:
            tickers = data_provider_8x8.get_test_universe_8x8()
        
        print(f"Starting 8x8 rebalance for {len(tickers)} stocks in {request.universe} universe...")
        
        # Score all stocks
        all_scores = []
        for ticker in tickers:
            try:
                # Fetch or update security info
                security = db.query(Security).filter(Security.ticker == ticker).first()
                if not security:
                    info = data_provider_8x8.fetch_stock_info(ticker)
                    security = Security(**info)
                    db.add(security)
                
                # Fetch extended fundamentals
                fundamentals = data_provider_8x8.fetch_extended_fundamentals(ticker)
                
                # Store fundamentals
                fundamental = Fundamental(**fundamentals)
                db.add(fundamental)
                
                # Calculate 8x8 scores
                pillar_scores, total_score, is_eliminated, elimination_reasons = scorer_8x8.calculate_total_score(fundamentals)
                
                # Calculate tie-breakers
                tie_breakers = scorer_8x8.calculate_tie_breakers(pillar_scores, fundamentals)
                
                # Save pillar scores to database
                pillar_score_record = PillarScores(
                    ticker=ticker,
                    timestamp=run_date,
                    moat_score=pillar_scores['moat'],
                    fortress_score=pillar_scores['fortress'],
                    engine_score=pillar_scores['engine'],
                    efficiency_score=pillar_scores['efficiency'],
                    pricing_power_score=pillar_scores['pricing_power'],
                    capital_allocation_score=pillar_scores['capital_allocation'],
                    cash_generation_score=pillar_scores['cash_generation'],
                    durability_score=pillar_scores['durability'],
                    total_score=total_score,
                    is_eliminated=is_eliminated,
                    elimination_reason=scorer_8x8.format_elimination_reason(elimination_reasons) if elimination_reasons else None,
                    lowest_pillar_score=tie_breakers['lowest_pillar_score'],
                    median_pillar_score=tie_breakers['median_pillar_score'],
                    p_fcf=tie_breakers['p_fcf'],
                    fcf_absolute=tie_breakers['fcf_absolute']
                )
                db.add(pillar_score_record)
                
                # Add to scoring list
                all_scores.append({
                    'ticker': ticker,
                    'name': security.name,
                    'sector': security.sector,
                    'industry': security.industry,
                    'scores': pillar_scores,
                    'total_score': total_score,
                    'is_eliminated': is_eliminated,
                    'elimination_reason': elimination_reasons,
                    'fundamentals': fundamentals,
                    'lowest_pillar_score': tie_breakers['lowest_pillar_score'],
                    'median_pillar_score': tie_breakers['median_pillar_score'],
                    'p_fcf': tie_breakers['p_fcf'],
                    'fcf_absolute': tie_breakers['fcf_absolute']
                })
                
                print(f"Scored {ticker}: Total={total_score}/64, Eliminated={is_eliminated}")
                
            except Exception as e:
                print(f"Error scoring {ticker}: {e}")
                continue
        
        # Select top 8
        selected = optimizer_8x8.select_top_8(all_scores)
        
        # Calculate weights
        weights = optimizer_8x8.calculate_weights(selected)
        
        # Create portfolio allocation
        portfolio = optimizer_8x8.create_portfolio_allocation(selected, weights)
        
        # Validate portfolio
        is_valid, issues = optimizer_8x8.validate_portfolio(portfolio)
        if not is_valid:
            print(f"Portfolio validation issues: {issues}")
        
        # Save portfolio to database
        for position in portfolio:
            portfolio_record = Portfolio8x8(
                rebalance_date=run_date,
                ticker=position['ticker'],
                rank=position['rank'],
                total_score=position['total_score'],
                weight=position['weight'],
                points_above_base=position['points_above_base'],
                rebalance_type='quarterly',
                moat_score=position['pillar_scores']['moat'],
                fortress_score=position['pillar_scores']['fortress'],
                engine_score=position['pillar_scores']['engine'],
                efficiency_score=position['pillar_scores']['efficiency'],
                pricing_power_score_pillar=position['pillar_scores']['pricing_power'],
                capital_allocation_score=position['pillar_scores']['capital_allocation'],
                cash_generation_score=position['pillar_scores']['cash_generation'],
                durability_score=position['pillar_scores']['durability']
            )
            db.add(portfolio_record)
        
        # Commit all changes
        db.commit()
        
        return {
            'status': 'success',
            'portfolio': [
                {
                    'rank': p['rank'],
                    'ticker': p['ticker'],
                    'name': p['name'],
                    'sector': p['sector'],
                    'weight': p['weight'],
                    'total_score': p['total_score'],
                    'pillar_scores': p['pillar_scores']
                }
                for p in portfolio
            ],
            'total_scored': len(all_scores),
            'eliminated_count': sum(1 for s in all_scores if s['is_eliminated']),
            'qualified_count': sum(1 for s in all_scores if not s['is_eliminated'] and s['total_score'] >= 32),
            'timestamp': run_date.isoformat(),
            'validation': {'is_valid': is_valid, 'issues': issues}
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"8x8 Rebalance failed: {str(e)}")

@app.get("/api/portfolio-8x8")
async def get_portfolio_8x8(db: Session = Depends(get_db)):
    """Get current 8x8 portfolio"""
    try:
        # Get latest portfolio
        latest_portfolio = db.query(Portfolio8x8).order_by(Portfolio8x8.rebalance_date.desc()).limit(8).all()
        
        if not latest_portfolio:
            raise HTTPException(status_code=404, detail="No 8x8 portfolio found. Run rebalance first.")
        
        # Get the rebalance date
        rebalance_date = latest_portfolio[0].rebalance_date
        
        # Get all positions for this rebalance
        portfolio_positions = db.query(Portfolio8x8).filter(
            Portfolio8x8.rebalance_date == rebalance_date
        ).order_by(Portfolio8x8.rank).all()
        
        # Build response
        portfolio = []
        for position in portfolio_positions:
            security = db.query(Security).filter(Security.ticker == position.ticker).first()
            portfolio.append({
                'rank': position.rank,
                'ticker': position.ticker,
                'name': security.name if security else position.ticker,
                'sector': security.sector if security else 'Unknown',
                'weight': position.weight,
                'total_score': position.total_score,
                'points_above_base': position.points_above_base,
                'pillar_scores': {
                    'moat': position.moat_score,
                    'fortress': position.fortress_score,
                    'engine': position.engine_score,
                    'efficiency': position.efficiency_score,
                    'pricing_power': position.pricing_power_score_pillar,
                    'capital_allocation': position.capital_allocation_score,
                    'cash_generation': position.cash_generation_score,
                    'durability': position.durability_score
                }
            })
        
        return {
            'rebalance_date': rebalance_date.isoformat(),
            'rebalance_type': portfolio_positions[0].rebalance_type if portfolio_positions else 'quarterly',
            'total_positions': len(portfolio),
            'portfolio': portfolio
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching portfolio: {str(e)}")

@app.get("/api/scores-8x8")
async def get_all_scores_8x8(db: Session = Depends(get_db)):
    """Get all scored stocks with 8x8 Framework details"""
    try:
        # Get latest scoring run
        latest_score = db.query(PillarScores).order_by(PillarScores.timestamp.desc()).first()
        
        if not latest_score:
            raise HTTPException(status_code=404, detail="No scores found. Run rebalance first.")
        
        scoring_date = latest_score.timestamp
        
        # Get all scores from this run
        all_scores = db.query(PillarScores).filter(
            PillarScores.timestamp == scoring_date
        ).all()
        
        # Build response
        scores_list = []
        for score in all_scores:
            security = db.query(Security).filter(Security.ticker == score.ticker).first()
            scores_list.append({
                'ticker': score.ticker,
                'name': security.name if security else score.ticker,
                'sector': security.sector if security else 'Unknown',
                'total_score': score.total_score,
                'is_eliminated': score.is_eliminated,
                'elimination_reason': score.elimination_reason,
                'pillar_scores': {
                    'moat': score.moat_score,
                    'fortress': score.fortress_score,
                    'engine': score.engine_score,
                    'efficiency': score.efficiency_score,
                    'pricing_power': score.pricing_power_score,
                    'capital_allocation': score.capital_allocation_score,
                    'cash_generation': score.cash_generation_score,
                    'durability': score.durability_score
                },
                'tie_breakers': {
                    'lowest_pillar_score': score.lowest_pillar_score,
                    'median_pillar_score': score.median_pillar_score,
                    'p_fcf': score.p_fcf,
                    'fcf_absolute': score.fcf_absolute
                }
            })
        
        # Sort by total score (descending)
        scores_list.sort(key=lambda x: x['total_score'], reverse=True)
        
        # Calculate statistics
        qualified = [s for s in scores_list if not s['is_eliminated'] and s['total_score'] >= 32]
        eliminated = [s for s in scores_list if s['is_eliminated']]
        
        return {
            'scoring_date': scoring_date.isoformat(),
            'total_scored': len(scores_list),
            'qualified_count': len(qualified),
            'eliminated_count': len(eliminated),
            'average_score': sum(s['total_score'] for s in qualified) / len(qualified) if qualified else 0,
            'scores': scores_list
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching scores: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)