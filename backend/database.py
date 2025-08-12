from sqlalchemy import create_engine, Column, String, Float, DateTime, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
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

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)