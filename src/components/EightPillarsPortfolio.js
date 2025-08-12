/**
 * Eight Pillars Portfolio Component
 * Portfolio management focused on Eight Pillars Framework compliance
 */

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import eightPillarsEngine from '../services/eightPillarsEngine';
import './EightPillarsPortfolio.css';

const EightPillarsPortfolio = ({ portfolio, scores, loading, onRebalanceComplete }) => {
  const [portfolioAnalysis, setPortfolioAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [watchlist, setWatchlist] = useState([]);
  const [selectedView, setSelectedView] = useState('overview'); // 'overview', 'analysis', 'watchlist'

  // Load watchlist from localStorage
  useEffect(() => {
    const savedWatchlist = localStorage.getItem('eightPillarsWatchlist');
    if (savedWatchlist) {
      setWatchlist(JSON.parse(savedWatchlist));
    }
  }, []);

  // Analyze portfolio stocks against Eight Pillars
  const analyzePortfolio = async () => {
    if (!portfolio || !portfolio.holdings) return;

    setAnalyzing(true);
    const analyses = [];

    for (const holding of portfolio.holdings) {
      try {
        const analysis = await eightPillarsEngine.analyzeStock(holding.symbol);
        analyses.push({
          ...analysis,
          shares: holding.shares,
          value: holding.value,
          weight: holding.weight
        });
      } catch (error) {
        console.error(`Failed to analyze ${holding.symbol}:`, error);
      }
    }

    setPortfolioAnalysis(analyses);
    setAnalyzing(false);
  };

  // Calculate portfolio-wide Eight Pillars score
  const calculatePortfolioScore = () => {
    if (!portfolioAnalysis) return null;

    let weightedScore = 0;
    let totalWeight = 0;

    portfolioAnalysis.forEach(stock => {
      const score = stock.summary.totalScore;
      const weight = stock.weight || 0;
      weightedScore += score * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? (weightedScore / totalWeight).toFixed(1) : 0;
  };

  // Prepare data for portfolio quality pie chart
  const prepareQualityDistribution = () => {
    if (!portfolioAnalysis) return [];

    const distribution = {
      elite: 0,
      strong: 0,
      moderate: 0,
      weak: 0
    };

    portfolioAnalysis.forEach(stock => {
      const score = stock.summary.totalScore;
      const value = stock.value || 0;
      
      if (score >= 7) distribution.elite += value;
      else if (score >= 6) distribution.strong += value;
      else if (score >= 4) distribution.moderate += value;
      else distribution.weak += value;
    });

    const total = Object.values(distribution).reduce((sum, val) => sum + val, 0);

    return [
      { name: 'Elite (7-8 Pillars)', value: distribution.elite, percent: (distribution.elite / total * 100).toFixed(1) },
      { name: 'Strong (6 Pillars)', value: distribution.strong, percent: (distribution.strong / total * 100).toFixed(1) },
      { name: 'Moderate (4-5)', value: distribution.moderate, percent: (distribution.moderate / total * 100).toFixed(1) },
      { name: 'Weak (0-3)', value: distribution.weak, percent: (distribution.weak / total * 100).toFixed(1) }
    ].filter(d => d.value > 0);
  };

  // Add stock to watchlist
  const addToWatchlist = (symbol) => {
    const newWatchlist = [...watchlist, { symbol, dateAdded: new Date().toISOString() }];
    setWatchlist(newWatchlist);
    localStorage.setItem('eightPillarsWatchlist', JSON.stringify(newWatchlist));
  };

  // Remove from watchlist
  const removeFromWatchlist = (symbol) => {
    const newWatchlist = watchlist.filter(item => item.symbol !== symbol);
    setWatchlist(newWatchlist);
    localStorage.setItem('eightPillarsWatchlist', JSON.stringify(newWatchlist));
  };

  const COLORS = {
    elite: '#667eea',
    strong: '#28a745',
    moderate: '#ffc107',
    weak: '#dc3545'
  };

  const getColorForScore = (score) => {
    if (score >= 7) return COLORS.elite;
    if (score >= 6) return COLORS.strong;
    if (score >= 4) return COLORS.moderate;
    return COLORS.weak;
  };

  // Render portfolio overview
  const renderOverview = () => {
    const portfolioScore = calculatePortfolioScore();
    const distribution = prepareQualityDistribution();

    return (
      <div className="portfolio-overview">
        <div className="overview-header">
          <h2>Portfolio Eight Pillars Analysis</h2>
          {portfolioScore && (
            <div className="portfolio-score">
              <span className="score-label">Portfolio Score:</span>
              <span className={`score-value ${portfolioScore >= 6 ? 'good' : portfolioScore >= 4 ? 'moderate' : 'poor'}`}>
                {portfolioScore}/8
              </span>
            </div>
          )}
        </div>

        {!portfolioAnalysis ? (
          <div className="analysis-prompt">
            <p>Analyze your portfolio against the Eight Pillars Framework</p>
            <button 
              className="btn-analyze-portfolio"
              onClick={analyzePortfolio}
              disabled={analyzing || !portfolio}
            >
              {analyzing ? 'Analyzing...' : 'Analyze Portfolio'}
            </button>
          </div>
        ) : (
          <div className="overview-content">
            <div className="distribution-chart">
              <h3>Quality Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={distribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${percent}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {distribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={
                          entry.name.includes('Elite') ? COLORS.elite :
                          entry.name.includes('Strong') ? COLORS.strong :
                          entry.name.includes('Moderate') ? COLORS.moderate :
                          COLORS.weak
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${(value/1000).toFixed(1)}k`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="holdings-table">
              <h3>Holdings Analysis</h3>
              <table>
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Company</th>
                    <th>Score</th>
                    <th>Weight</th>
                    <th>Value</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolioAnalysis.map(stock => (
                    <tr key={stock.symbol}>
                      <td className="symbol">{stock.symbol}</td>
                      <td className="company">{stock.companyName}</td>
                      <td>
                        <span 
                          className="score-badge"
                          style={{ backgroundColor: getColorForScore(stock.summary.totalScore) }}
                        >
                          {stock.summary.totalScore}/8
                        </span>
                      </td>
                      <td>{(stock.weight * 100).toFixed(1)}%</td>
                      <td>${(stock.value / 1000).toFixed(1)}k</td>
                      <td>
                        <button 
                          className="btn-details"
                          onClick={() => setSelectedView('analysis')}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="recommendations">
              <h3>Optimization Recommendations</h3>
              <ul>
                {portfolioScore < 6 && (
                  <li className="recommendation-item warning">
                    ⚠️ Portfolio average score is below 6. Consider replacing weak performers.
                  </li>
                )}
                {distribution.find(d => d.name.includes('Weak'))?.percent > 20 && (
                  <li className="recommendation-item warning">
                    ⚠️ Over 20% of portfolio in weak stocks (0-3 pillars). Review these positions.
                  </li>
                )}
                {distribution.find(d => d.name.includes('Elite'))?.percent < 30 && (
                  <li className="recommendation-item info">
                    💡 Less than 30% in elite stocks. Look for more 7-8 pillar opportunities.
                  </li>
                )}
                {portfolioAnalysis.some(s => s.fortress.debtToEbitda > 5) && (
                  <li className="recommendation-item warning">
                    ⚠️ Some holdings have high debt levels. Monitor financial stability.
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render detailed analysis view
  const renderAnalysis = () => {
    if (!portfolioAnalysis) {
      return (
        <div className="no-analysis">
          <p>No analysis available. Please analyze your portfolio first.</p>
          <button onClick={() => setSelectedView('overview')}>Back to Overview</button>
        </div>
      );
    }

    return (
      <div className="detailed-analysis">
        <div className="analysis-header">
          <button onClick={() => setSelectedView('overview')} className="btn-back">
            ← Back to Overview
          </button>
          <h2>Detailed Portfolio Analysis</h2>
        </div>

        <div className="pillar-comparison">
          <h3>Pillar-by-Pillar Comparison</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={portfolioAnalysis.map(stock => ({
                name: stock.symbol,
                moat: stock.moat.assessment?.passes ? 1 : 0,
                fortress: stock.fortress.assessment?.passes ? 1 : 0,
                engine: stock.engine.assessment?.passes ? 1 : 0,
                efficiency: stock.efficiency.assessment?.passes ? 1 : 0,
                pricing: stock.pricingPower.assessment?.passes ? 1 : 0,
                allocation: stock.capitalAllocation.assessment?.passes ? 1 : 0,
                cash: stock.cashGeneration.assessment?.passes ? 1 : 0,
                durability: stock.durability.assessment?.passes ? 1 : 0
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="moat" stackId="a" fill="#8884d8" name="Moat" />
              <Bar dataKey="fortress" stackId="a" fill="#82ca9d" name="Fortress" />
              <Bar dataKey="engine" stackId="a" fill="#ffc658" name="Engine" />
              <Bar dataKey="efficiency" stackId="a" fill="#ff7c7c" name="Efficiency" />
              <Bar dataKey="pricing" stackId="a" fill="#8dd1e1" name="Pricing" />
              <Bar dataKey="allocation" stackId="a" fill="#d084d0" name="Allocation" />
              <Bar dataKey="cash" stackId="a" fill="#ffb347" name="Cash" />
              <Bar dataKey="durability" stackId="a" fill="#67b7dc" name="Durability" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Render watchlist
  const renderWatchlist = () => {
    return (
      <div className="watchlist-view">
        <h2>Eight Pillars Watchlist</h2>
        <p>Track stocks that meet the Eight Pillars criteria</p>
        
        <div className="watchlist-content">
          {watchlist.length === 0 ? (
            <div className="empty-watchlist">
              <p>Your watchlist is empty</p>
              <p>Add stocks from the screening results that meet 6+ pillars</p>
            </div>
          ) : (
            <div className="watchlist-grid">
              {watchlist.map(item => (
                <div key={item.symbol} className="watchlist-item">
                  <span className="watchlist-symbol">{item.symbol}</span>
                  <span className="watchlist-date">
                    Added: {new Date(item.dateAdded).toLocaleDateString()}
                  </span>
                  <button 
                    className="btn-remove"
                    onClick={() => removeFromWatchlist(item.symbol)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="eight-pillars-portfolio">
      <div className="portfolio-tabs">
        <button 
          className={`portfolio-tab ${selectedView === 'overview' ? 'active' : ''}`}
          onClick={() => setSelectedView('overview')}
        >
          Overview
        </button>
        <button 
          className={`portfolio-tab ${selectedView === 'analysis' ? 'active' : ''}`}
          onClick={() => setSelectedView('analysis')}
        >
          Detailed Analysis
        </button>
        <button 
          className={`portfolio-tab ${selectedView === 'watchlist' ? 'active' : ''}`}
          onClick={() => setSelectedView('watchlist')}
        >
          Watchlist ({watchlist.length})
        </button>
      </div>

      <div className="portfolio-content">
        {selectedView === 'overview' && renderOverview()}
        {selectedView === 'analysis' && renderAnalysis()}
        {selectedView === 'watchlist' && renderWatchlist()}
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
};

export default EightPillarsPortfolio;