#!/usr/bin/env python3
"""
Test Yahoo Finance API directly
"""

import yfinance as yf
import sys

def test_ticker(symbol):
    """Test fetching data for a single ticker"""
    print(f"\nTesting {symbol}...")
    
    try:
        # Create ticker object
        stock = yf.Ticker(symbol)
        
        # Get info
        info = stock.info
        print(f"  Name: {info.get('longName', 'N/A')}")
        print(f"  Sector: {info.get('sector', 'N/A')}")
        print(f"  Market Cap: {info.get('marketCap', 'N/A')}")
        
        # Get financials
        financials = stock.quarterly_financials
        if not financials.empty:
            print(f"  Latest Quarter: {financials.columns[0]}")
            revenue = financials.loc["Total Revenue", financials.columns[0]] if "Total Revenue" in financials.index else 0
            print(f"  Revenue: ${revenue:,.0f}")
        else:
            print("  ⚠️  No financials available")
        
        # Get cash flow
        cashflow = stock.quarterly_cashflow
        if not cashflow.empty:
            print("  ✅ Cash flow data available")
        else:
            print("  ⚠️  No cash flow data")
            
        # Get historical prices
        hist = stock.history(period="1mo")
        if not hist.empty:
            print(f"  Latest Price: ${hist['Close'][-1]:.2f}")
            print("  ✅ Price history available")
        else:
            print("  ⚠️  No price history")
            
        return True
        
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

def main():
    """Test a few tickers"""
    print("=" * 50)
    print("Yahoo Finance API Test")
    print("=" * 50)
    
    # Test tickers
    test_tickers = ["MSFT", "AAPL", "GOOGL", "AMZN", "META"]
    
    success_count = 0
    for ticker in test_tickers:
        if test_ticker(ticker):
            success_count += 1
    
    print("\n" + "=" * 50)
    print(f"Results: {success_count}/{len(test_tickers)} successful")
    
    if success_count == 0:
        print("\n⚠️  Yahoo Finance may be rate limiting or having issues.")
        print("Try waiting a few minutes and running again.")
        sys.exit(1)
    elif success_count < len(test_tickers):
        print("\n⚠️  Some tickers failed. This is normal for Yahoo Finance.")
        print("The app should still work with available data.")
    else:
        print("\n✅ All tickers working! Yahoo Finance API is functional.")

if __name__ == "__main__":
    main()