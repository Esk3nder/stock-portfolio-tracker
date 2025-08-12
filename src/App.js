import React, { useState } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import Dashboard8x8 from './components/Dashboard8x8';
import StockSearch from './components/StockSearch';
import StockCard from './components/StockCard';
import PortfolioSummary from './components/PortfolioSummary';
import usePortfolio from './hooks/usePortfolio';

function App() {
  const [uiMode, setUiMode] = useState('8x8'); // '8x8', 'pricing', 'legacy'
  
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

  // Show 8x8 Dashboard by default
  if (uiMode === '8x8') {
    return (
      <div className="App">
        <Dashboard8x8 />
        <div style={{ position: 'fixed', bottom: 10, left: 10, zIndex: 1000, display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setUiMode('pricing')}
            style={{
              padding: '8px 16px',
              background: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Pricing Power UI
          </button>
          <button 
            onClick={() => setUiMode('legacy')}
            style={{
              padding: '8px 16px',
              background: '#444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Legacy UI
          </button>
        </div>
      </div>
    );
  }

  // Show Pricing Power Dashboard
  if (uiMode === 'pricing') {
    return (
      <div className="App">
        <Dashboard />
        <div style={{ position: 'fixed', bottom: 10, left: 10, zIndex: 1000, display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setUiMode('8x8')}
            style={{
              padding: '8px 16px',
              background: '#00ff88',
              color: '#0f0f1e',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            8×8 Framework
          </button>
          <button 
            onClick={() => setUiMode('legacy')}
            style={{
              padding: '8px 16px',
              background: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Legacy UI
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
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button 
            onClick={() => setUiMode('8x8')}
            style={{
              padding: '8px 16px',
              background: '#00ff88',
              color: '#0f0f1e',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            8×8 Framework
          </button>
          <button 
            onClick={() => setUiMode('pricing')}
            style={{
              padding: '8px 16px',
              background: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Pricing Power UI
          </button>
        </div>
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