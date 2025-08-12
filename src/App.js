import React from 'react';
import './App.css';
import StockSearch from './components/StockSearch';
import StockCard from './components/StockCard';
import PortfolioSummary from './components/PortfolioSummary';
import usePortfolio from './hooks/usePortfolio';

function App() {
  const {
    stocks,
    shares,
    loading,
    error,
    lastUpdate,
    autoRefresh,
    addStock,
    removeStock,
    updateShares,
    refreshAllStocks,
    setAutoRefresh,
    clearError
  } = usePortfolio();

  return (
    <div className="App">
      <header className="App-header">
        <h1>Stock Portfolio Tracker</h1>
        <p>Track your investments in real-time</p>
      </header>

      <main className="App-main">
        {error && (
          <div className="error-message">
            {error}
            <button onClick={clearError}>×</button>
          </div>
        )}

        <PortfolioSummary stocks={stocks} shares={shares} />

        <div className="controls">
          <StockSearch onAddStock={addStock} />
          
          <div className="refresh-controls">
            <button 
              onClick={refreshAllStocks} 
              disabled={loading || stocks.length === 0}
              className="refresh-button"
            >
              {loading ? 'Updating...' : 'Refresh All'}
            </button>
            
            <label className="auto-refresh">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto-refresh every minute
            </label>
          </div>
        </div>

        {lastUpdate && (
          <div className="last-update-time">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        )}

        <div className="stock-grid">
          {stocks.map(stock => (
            <StockCard
              key={stock.symbol}
              stock={stock}
              shares={shares[stock.symbol] || 0}
              onRemove={removeStock}
              onUpdateShares={updateShares}
            />
          ))}
        </div>

        {stocks.length === 0 && (
          <div className="empty-state">
            <p>No stocks in your portfolio yet.</p>
            <p>Use the search above to add stocks to track.</p>
          </div>
        )}
      </main>

      <footer className="App-footer">
        <p>Data provided by Alpha Vantage • Free tier: 5 API calls/minute</p>
        <p>Note: With the demo API key, only specific symbols like IBM, TSLA, AAPL work reliably.</p>
      </footer>
    </div>
  );
}

export default App;