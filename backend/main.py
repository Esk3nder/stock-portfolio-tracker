from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from database import get_db, init_db, Security, Fundamental, Price, Score
from models import (
    ScoresResponse, PortfolioResponse, RebalanceResponse,
    StockScore, PortfolioWeight
)
from providers import DataProvider
from scoring import ScoringEngine
from optimizer import PortfolioOptimizer

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)