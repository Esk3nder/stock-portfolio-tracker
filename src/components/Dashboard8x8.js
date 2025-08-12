import React, { useState, useEffect } from 'react';
import './Dashboard8x8.css';
import PillarScoreCard from './PillarScoreCard';
import Portfolio8x8Display from './Portfolio8x8Display';
import Scores8x8Table from './Scores8x8Table';
import Rebalance8x8Panel from './Rebalance8x8Panel';

const Dashboard8x8 = () => {
  const [activeTab, setActiveTab] = useState('portfolio');
  const [portfolio, setPortfolio] = useState(null);
  const [allScores, setAllScores] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState('checking');
  const [lastRebalance, setLastRebalance] = useState(null);

  useEffect(() => {
    checkApiHealth();
    loadData();
  }, []);

  const checkApiHealth = async () => {
    try {
      const response = await fetch('http://localhost:8000/health');
      if (response.ok) {
        setApiStatus('connected');
      } else {
        setApiStatus('disconnected');
      }
    } catch (err) {
      setApiStatus('disconnected');
      setError('Cannot connect to backend API. Please ensure the FastAPI server is running on port 8000.');
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load portfolio
      try {
        const portfolioResponse = await fetch('http://localhost:8000/api/portfolio-8x8');
        if (portfolioResponse.ok) {
          const portfolioData = await portfolioResponse.json();
          setPortfolio(portfolioData);
          setLastRebalance(new Date(portfolioData.rebalance_date));
        }
      } catch (err) {
        console.log('No 8x8 portfolio available yet');
      }

      // Load all scores
      try {
        const scoresResponse = await fetch('http://localhost:8000/api/scores-8x8');
        if (scoresResponse.ok) {
          const scoresData = await scoresResponse.json();
          setAllScores(scoresData);
        }
      } catch (err) {
        console.log('No 8x8 scores available yet');
      }
    } catch (err) {
      setError('Failed to load 8x8 Framework data');
    } finally {
      setLoading(false);
    }
  };

  const handleRebalance = async (universe = 'test') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8000/api/rebalance-8x8', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ universe })
      });
      
      if (!response.ok) {
        throw new Error('Rebalance failed');
      }
      
      const result = await response.json();
      console.log('Rebalance result:', result);
      
      // Reload data
      await loadData();
      setLastRebalance(new Date());
      
      return result;
    } catch (err) {
      setError('Rebalance failed: ' + err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-8x8">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="title-section">
            <h1>8×8 Framework Portfolio</h1>
            <p className="framework-tagline">8 Pillars × 8 Stocks = Systematic Excellence</p>
          </div>
          <div className="status-section">
            <div className="api-status">
              <span className={`status-indicator ${apiStatus}`}></span>
              <span>API: {apiStatus}</span>
            </div>
            {lastRebalance && (
              <div className="last-rebalance">
                Last rebalance: {lastRebalance.toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <nav className="dashboard-nav">
        <button
          className={`nav-tab ${activeTab === 'portfolio' ? 'active' : ''}`}
          onClick={() => setActiveTab('portfolio')}
        >
          <span className="tab-icon">📊</span>
          Portfolio
        </button>
        <button
          className={`nav-tab ${activeTab === 'scores' ? 'active' : ''}`}
          onClick={() => setActiveTab('scores')}
        >
          <span className="tab-icon">📈</span>
          All Scores
        </button>
        <button
          className={`nav-tab ${activeTab === 'rebalance' ? 'active' : ''}`}
          onClick={() => setActiveTab('rebalance')}
        >
          <span className="tab-icon">⚖️</span>
          Rebalance
        </button>
        <button
          className={`nav-tab ${activeTab === 'framework' ? 'active' : ''}`}
          onClick={() => setActiveTab('framework')}
        >
          <span className="tab-icon">📖</span>
          Framework
        </button>
      </nav>

      <div className="dashboard-content">
        {activeTab === 'portfolio' && (
          <Portfolio8x8Display 
            portfolio={portfolio} 
            loading={loading}
          />
        )}
        
        {activeTab === 'scores' && (
          <Scores8x8Table 
            scoresData={allScores}
            portfolio={portfolio}
            loading={loading}
          />
        )}
        
        {activeTab === 'rebalance' && (
          <Rebalance8x8Panel 
            onRebalance={handleRebalance}
            loading={loading}
          />
        )}
        
        {activeTab === 'framework' && (
          <div className="framework-explanation">
            <h2>The 8×8 Framework</h2>
            <div className="framework-grid">
              <div className="framework-section">
                <h3>8 Pillars of Excellence</h3>
                <ol className="pillars-list">
                  <li><strong>Moat (ROIC)</strong> - Return on invested capital &gt; 20%</li>
                  <li><strong>Fortress (Debt/EBITDA)</strong> - Balance sheet strength &lt; 2.5x</li>
                  <li><strong>Engine (Revenue CAGR)</strong> - 3-year growth &gt; 10%</li>
                  <li><strong>Efficiency (Rule of 40)</strong> - Growth + FCF margin &gt; 40</li>
                  <li><strong>Pricing Power</strong> - Top 40% gross margin in industry</li>
                  <li><strong>Capital Allocation</strong> - ROE &gt; 15% with disciplined buybacks</li>
                  <li><strong>Cash Generation</strong> - FCF margin &gt; 12%</li>
                  <li><strong>Durability</strong> - Market share × TAM growth</li>
                </ol>
              </div>
              
              <div className="framework-section">
                <h3>Selection Rules</h3>
                <ul className="rules-list">
                  <li>Each pillar scored 0-8 points</li>
                  <li>Any 0 = automatic elimination</li>
                  <li>Minimum 32 total points to qualify</li>
                  <li>Select exactly top 8 stocks</li>
                  <li>Weight by (Score - 30) / Total</li>
                  <li>Quarterly rebalancing</li>
                  <li>Monthly emergency checks</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="dashboard-footer">
        <button className="refresh-button" onClick={loadData} disabled={loading}>
          {loading ? 'Loading...' : '🔄 Refresh Data'}
        </button>
      </footer>
    </div>
  );
};

export default Dashboard8x8;