import React from 'react';
import PillarScoreCard from './PillarScoreCard';
import './Portfolio8x8Display.css';

const Portfolio8x8Display = ({ portfolio, loading }) => {
  if (loading) {
    return (
      <div className="portfolio-loading">
        <div className="loading-spinner"></div>
        <p>Loading 8×8 Portfolio...</p>
      </div>
    );
  }

  if (!portfolio || !portfolio.portfolio) {
    return (
      <div className="portfolio-empty">
        <div className="empty-icon">📊</div>
        <h2>No Portfolio Yet</h2>
        <p>Run a rebalance to generate your 8×8 Framework portfolio</p>
      </div>
    );
  }

  const totalScore = portfolio.portfolio.reduce((sum, p) => sum + p.total_score, 0);
  const avgScore = totalScore / portfolio.portfolio.length;

  return (
    <div className="portfolio-8x8">
      <div className="portfolio-header">
        <div className="portfolio-stats">
          <div className="stat-card">
            <div className="stat-label">Positions</div>
            <div className="stat-value">{portfolio.total_positions}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Average Score</div>
            <div className="stat-value">{avgScore.toFixed(1)}<span className="stat-unit">/64</span></div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Rebalance Type</div>
            <div className="stat-value capitalize">{portfolio.rebalance_type}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Date</div>
            <div className="stat-value">{new Date(portfolio.rebalance_date).toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      <div className="portfolio-grid">
        {portfolio.portfolio.map((position, index) => (
          <div key={position.ticker} className="position-card">
            <div className="position-header">
              <div className="position-rank">#{position.rank}</div>
              <div className="position-weight">{(position.weight * 100).toFixed(1)}%</div>
            </div>
            
            <div className="position-info">
              <h3 className="position-ticker">{position.ticker}</h3>
              <p className="position-name">{position.name}</p>
              <p className="position-sector">{position.sector}</p>
            </div>

            <div className="position-scores">
              <div className="total-score">
                <span className="score-label">Total Score</span>
                <span className="score-value">
                  {position.total_score}
                  <span className="score-max">/64</span>
                </span>
              </div>
              <div className="points-above-base">
                <span className="score-label">Points Above Base</span>
                <span className="score-value">{position.points_above_base}</span>
              </div>
            </div>

            <PillarScoreCard scores={position.pillar_scores} compact={false} />
          </div>
        ))}
      </div>

      <div className="portfolio-chart">
        <h3>Portfolio Weights</h3>
        <div className="weights-chart">
          {portfolio.portfolio.map((position) => (
            <div 
              key={position.ticker}
              className="weight-bar"
              style={{ width: `${position.weight * 100}%` }}
              title={`${position.ticker}: ${(position.weight * 100).toFixed(1)}%`}
            >
              <span className="weight-label">
                {position.ticker} ({(position.weight * 100).toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Portfolio8x8Display;