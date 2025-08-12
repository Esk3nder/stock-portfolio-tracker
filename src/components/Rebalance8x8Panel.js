import React, { useState } from 'react';
import './Rebalance8x8Panel.css';

const Rebalance8x8Panel = ({ onRebalance, loading }) => {
  const [universe, setUniverse] = useState('test');
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleRebalance = async () => {
    setIsRebalancing(true);
    setError(null);
    setResult(null);

    try {
      const rebalanceResult = await onRebalance(universe);
      setResult(rebalanceResult);
    } catch (err) {
      setError('Rebalance failed. Please check the console for details.');
    } finally {
      setIsRebalancing(false);
    }
  };

  return (
    <div className="rebalance-8x8-panel">
      <div className="rebalance-header">
        <h2>Quarterly Rebalance</h2>
        <p>Execute the 8×8 Framework rebalancing process</p>
      </div>

      <div className="rebalance-controls">
        <div className="universe-selector">
          <label>Select Universe:</label>
          <div className="universe-options">
            <button
              className={`universe-option ${universe === 'test' ? 'active' : ''}`}
              onClick={() => setUniverse('test')}
              disabled={isRebalancing}
            >
              <span className="option-icon">🧪</span>
              <span className="option-label">Test Universe</span>
              <span className="option-count">~70 stocks</span>
            </button>
            <button
              className={`universe-option ${universe === 'sp500' ? 'active' : ''}`}
              onClick={() => setUniverse('sp500')}
              disabled={isRebalancing}
            >
              <span className="option-icon">🏛️</span>
              <span className="option-label">S&P 500</span>
              <span className="option-count">500 stocks</span>
            </button>
          </div>
        </div>

        <button
          className="rebalance-button"
          onClick={handleRebalance}
          disabled={isRebalancing || loading}
        >
          {isRebalancing ? (
            <>
              <span className="spinner"></span>
              Scoring Universe...
            </>
          ) : (
            <>
              ⚖️ Execute Rebalance
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="rebalance-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {result && (
        <div className="rebalance-result">
          <h3>✅ Rebalance Complete</h3>
          <div className="result-stats">
            <div className="result-stat">
              <span className="stat-label">Stocks Scored</span>
              <span className="stat-value">{result.total_scored}</span>
            </div>
            <div className="result-stat">
              <span className="stat-label">Qualified</span>
              <span className="stat-value">{result.qualified_count}</span>
            </div>
            <div className="result-stat">
              <span className="stat-label">Eliminated</span>
              <span className="stat-value">{result.eliminated_count}</span>
            </div>
          </div>

          {result.portfolio && (
            <div className="selected-stocks">
              <h4>Selected Portfolio:</h4>
              <div className="stock-list">
                {result.portfolio.map((stock, index) => (
                  <div key={stock.ticker} className="selected-stock">
                    <span className="stock-rank">#{stock.rank}</span>
                    <span className="stock-ticker">{stock.ticker}</span>
                    <span className="stock-score">{stock.total_score}/64</span>
                    <span className="stock-weight">{(stock.weight * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.validation && !result.validation.is_valid && (
            <div className="validation-issues">
              <h4>⚠️ Validation Issues:</h4>
              <ul>
                {result.validation.issues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="rebalance-info">
        <h3>How It Works</h3>
        <ol>
          <li>Fetches fundamental data for all stocks in the selected universe</li>
          <li>Scores each stock on 8 pillars (0-8 points each)</li>
          <li>Eliminates any stock with a 0 in any pillar</li>
          <li>Selects the top 8 highest-scoring stocks</li>
          <li>Calculates weights using (Score - 30) / Total formula</li>
          <li>Saves portfolio for tracking and monitoring</li>
        </ol>

        <div className="schedule-info">
          <h4>📅 Rebalancing Schedule</h4>
          <p><strong>Quarterly:</strong> First Monday of each quarter (Jan, Apr, Jul, Oct)</p>
          <p><strong>Emergency:</strong> Monthly check on the 15th for any 0-score eliminations</p>
        </div>
      </div>
    </div>
  );
};

export default Rebalance8x8Panel;