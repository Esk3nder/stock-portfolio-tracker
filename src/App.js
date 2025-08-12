import React, { useState } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import StockSearch from './components/StockSearch';
import StockCard from './components/StockCard';
import PortfolioSummary from './components/PortfolioSummary';
import usePortfolio from './hooks/usePortfolio';

function App() {
  const [useNewUI, setUseNewUI] = useState(true);
  
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

  // Show new Dashboard UI by default
  if (useNewUI) {
    return (
      <div className="App">
        <Dashboard />
        <div style={{ position: 'fixed', bottom: 10, left: 10, zIndex: 1000 }}>
          <button 
            onClick={() => setUseNewUI(false)}
            style={{
              padding: '8px 16px',
              background: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Switch to Legacy UI
          </button>
        </div>
      </div>
    );
  }

  // Legacy UI
  return (
    <div className="App">
      <header className="App-header">
        <h1>Stock Portfolio Tracker</h1>
        <p>Track your investments in real-time</p>
        <button 
          onClick={() => setUseNewUI(true)}
          style={{
            padding: '8px 16px',
            background: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Switch to New Pricing Power UI
        </button>
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