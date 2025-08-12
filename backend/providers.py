import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import requests
import os
from dotenv import load_dotenv
from mock_data import generate_mock_fundamentals, generate_mock_prices, generate_mock_info, calculate_mock_volatility

load_dotenv()

class DataProvider:
    def __init__(self):
        self.alpha_vantage_key = os.getenv("ALPHA_VANTAGE_API_KEY", "demo")
        self.use_mock_data = os.getenv("USE_MOCK_DATA", "auto") # auto, true, false
        
    def fetch_stock_info(self, ticker: str) -> Dict:
        try:
            if self.use_mock_data == "true":
                return generate_mock_info(ticker)
                
            stock = yf.Ticker(ticker)
            info = stock.info
            
            # Check if we got rate limited
            if not info or "longName" not in info:
                print(f"Using mock data for {ticker} info (Yahoo Finance unavailable)")
                return generate_mock_info(ticker)
                
            return {
                "ticker": ticker,
                "name": info.get("longName", ticker),
                "sector": info.get("sector", "Unknown"),
                "industry": info.get("industry", "Unknown")
            }
        except Exception as e:
            if "429" in str(e) or "Too Many Requests" in str(e):
                print(f"Rate limited - using mock data for {ticker}")
                return generate_mock_info(ticker)
            return {
                "ticker": ticker,
                "name": ticker,
                "sector": "Unknown",
                "industry": "Unknown"
            }
    
    def fetch_fundamentals(self, ticker: str) -> Optional[Dict]:
        try:
            if self.use_mock_data == "true":
                return generate_mock_fundamentals(ticker)
                
            stock = yf.Ticker(ticker)
            
            # Get quarterly financials
            financials = stock.quarterly_financials
            cashflow = stock.quarterly_cashflow
            
            if financials.empty or cashflow.empty:
                print(f"Using mock data for {ticker} fundamentals (no data available)")
                return generate_mock_fundamentals(ticker)
            
            # Latest quarter data
            latest_date = financials.columns[0]
            
            # Basic metrics
            revenue = financials.loc["Total Revenue", latest_date] if "Total Revenue" in financials.index else 0
            gross_profit = financials.loc["Gross Profit", latest_date] if "Gross Profit" in financials.index else 0
            operating_income = financials.loc["Operating Income", latest_date] if "Operating Income" in financials.index else 0
            
            # Cash flow metrics
            operating_cf = cashflow.loc["Total Cash From Operating Activities", latest_date] if "Total Cash From Operating Activities" in cashflow.index else 0
            capex = abs(cashflow.loc["Capital Expenditures", latest_date]) if "Capital Expenditures" in cashflow.index else 0
            fcf = operating_cf - capex
            
            # Calculate margins
            gross_margin = (gross_profit / revenue * 100) if revenue > 0 else 0
            fcf_margin = (fcf / revenue * 100) if revenue > 0 else 0
            
            # Revenue growth (YoY)
            revenue_growth = 0
            if len(financials.columns) >= 5:  # Need 4 quarters back
                revenue_prev = financials.loc["Total Revenue", financials.columns[4]] if "Total Revenue" in financials.index else 0
                if revenue_prev > 0:
                    revenue_growth = ((revenue - revenue_prev) / revenue_prev) * 100
            
            # Simplified ROIC calculation
            ebit = operating_income
            tax_rate = 0.25  # Assumed tax rate
            nopat = ebit * (1 - tax_rate)
            
            # Get balance sheet for invested capital
            balance = stock.quarterly_balance_sheet
            if not balance.empty:
                total_assets = balance.loc["Total Assets", balance.columns[0]] if "Total Assets" in balance.index else 0
                cash = balance.loc["Cash", balance.columns[0]] if "Cash" in balance.index else 0
                current_liab = balance.loc["Total Current Liabilities", balance.columns[0]] if "Total Current Liabilities" in balance.index else 0
                invested_capital = total_assets - cash - current_liab
                roic = (nopat / invested_capital * 100) if invested_capital > 0 else 0
            else:
                roic = 0
            
            return {
                "ticker": ticker,
                "date": latest_date.to_pydatetime(),
                "revenue": float(revenue),
                "gross_profit": float(gross_profit),
                "gross_margin": float(gross_margin),
                "operating_income": float(operating_income),
                "fcf": float(fcf),
                "fcf_margin": float(fcf_margin),
                "roic": float(roic),
                "revenue_growth": float(revenue_growth)
            }
            
        except Exception as e:
            print(f"Error fetching fundamentals for {ticker}: {e}")
            if "429" in str(e) or "Too Many Requests" in str(e):
                print(f"Rate limited - using mock data for {ticker} fundamentals")
                return generate_mock_fundamentals(ticker)
            return generate_mock_fundamentals(ticker)
    
    def fetch_prices(self, ticker: str, period: str = "1y") -> pd.DataFrame:
        try:
            if self.use_mock_data == "true":
                return pd.DataFrame(generate_mock_prices(ticker))
                
            stock = yf.Ticker(ticker)
            hist = stock.history(period=period)
            
            if hist.empty:
                print(f"Using mock data for {ticker} prices (no data available)")
                return pd.DataFrame(generate_mock_prices(ticker))
            
            # Calculate daily returns
            hist['Returns'] = hist['Close'].pct_change()
            
            # Prepare data
            price_data = []
            for date, row in hist.iterrows():
                price_data.append({
                    "ticker": ticker,
                    "date": date.to_pydatetime(),
                    "close": float(row['Close']),
                    "volume": float(row['Volume']),
                    "returns": float(row['Returns']) if not pd.isna(row['Returns']) else 0
                })
            
            return pd.DataFrame(price_data)
            
        except Exception as e:
            print(f"Error fetching prices for {ticker}: {e}")
            if "429" in str(e) or "Too Many Requests" in str(e):
                print(f"Rate limited - using mock data for {ticker} prices")
                return pd.DataFrame(generate_mock_prices(ticker))
            return pd.DataFrame(generate_mock_prices(ticker))
    
    def calculate_volatility(self, returns: List[float]) -> float:
        if len(returns) < 20:  # Need minimum data points
            return 0.25  # Default volatility
        
        # Annualized volatility
        returns_array = np.array([r for r in returns if r != 0 and not pd.isna(r)])
        if len(returns_array) < 20:
            return 0.25
            
        daily_vol = np.std(returns_array)
        annual_vol = daily_vol * np.sqrt(252)  # Trading days
        
        return float(annual_vol)
    
    def get_test_universe(self) -> List[str]:
        return [
            # Tech
            "MSFT", "GOOGL", "META", "CRM", "ADBE",
            # Consumer
            "AMZN", "NFLX", "NKE", "SBUX", "MCD",
            # Finance  
            "V", "MA", "JPM", "GS", "BRK-B",
            # Healthcare
            "UNH", "JNJ", "PFE", "TMO", "ABT"
        ]