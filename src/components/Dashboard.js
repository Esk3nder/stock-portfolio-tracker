import React, { useState, useEffect } from 'react';
import EightPillarsScreen from './EightPillarsScreen';
import EightPillarsDashboard from './EightPillarsDashboard';
import EightPillarsPortfolio from './EightPillarsPortfolio';
import EightPillarsGuide from './EightPillarsGuide';
import portfolioApi from '../services/portfolioApi';
import './Dashboard.css';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('screening');
  const [scores, setScores] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [eightPillarsAnalysis] = useState(null);
  const [eightPillarsScreening] = useState(null);
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
        <div className="header-content">
          <h1>Eight Pillars Elite Stock Screener</h1>
          <p className="header-subtitle">Systematic Framework for Identifying Elite Compounding Equities</p>
        </div>
        <div className="api-status">
          <span className={`status-indicator ${apiStatus}`}></span>
          <span>Data: {apiStatus}</span>
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
          className={`nav-tab ${activeTab === 'screening' ? 'active' : ''}`}
          onClick={() => setActiveTab('screening')}
        >
          <span className="tab-icon">🔍</span>
          <span className="tab-label">Screening</span>
        </button>
        <button
          className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <span className="tab-icon">📊</span>
          <span className="tab-label">Analytics</span>
        </button>
        <button
          className={`nav-tab ${activeTab === 'portfolio' ? 'active' : ''}`}
          onClick={() => setActiveTab('portfolio')}
        >
          <span className="tab-icon">💼</span>
          <span className="tab-label">Portfolio</span>
        </button>
        <button
          className={`nav-tab ${activeTab === 'framework' ? 'active' : ''}`}
          onClick={() => setActiveTab('framework')}
        >
          <span className="tab-icon">📚</span>
          <span className="tab-label">Framework</span>
        </button>
      </nav>

      <div className="dashboard-content">
        {activeTab === 'screening' && (
          <EightPillarsScreen />
        )}
        
        {activeTab === 'dashboard' && (
          <EightPillarsDashboard 
            analysis={eightPillarsAnalysis} 
            screeningResults={eightPillarsScreening}
          />
        )}
        
        {activeTab === 'portfolio' && (
          <EightPillarsPortfolio 
            portfolio={portfolio}
            scores={scores}
            loading={loading}
            onRebalanceComplete={handleRebalanceComplete}
          />
        )}
        
        {activeTab === 'framework' && (
          <EightPillarsGuide />
        )}
      </div>

    </div>
  );
};

export default Dashboard;