import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import './PortfolioPie.css';

const PortfolioPie = ({ portfolio, loading }) => {
  // Color palette for the pie chart
  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
    '#82ca9d', '#ffc658', '#8dd1e1', '#d084d0', '#ffb3b3',
    '#a4de6c', '#ffd93d', '#6bcf7f', '#ff6b9d', '#c56cf0'
  ];

  if (loading) {
    return <div className="loading">Loading portfolio...</div>;
  }

  if (!portfolio || !portfolio.weights || portfolio.weights.length === 0) {
    return <div className="no-data">No portfolio data available. Run rebalance to generate portfolio.</div>;
  }

  // Prepare data for pie chart
  const pieData = portfolio.weights.map((stock, index) => ({
    name: stock.ticker,
    value: parseFloat((stock.weight * 100).toFixed(2)),
    score: stock.score.toFixed(1),
    sector: stock.sector
  }));

  // Custom label
  const renderCustomLabel = (entry) => {
    if (entry.value > 2) {  // Only show label if > 2%
      return `${entry.name}: ${entry.value}%`;
    }
    return '';
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="custom-tooltip">
          <p className="ticker">{data.name}</p>
          <p>Weight: {data.value}%</p>
          <p>Score: {data.payload.score}</p>
          <p>Sector: {data.payload.sector}</p>
        </div>
      );
    }
    return null;
  };

  // Calculate portfolio metrics
  const totalWeight = pieData.reduce((sum, item) => sum + item.value, 0);
  const avgScore = portfolio.weights.reduce((sum, item) => sum + item.score * item.weight, 0);

  return (
    <div className="portfolio-pie-container">
      <h2>Portfolio Allocation</h2>
      
      <div className="portfolio-metrics">
        <div className="metric">
          <span className="metric-label">Total Stocks:</span>
          <span className="metric-value">{portfolio.total_stocks}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Avg Score:</span>
          <span className="metric-value">{avgScore.toFixed(1)}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Total Weight:</span>
          <span className="metric-value">{totalWeight.toFixed(1)}%</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      <div className="portfolio-table">
        <h3>Holdings Detail</h3>
        <table>
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Weight</th>
              <th>Score</th>
              <th>Sector</th>
            </tr>
          </thead>
          <tbody>
            {portfolio.weights.map((stock) => (
              <tr key={stock.ticker}>
                <td className="ticker">{stock.ticker}</td>
                <td>{(stock.weight * 100).toFixed(2)}%</td>
                <td>{stock.score.toFixed(1)}</td>
                <td>{stock.sector}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PortfolioPie;