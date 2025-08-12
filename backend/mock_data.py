"""
Mock data generator for testing when Yahoo Finance is rate limiting
"""

import random
from datetime import datetime, timedelta
import numpy as np

def generate_mock_fundamentals(ticker):
    """Generate realistic mock fundamental data"""
    
    # Base values by ticker for consistency
    seed = sum(ord(c) for c in ticker)
    random.seed(seed)
    np.random.seed(seed)
    
    # Generate values in realistic ranges
    revenue = random.uniform(1e9, 100e9)  # $1B to $100B
    gross_margin = random.uniform(20, 70)  # 20% to 70%
    gross_profit = revenue * (gross_margin / 100)
    
    operating_margin = random.uniform(5, 35)  # 5% to 35%
    operating_income = revenue * (operating_margin / 100)
    
    fcf_margin = random.uniform(5, 30)  # 5% to 30%
    fcf = revenue * (fcf_margin / 100)
    
    # ROIC between 5% and 30%
    roic = random.uniform(5, 30)
    
    # Revenue growth between -10% and 40%
    revenue_growth = random.uniform(-10, 40)
    
    return {
        "ticker": ticker,
        "date": datetime.now(),
        "revenue": revenue,
        "gross_profit": gross_profit,
        "gross_margin": gross_margin,
        "operating_income": operating_income,
        "fcf": fcf,
        "fcf_margin": fcf_margin,
        "roic": roic,
        "revenue_growth": revenue_growth
    }

def generate_mock_prices(ticker, days=252):
    """Generate realistic mock price data"""
    
    # Base values by ticker
    seed = sum(ord(c) for c in ticker)
    random.seed(seed)
    np.random.seed(seed)
    
    # Starting price between $20 and $500
    base_price = random.uniform(20, 500)
    
    # Generate daily returns with realistic volatility
    daily_vol = random.uniform(0.01, 0.03)  # 1% to 3% daily volatility
    drift = random.uniform(-0.0001, 0.001)  # Small daily drift
    
    prices = []
    current_price = base_price
    
    for i in range(days):
        # Random walk with drift
        daily_return = np.random.normal(drift, daily_vol)
        current_price = current_price * (1 + daily_return)
        
        date = datetime.now() - timedelta(days=days-i)
        
        prices.append({
            "ticker": ticker,
            "date": date,
            "close": current_price,
            "volume": random.uniform(1e6, 50e6),
            "returns": daily_return
        })
    
    return prices

def generate_mock_info(ticker):
    """Generate mock stock info"""
    
    sectors = ["Technology", "Consumer Discretionary", "Financials", "Healthcare", "Industrials"]
    
    # Consistent sector by ticker
    seed = sum(ord(c) for c in ticker)
    random.seed(seed)
    
    sector_map = {
        "MSFT": "Technology",
        "GOOGL": "Technology", 
        "META": "Technology",
        "CRM": "Technology",
        "ADBE": "Technology",
        "AMZN": "Consumer Discretionary",
        "NFLX": "Consumer Discretionary",
        "NKE": "Consumer Discretionary",
        "SBUX": "Consumer Discretionary",
        "MCD": "Consumer Discretionary",
        "V": "Financials",
        "MA": "Financials",
        "JPM": "Financials",
        "GS": "Financials",
        "BRK-B": "Financials",
        "UNH": "Healthcare",
        "JNJ": "Healthcare",
        "PFE": "Healthcare",
        "TMO": "Healthcare",
        "ABT": "Healthcare"
    }
    
    name_map = {
        "MSFT": "Microsoft Corporation",
        "GOOGL": "Alphabet Inc.",
        "META": "Meta Platforms Inc.",
        "CRM": "Salesforce Inc.",
        "ADBE": "Adobe Inc.",
        "AMZN": "Amazon.com Inc.",
        "NFLX": "Netflix Inc.",
        "NKE": "Nike Inc.",
        "SBUX": "Starbucks Corporation",
        "MCD": "McDonald's Corporation",
        "V": "Visa Inc.",
        "MA": "Mastercard Inc.",
        "JPM": "JPMorgan Chase & Co.",
        "GS": "Goldman Sachs Group Inc.",
        "BRK-B": "Berkshire Hathaway Inc.",
        "UNH": "UnitedHealth Group Inc.",
        "JNJ": "Johnson & Johnson",
        "PFE": "Pfizer Inc.",
        "TMO": "Thermo Fisher Scientific Inc.",
        "ABT": "Abbott Laboratories"
    }
    
    return {
        "ticker": ticker,
        "name": name_map.get(ticker, f"{ticker} Corporation"),
        "sector": sector_map.get(ticker, random.choice(sectors)),
        "industry": "Software" if sector_map.get(ticker) == "Technology" else "Various"
    }

def calculate_mock_volatility(returns):
    """Calculate annualized volatility from returns"""
    if len(returns) < 20:
        return 0.25
    
    returns_array = np.array([r for r in returns if r != 0])
    if len(returns_array) < 20:
        return 0.25
    
    daily_vol = np.std(returns_array)
    annual_vol = daily_vol * np.sqrt(252)
    
    return float(annual_vol)