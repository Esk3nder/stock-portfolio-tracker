import React, { useState, useEffect } from 'react';
import ScoreTable from './ScoreTable';
import PortfolioPie from './PortfolioPie';
import RebalancePanel from './RebalancePanel';
import portfolioApi from '../services/portfolioApi';
import './Dashboard.css';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('scores');
  const [scores, setScores] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState('checking');

  // Check API health on mount
  useEffect(() => {
    checkApiHealth();
    loadData();
  }, []);

  const checkApiHealth = async () => {
    try {
      await portfolioApi.healthCheck();
      setApiStatus('connected');
    } catch (err) {
      setApiStatus('disconnected');
      setError('Cannot connect to backend API. Please ensure the FastAPI server is running on port 8000.');
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to load scores
      try {
        const scoresData = await portfolioApi.getScores();
        setScores(scoresData.scores);
      } catch (err) {
        console.log('No scores available yet');
      }

      // Try to load portfolio
      try {
        const portfolioData = await portfolioApi.getPortfolio();
        setPortfolio(portfolioData);
      } catch (err) {
        console.log('No portfolio available yet');
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleRebalanceComplete = () => {
    // Reload data after successful rebalance
    loadData();
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Pricing Power Portfolio</h1>
        <div className="api-status">
          <span className={`status-indicator ${apiStatus}`}></span>
          <span>API: {apiStatus}</span>
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
          className={`nav-tab ${activeTab === 'scores' ? 'active' : ''}`}
          onClick={() => setActiveTab('scores')}
        >
          Stock Scores
        </button>
        <button
          className={`nav-tab ${activeTab === 'portfolio' ? 'active' : ''}`}
          onClick={() => setActiveTab('portfolio')}
        >
          Portfolio
        </button>
        <button
          className={`nav-tab ${activeTab === 'rebalance' ? 'active' : ''}`}
          onClick={() => setActiveTab('rebalance')}
        >
          Rebalance
        </button>
      </nav>

      <div className="dashboard-content">
        {activeTab === 'scores' && (
          <ScoreTable scores={scores} loading={loading} />
        )}
        
        {activeTab === 'portfolio' && (
          <PortfolioPie portfolio={portfolio} loading={loading} />
        )}
        
        {activeTab === 'rebalance' && (
          <RebalancePanel onRebalanceComplete={handleRebalanceComplete} />
        )}
      </div>

      <button className="refresh-button" onClick={loadData} disabled={loading}>
        {loading ? 'Loading...' : 'Refresh Data'}
      </button>
    </div>
  );
};

export default Dashboard;