import React, { useState } from 'react';
import './RebalancePanel.css';
import portfolioApi from '../services/portfolioApi';

const RebalancePanel = ({ onRebalanceComplete }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [lastRun, setLastRun] = useState(null);

  const handleRebalance = async () => {
    setLoading(true);
    setError(null);
    setStatus('Starting rebalance...');

    try {
      const response = await portfolioApi.triggerRebalance();
      
      setStatus(response.message);
      setLastRun({
        timestamp: new Date(response.timestamp),
        stocksProcessed: response.stocks_processed,
        status: response.status
      });

      // Notify parent component
      if (onRebalanceComplete) {
        onRebalanceComplete();
      }

      // Clear status after 5 seconds
      setTimeout(() => setStatus(null), 5000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to trigger rebalance');
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rebalance-panel">
      <h2>Portfolio Rebalance</h2>
      
      <div className="rebalance-info">
        <p>
          The rebalance process will:
        </p>
        <ul>
          <li>Fetch latest fundamental data for all stocks</li>
          <li>Calculate Economics and Pricing Power scores</li>
          <li>Optimize portfolio weights using score²/volatility</li>
          <li>Apply 5% maximum position constraint</li>
        </ul>
      </div>

      <div className="rebalance-controls">
        <button
          className={`rebalance-button ${loading ? 'loading' : ''}`}
          onClick={handleRebalance}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Processing...
            </>
          ) : (
            'Run Rebalance'
          )}
        </button>
      </div>

      {status && (
        <div className="status-message success">
          {status}
        </div>
      )}

      {error && (
        <div className="status-message error">
          {error}
        </div>
      )}

      {lastRun && (
        <div className="last-run-info">
          <h3>Last Rebalance</h3>
          <div className="run-details">
            <div className="detail">
              <span className="label">Time:</span>
              <span className="value">{lastRun.timestamp.toLocaleString()}</span>
            </div>
            <div className="detail">
              <span className="label">Stocks Processed:</span>
              <span className="value">{lastRun.stocksProcessed}</span>
            </div>
            <div className="detail">
              <span className="label">Status:</span>
              <span className={`value ${lastRun.status === 'success' ? 'success' : 'error'}`}>
                {lastRun.status}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="rebalance-note">
        <p>
          <strong>Note:</strong> The rebalance process may take 30-60 seconds to complete 
          as it fetches real-time data from multiple sources.
        </p>
      </div>
    </div>
  );
};

export default RebalancePanel;