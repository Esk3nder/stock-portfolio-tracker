from pydantic import BaseModel
from datetime import datetime
from typing import List, Dict, Optional

class StockScore(BaseModel):
    ticker: str
    name: Optional[str] = None
    sector: Optional[str] = None
    economics_score: float
    pricing_power_score: float
    final_score: float
    volatility: float

class PortfolioWeight(BaseModel):
    ticker: str
    name: Optional[str] = None
    weight: float
    score: float
    sector: Optional[str] = None

class PortfolioResponse(BaseModel):
    run_date: datetime
    total_stocks: int
    weights: List[PortfolioWeight]

class ScoresResponse(BaseModel):
    run_date: datetime
    scores: List[StockScore]

class RebalanceResponse(BaseModel):
    status: str
    timestamp: datetime
    stocks_processed: int
    message: str

class TickerList(BaseModel):
    tickers: List[str]

class RebalanceRequest(BaseModel):
    universe: str = "test"
    tickers: Optional[List[str]] = None