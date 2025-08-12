"""
Enhanced Data Provider for 8x8 Framework
Fetches extended fundamental metrics required for 8-pillar scoring
"""

import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import logging
from providers import DataProvider

logger = logging.getLogger(__name__)

class DataProvider8x8(DataProvider):
    """Extended data provider for 8x8 Framework metrics"""
    
    def __init__(self):
        super().__init__()
        self.sp500_tickers = None
        
    def fetch_extended_fundamentals(self, ticker: str) -> Dict:
        """
        Fetch all metrics required for 8x8 Framework scoring
        """
        try:
            # Get basic fundamentals from parent class
            basic_fundamentals = self.fetch_fundamentals(ticker)
            if not basic_fundamentals:
                return self._generate_mock_8x8_fundamentals(ticker)
            
            stock = yf.Ticker(ticker)
            
            # Get financial statements
            try:
                income_stmt = stock.quarterly_income_stmt
                balance_sheet = stock.quarterly_balance_sheet
                cash_flow = stock.quarterly_cashflow
                info = stock.info
            except Exception as e:
                logger.warning(f"Failed to fetch statements for {ticker}: {e}")
                return self._generate_mock_8x8_fundamentals(ticker)
            
            # Start with basic fundamentals
            fundamentals = basic_fundamentals.copy()
            
            # Calculate additional metrics
            fundamentals.update(self._calculate_debt_metrics(balance_sheet, income_stmt))
            fundamentals.update(self._calculate_growth_metrics(income_stmt))
            fundamentals.update(self._calculate_efficiency_metrics(fundamentals))
            fundamentals.update(self._calculate_capital_metrics(income_stmt, balance_sheet, cash_flow))
            fundamentals.update(self._calculate_industry_metrics(ticker, fundamentals.get('gross_margin', 0), info))
            fundamentals.update(self._estimate_market_position(ticker, info))
            
            # Add price metrics for tie-breakers
            current_price = info.get('currentPrice', info.get('previousClose', 0))
            if current_price and fundamentals.get('fcf', 0) > 0:
                shares_outstanding = info.get('sharesOutstanding', 1)
                market_cap = current_price * shares_outstanding
                fcf_annual = fundamentals.get('fcf', 0) * 4  # Annualize quarterly FCF
                fundamentals['fcf_multiple'] = market_cap / fcf_annual if fcf_annual > 0 else float('inf')
                fundamentals['fcf_absolute'] = fcf_annual
            else:
                fundamentals['fcf_multiple'] = float('inf')
                fundamentals['fcf_absolute'] = 0
            
            return fundamentals
            
        except Exception as e:
            logger.error(f"Error fetching extended fundamentals for {ticker}: {e}")
            return self._generate_mock_8x8_fundamentals(ticker)
    
    def _calculate_debt_metrics(self, balance_sheet: pd.DataFrame, income_stmt: pd.DataFrame) -> Dict:
        """Calculate debt and EBITDA metrics"""
        metrics = {}
        
        try:
            if balance_sheet.empty or income_stmt.empty:
                return self._default_debt_metrics()
            
            latest = balance_sheet.columns[0]
            
            # Calculate total debt
            long_term_debt = balance_sheet.loc['Long Term Debt', latest] if 'Long Term Debt' in balance_sheet.index else 0
            short_term_debt = balance_sheet.loc['Short Term Debt', latest] if 'Short Term Debt' in balance_sheet.index else 0
            total_debt = float(long_term_debt + short_term_debt)
            
            # Get cash
            cash = balance_sheet.loc['Cash', latest] if 'Cash' in balance_sheet.index else 0
            cash_equivalents = balance_sheet.loc['Cash And Cash Equivalents', latest] if 'Cash And Cash Equivalents' in balance_sheet.index else 0
            total_cash = float(max(cash, cash_equivalents))
            
            # Calculate EBITDA (simplified)
            ebit = income_stmt.loc['EBIT', latest] if 'EBIT' in income_stmt.index else \
                   income_stmt.loc['Operating Income', latest] if 'Operating Income' in income_stmt.index else 0
            
            depreciation = 0
            if 'Depreciation And Amortization' in income_stmt.index:
                depreciation = income_stmt.loc['Depreciation And Amortization', latest]
            
            ebitda = float(ebit + abs(depreciation)) * 4  # Annualize quarterly
            
            # Calculate debt to EBITDA
            net_debt = total_debt - total_cash
            if ebitda > 0:
                debt_to_ebitda = net_debt / ebitda
            else:
                debt_to_ebitda = 10.0 if net_debt > 0 else -1.0  # -1 indicates net cash
            
            metrics['total_debt'] = total_debt
            metrics['ebitda'] = ebitda
            metrics['debt_to_ebitda'] = debt_to_ebitda
            
        except Exception as e:
            logger.warning(f"Error calculating debt metrics: {e}")
            return self._default_debt_metrics()
        
        return metrics
    
    def _calculate_growth_metrics(self, income_stmt: pd.DataFrame) -> Dict:
        """Calculate revenue growth metrics"""
        metrics = {}
        
        try:
            if income_stmt.empty or len(income_stmt.columns) < 12:
                return self._default_growth_metrics()
            
            # Get current and 3-year-ago revenue
            current_revenue = income_stmt.loc['Total Revenue', income_stmt.columns[0]] if 'Total Revenue' in income_stmt.index else 0
            
            # Try to get 3 years ago (12 quarters)
            if len(income_stmt.columns) >= 12:
                revenue_3y_ago = income_stmt.loc['Total Revenue', income_stmt.columns[11]] if 'Total Revenue' in income_stmt.index else 0
            else:
                # Use oldest available
                revenue_3y_ago = income_stmt.loc['Total Revenue', income_stmt.columns[-1]] if 'Total Revenue' in income_stmt.index else 0
                
            # Calculate CAGR
            years = min(3, len(income_stmt.columns) / 4)
            if revenue_3y_ago > 0 and years > 0:
                revenue_cagr_3y = ((current_revenue / revenue_3y_ago) ** (1/years)) - 1
            else:
                revenue_cagr_3y = 0.15  # Default assumption
            
            metrics['revenue_3y_ago'] = float(revenue_3y_ago)
            metrics['revenue_cagr_3y'] = float(revenue_cagr_3y)
            
        except Exception as e:
            logger.warning(f"Error calculating growth metrics: {e}")
            return self._default_growth_metrics()
        
        return metrics
    
    def _calculate_efficiency_metrics(self, fundamentals: Dict) -> Dict:
        """Calculate Rule of 40 and other efficiency metrics"""
        metrics = {}
        
        # Rule of 40 = Revenue Growth % + FCF Margin %
        revenue_growth = fundamentals.get('revenue_growth', 15)  # As percentage
        fcf_margin = fundamentals.get('fcf_margin', 20)  # As percentage
        
        rule_of_40 = revenue_growth + fcf_margin
        metrics['rule_of_40'] = rule_of_40
        
        return metrics
    
    def _calculate_capital_metrics(self, income_stmt: pd.DataFrame, balance_sheet: pd.DataFrame, cash_flow: pd.DataFrame) -> Dict:
        """Calculate ROE and buyback metrics"""
        metrics = {}
        
        try:
            if income_stmt.empty or balance_sheet.empty:
                return self._default_capital_metrics()
            
            latest = income_stmt.columns[0]
            
            # Calculate ROE
            net_income = income_stmt.loc['Net Income', latest] if 'Net Income' in income_stmt.index else 0
            net_income_annual = float(net_income * 4)  # Annualize
            
            shareholders_equity = balance_sheet.loc['Total Stockholder Equity', latest] if 'Total Stockholder Equity' in balance_sheet.index else \
                                balance_sheet.loc['Common Stock Equity', latest] if 'Common Stock Equity' in balance_sheet.index else 0
            
            roe = (net_income_annual / shareholders_equity) if shareholders_equity > 0 else 0
            metrics['roe'] = float(roe)
            
            # Calculate buyback metrics
            if not cash_flow.empty and 'Common Stock Issued' in cash_flow.index:
                stock_issued = cash_flow.loc['Common Stock Issued', latest] if latest in cash_flow.columns else 0
                stock_repurchased = cash_flow.loc['Common Stock Repurchased', latest] if 'Common Stock Repurchased' in cash_flow.index else 0
                
                net_buyback = abs(stock_repurchased) - abs(stock_issued)
                buyback_yield = (net_buyback / (shareholders_equity)) if shareholders_equity > 0 else 0
                
                metrics['buyback_yield'] = float(buyback_yield)
                
                # Assess buyback quality based on valuation and consistency
                if buyback_yield > 0.02:  # More than 2% buyback yield
                    metrics['buyback_quality'] = 'disciplined'
                elif buyback_yield > 0:
                    metrics['buyback_quality'] = 'moderate'
                else:
                    metrics['buyback_quality'] = 'none'
            else:
                metrics['buyback_yield'] = 0
                metrics['buyback_quality'] = 'none'
                
        except Exception as e:
            logger.warning(f"Error calculating capital metrics: {e}")
            return self._default_capital_metrics()
        
        return metrics
    
    def _calculate_industry_metrics(self, ticker: str, gross_margin: float, info: Dict) -> Dict:
        """Calculate industry-relative metrics"""
        metrics = {}
        
        # This would require industry data - using simplified approach
        industry = info.get('industry', 'Unknown')
        sector = info.get('sector', 'Unknown')
        
        # Industry gross margin benchmarks (simplified)
        industry_benchmarks = {
            'Technology': {'p90': 70, 'p75': 60, 'p50': 45, 'p25': 30},
            'Consumer Cyclical': {'p90': 50, 'p75': 40, 'p50': 30, 'p25': 20},
            'Healthcare': {'p90': 70, 'p75': 60, 'p50': 50, 'p25': 40},
            'Financial Services': {'p90': 80, 'p75': 70, 'p50': 60, 'p25': 50},
            'Communication Services': {'p90': 60, 'p75': 50, 'p50': 40, 'p25': 30},
            'Consumer Defensive': {'p90': 40, 'p75': 35, 'p50': 30, 'p25': 25},
            'Industrials': {'p90': 35, 'p75': 30, 'p50': 25, 'p25': 20},
            'Basic Materials': {'p90': 35, 'p75': 30, 'p50': 25, 'p25': 20},
            'Energy': {'p90': 40, 'p75': 35, 'p50': 30, 'p25': 25},
            'Real Estate': {'p90': 70, 'p75': 60, 'p50': 50, 'p25': 40},
            'Utilities': {'p90': 45, 'p75': 40, 'p50': 35, 'p25': 30}
        }
        
        # Get benchmarks for sector
        benchmarks = industry_benchmarks.get(sector, {'p90': 50, 'p75': 40, 'p50': 30, 'p25': 20})
        
        # Calculate percentile
        if gross_margin >= benchmarks['p90']:
            percentile = 95
        elif gross_margin >= benchmarks['p75']:
            percentile = 80 + (gross_margin - benchmarks['p75']) / (benchmarks['p90'] - benchmarks['p75']) * 15
        elif gross_margin >= benchmarks['p50']:
            percentile = 50 + (gross_margin - benchmarks['p50']) / (benchmarks['p75'] - benchmarks['p50']) * 30
        elif gross_margin >= benchmarks['p25']:
            percentile = 25 + (gross_margin - benchmarks['p25']) / (benchmarks['p50'] - benchmarks['p25']) * 25
        else:
            percentile = max(0, 25 * (gross_margin / benchmarks['p25']))
        
        metrics['industry_gross_margin_percentile'] = float(percentile)
        
        return metrics
    
    def _estimate_market_position(self, ticker: str, info: Dict) -> Dict:
        """Estimate market share and TAM growth"""
        metrics = {}
        
        # This would require market research data - using estimates
        market_cap = info.get('marketCap', 0)
        
        # Simplified market position based on market cap and sector
        if market_cap > 500_000_000_000:  # > $500B
            metrics['market_share_trend'] = 'gaining'
            metrics['market_share'] = 0.25
        elif market_cap > 100_000_000_000:  # > $100B
            metrics['market_share_trend'] = 'stable'
            metrics['market_share'] = 0.15
        elif market_cap > 50_000_000_000:  # > $50B
            metrics['market_share_trend'] = 'gaining'
            metrics['market_share'] = 0.10
        else:
            metrics['market_share_trend'] = 'stable'
            metrics['market_share'] = 0.05
        
        # TAM growth estimates by sector
        sector = info.get('sector', 'Unknown')
        tam_growth_by_sector = {
            'Technology': 0.15,
            'Healthcare': 0.12,
            'Consumer Cyclical': 0.08,
            'Communication Services': 0.10,
            'Financial Services': 0.07,
            'Consumer Defensive': 0.05,
            'Industrials': 0.06,
            'Basic Materials': 0.04,
            'Energy': 0.03,
            'Real Estate': 0.05,
            'Utilities': 0.03
        }
        
        metrics['tam_growth_rate'] = tam_growth_by_sector.get(sector, 0.06)
        
        return metrics
    
    def _generate_mock_8x8_fundamentals(self, ticker: str) -> Dict:
        """Generate mock fundamentals for testing"""
        np.random.seed(hash(ticker) % 1000)
        
        # Generate scores that will produce a mix of qualified and eliminated stocks
        roic = np.random.uniform(0.10, 0.45)
        debt_to_ebitda = np.random.uniform(-0.5, 3.0)
        revenue_cagr = np.random.uniform(0.05, 0.35)
        fcf_margin = np.random.uniform(0.08, 0.35)
        gross_margin = np.random.uniform(20, 80)
        roe = np.random.uniform(0.10, 0.35)
        
        rule_of_40 = (revenue_cagr * 100) + (fcf_margin * 100)
        
        return {
            'ticker': ticker,
            'date': datetime.now(),
            'revenue': np.random.uniform(1e9, 100e9),
            'gross_profit': np.random.uniform(0.5e9, 50e9),
            'gross_margin': gross_margin,
            'operating_income': np.random.uniform(0.1e9, 20e9),
            'fcf': np.random.uniform(0.1e9, 30e9),
            'fcf_margin': fcf_margin * 100,
            'roic': roic * 100,
            'revenue_growth': revenue_cagr * 100,
            'debt_to_ebitda': debt_to_ebitda,
            'ebitda': np.random.uniform(0.5e9, 40e9),
            'total_debt': np.random.uniform(0, 50e9),
            'revenue_3y_ago': np.random.uniform(0.5e9, 50e9),
            'revenue_cagr_3y': revenue_cagr,
            'rule_of_40': rule_of_40,
            'industry_gross_margin_percentile': np.random.uniform(40, 98),
            'roe': roe,
            'fcf_multiple': np.random.uniform(10, 50),
            'fcf_absolute': np.random.uniform(0.1e9, 30e9),
            'buyback_yield': np.random.uniform(-0.02, 0.05),
            'buyback_quality': np.random.choice(['disciplined', 'moderate', 'aggressive', 'none']),
            'market_share': np.random.uniform(0.01, 0.30),
            'market_share_trend': np.random.choice(['gaining', 'stable', 'losing'], p=[0.4, 0.5, 0.1]),
            'tam_growth_rate': np.random.uniform(-0.05, 0.25)
        }
    
    def _default_debt_metrics(self) -> Dict:
        return {
            'total_debt': 0,
            'ebitda': 1000000,
            'debt_to_ebitda': 1.0
        }
    
    def _default_growth_metrics(self) -> Dict:
        return {
            'revenue_3y_ago': 1000000,
            'revenue_cagr_3y': 0.15
        }
    
    def _default_capital_metrics(self) -> Dict:
        return {
            'roe': 0.20,
            'buyback_yield': 0.02,
            'buyback_quality': 'moderate'
        }
    
    def get_sp500_universe(self) -> List[str]:
        """Get S&P 500 ticker list"""
        if self.sp500_tickers:
            return self.sp500_tickers
        
        try:
            # Try to fetch from Wikipedia
            tables = pd.read_html('https://en.wikipedia.org/wiki/List_of_S%26P_500_companies')
            sp500_table = tables[0]
            self.sp500_tickers = sp500_table['Symbol'].tolist()
            
            # Clean up tickers
            self.sp500_tickers = [t.replace('.', '-') for t in self.sp500_tickers]
            
            return self.sp500_tickers
        except Exception as e:
            logger.warning(f"Failed to fetch S&P 500 list: {e}, using test universe")
            # Return expanded test universe
            return self.get_test_universe_8x8()
    
    def get_test_universe_8x8(self) -> List[str]:
        """Extended test universe for 8x8 Framework"""
        return [
            # Technology
            "MSFT", "AAPL", "GOOGL", "META", "NVDA", "CRM", "ADBE", "ORCL", "CSCO", "INTC",
            # Consumer
            "AMZN", "TSLA", "NFLX", "NKE", "SBUX", "MCD", "HD", "LOW", "TGT", "WMT",
            # Finance
            "V", "MA", "JPM", "BAC", "GS", "MS", "BRK-B", "AXP", "WFC", "C",
            # Healthcare
            "UNH", "JNJ", "PFE", "ABBV", "TMO", "ABT", "CVS", "LLY", "MRK", "AMGN",
            # Industrials
            "BA", "CAT", "GE", "HON", "LMT", "MMM", "RTX", "UPS", "DE", "EMR",
            # Energy
            "XOM", "CVX", "COP", "SLB", "EOG",
            # Materials
            "LIN", "APD", "ECL", "SHW", "DD",
            # Communications
            "DIS", "CMCSA", "VZ", "T", "NFLX",
            # Utilities
            "NEE", "DUK", "SO", "D", "AEP",
            # Real Estate
            "AMT", "PLD", "CCI", "EQIX", "PSA"
        ]