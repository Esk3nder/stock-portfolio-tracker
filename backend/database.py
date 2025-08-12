from sqlalchemy import create_engine, Column, String, Float, DateTime, Integer, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

DATABASE_URL = "sqlite:///./data/portfolio.db"
os.makedirs("data", exist_ok=True)

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Security(Base):
    __tablename__ = "securities"
    
    ticker = Column(String, primary_key=True)
    name = Column(String)
    sector = Column(String)
    industry = Column(String)

class Fundamental(Base):
    __tablename__ = "fundamentals"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    ticker = Column(String, index=True)
    date = Column(DateTime)
    revenue = Column(Float)
    gross_profit = Column(Float)
    gross_margin = Column(Float)
    operating_income = Column(Float)
    fcf = Column(Float)
    fcf_margin = Column(Float)
    roic = Column(Float)
    revenue_growth = Column(Float)
    
    # Additional metrics for 8x8 Framework
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
    buyback_quality = Column(String)  # 'disciplined', 'moderate', 'aggressive', 'none'
    market_share = Column(Float)
    market_share_trend = Column(String)  # 'gaining', 'stable', 'losing'
    tam_growth_rate = Column(Float)

class Price(Base):
    __tablename__ = "prices"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    ticker = Column(String, index=True)
    date = Column(DateTime, index=True)
    close = Column(Float)
    volume = Column(Float)
    returns = Column(Float)

class Score(Base):
    __tablename__ = "scores"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    ticker = Column(String, index=True)
    run_date = Column(DateTime, index=True)
    economics_score = Column(Float)
    pricing_power_score = Column(Float)
    final_score = Column(Float)
    volatility = Column(Float)
    weight = Column(Float)

class PillarScores(Base):
    __tablename__ = 'pillar_scores'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    ticker = Column(String, ForeignKey('securities.ticker'), index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
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
    elimination_reason = Column(String)  # Which pillar(s) caused elimination
    
    # Tie-breaker metrics
    lowest_pillar_score = Column(Integer)
    median_pillar_score = Column(Float)
    p_fcf = Column(Float)
    fcf_absolute = Column(Float)

class Portfolio8x8(Base):
    __tablename__ = 'portfolio_8x8'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    rebalance_date = Column(DateTime, default=datetime.utcnow, index=True)
    ticker = Column(String, ForeignKey('securities.ticker'))
    rank = Column(Integer)  # 1-8
    total_score = Column(Integer)
    weight = Column(Float)
    points_above_base = Column(Integer)  # Score - 30
    rebalance_type = Column(String)  # 'quarterly', 'emergency'
    
    # Snapshot of pillar scores at selection time
    moat_score = Column(Integer)
    fortress_score = Column(Integer)
    engine_score = Column(Integer)
    efficiency_score = Column(Integer)
    pricing_power_score_pillar = Column(Integer)
    capital_allocation_score = Column(Integer)
    cash_generation_score = Column(Integer)
    durability_score = Column(Integer)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)