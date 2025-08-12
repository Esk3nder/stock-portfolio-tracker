import React, { useState, useEffect } from 'react';
import './ScoreTable.css';

const ScoreTable = ({ scores, loading }) => {
  const [sortField, setSortField] = useState('final_score');
  const [sortDirection, setSortDirection] = useState('desc');
  const [sortedScores, setSortedScores] = useState([]);

  useEffect(() => {
    if (scores && scores.length > 0) {
      const sorted = [...scores].sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        
        if (sortDirection === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
      setSortedScores(sorted);
    }
  }, [scores, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 75) return '#4caf50';
    if (score >= 50) return '#ff9800';
    return '#f44336';
  };

  if (loading) {
    return <div className="loading">Loading scores...</div>;
  }

  if (!scores || scores.length === 0) {
    return <div className="no-data">No scores available. Run rebalance to generate scores.</div>;
  }

  return (
    <div className="score-table-container">
      <h2>Stock Scores</h2>
      <table className="score-table">
        <thead>
          <tr>
            <th onClick={() => handleSort('ticker')}>
              Ticker {sortField === 'ticker' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('name')}>
              Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('sector')}>
              Sector {sortField === 'sector' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('economics_score')}>
              Economics {sortField === 'economics_score' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('pricing_power_score')}>
              Pricing Power {sortField === 'pricing_power_score' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('final_score')}>
              Final Score {sortField === 'final_score' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('volatility')}>
              Volatility {sortField === 'volatility' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedScores.map((stock) => (
            <tr key={stock.ticker}>
              <td className="ticker">{stock.ticker}</td>
              <td>{stock.name}</td>
              <td>{stock.sector}</td>
              <td className="score">
                <span style={{ color: getScoreColor(stock.economics_score) }}>
                  {stock.economics_score.toFixed(1)}
                </span>
              </td>
              <td className="score">
                <span style={{ color: getScoreColor(stock.pricing_power_score) }}>
                  {stock.pricing_power_score.toFixed(1)}
                </span>
              </td>
              <td className="score final">
                <span style={{ color: getScoreColor(stock.final_score) }}>
                  {stock.final_score.toFixed(1)}
                </span>
              </td>
              <td className="volatility">{(stock.volatility * 100).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ScoreTable;