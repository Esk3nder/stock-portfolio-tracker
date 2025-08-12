import React, { useState } from 'react';
import PillarScoreCard from './PillarScoreCard';
import './Scores8x8Table.css';

const Scores8x8Table = ({ scoresData, portfolio, loading }) => {
  const [sortBy, setSortBy] = useState('total_score');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterType, setFilterType] = useState('all'); // all, qualified, eliminated, portfolio

  if (loading) {
    return (
      <div className="scores-loading">
        <div className="loading-spinner"></div>
        <p>Loading scores...</p>
      </div>
    );
  }

  if (!scoresData || !scoresData.scores) {
    return (
      <div className="scores-empty">
        <div className="empty-icon">📊</div>
        <h2>No Scores Available</h2>
        <p>Run a rebalance to generate scores for all stocks</p>
      </div>
    );
  }

  // Get portfolio tickers for highlighting
  const portfolioTickers = portfolio?.portfolio?.map(p => p.ticker) || [];

  // Filter scores
  let filteredScores = [...scoresData.scores];
  switch (filterType) {
    case 'qualified':
      filteredScores = filteredScores.filter(s => !s.is_eliminated && s.total_score >= 32);
      break;
    case 'eliminated':
      filteredScores = filteredScores.filter(s => s.is_eliminated);
      break;
    case 'portfolio':
      filteredScores = filteredScores.filter(s => portfolioTickers.includes(s.ticker));
      break;
    default:
      // Show all
      break;
  }

  // Sort scores
  const sortedScores = filteredScores.sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    
    // Handle nested values
    if (sortBy.includes('.')) {
      const keys = sortBy.split('.');
      aVal = keys.reduce((obj, key) => obj?.[key], a);
      bVal = keys.reduce((obj, key) => obj?.[key], b);
    }
    
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="scores-8x8-table">
      <div className="table-header">
        <div className="table-stats">
          <div className="stat">
            <span className="stat-label">Total Scored:</span>
            <span className="stat-value">{scoresData.total_scored}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Qualified:</span>
            <span className="stat-value qualified">{scoresData.qualified_count}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Eliminated:</span>
            <span className="stat-value eliminated">{scoresData.eliminated_count}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Avg Score:</span>
            <span className="stat-value">{scoresData.average_score.toFixed(1)}</span>
          </div>
        </div>

        <div className="table-filters">
          <button
            className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            All ({scoresData.total_scored})
          </button>
          <button
            className={`filter-btn ${filterType === 'qualified' ? 'active' : ''}`}
            onClick={() => setFilterType('qualified')}
          >
            Qualified ({scoresData.qualified_count})
          </button>
          <button
            className={`filter-btn ${filterType === 'eliminated' ? 'active' : ''}`}
            onClick={() => setFilterType('eliminated')}
          >
            Eliminated ({scoresData.eliminated_count})
          </button>
          <button
            className={`filter-btn ${filterType === 'portfolio' ? 'active' : ''}`}
            onClick={() => setFilterType('portfolio')}
          >
            Portfolio (8)
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="scores-table">
          <thead>
            <tr>
              <th className="rank-col">#</th>
              <th 
                className="sortable ticker-col"
                onClick={() => handleSort('ticker')}
              >
                Ticker {sortBy === 'ticker' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="name-col">Name</th>
              <th 
                className="sortable sector-col"
                onClick={() => handleSort('sector')}
              >
                Sector {sortBy === 'sector' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="sortable score-col"
                onClick={() => handleSort('total_score')}
              >
                Total {sortBy === 'total_score' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="pillars-col">8 Pillars</th>
              <th className="status-col">Status</th>
            </tr>
          </thead>
          <tbody>
            {sortedScores.map((score, index) => {
              const isInPortfolio = portfolioTickers.includes(score.ticker);
              const portfolioRank = portfolioTickers.indexOf(score.ticker) + 1;
              
              return (
                <tr 
                  key={score.ticker}
                  className={`
                    ${score.is_eliminated ? 'eliminated-row' : ''}
                    ${isInPortfolio ? 'portfolio-row' : ''}
                  `}
                >
                  <td className="rank-col">
                    {isInPortfolio ? (
                      <span className="portfolio-rank">P{portfolioRank}</span>
                    ) : (
                      index + 1
                    )}
                  </td>
                  <td className="ticker-col">
                    <span className="ticker">{score.ticker}</span>
                  </td>
                  <td className="name-col">{score.name}</td>
                  <td className="sector-col">{score.sector}</td>
                  <td className="score-col">
                    <span className={`total-score ${score.total_score >= 50 ? 'high' : score.total_score >= 40 ? 'medium' : 'low'}`}>
                      {score.total_score}
                    </span>
                  </td>
                  <td className="pillars-col">
                    <PillarScoreCard scores={score.pillar_scores} compact={true} />
                  </td>
                  <td className="status-col">
                    {score.is_eliminated ? (
                      <span className="status eliminated" title={score.elimination_reason}>
                        ❌ Eliminated
                      </span>
                    ) : score.total_score >= 32 ? (
                      <span className="status qualified">
                        ✅ Qualified
                      </span>
                    ) : (
                      <span className="status below-min">
                        ⚠️ Below Min
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Scores8x8Table;