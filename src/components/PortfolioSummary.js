import React from 'react';
import './PortfolioSummary.css';

const PortfolioSummary = ({ stocks, shares }) => {
  const calculateTotals = () => {
    let totalValue = 0;
    let totalChange = 0;
    let totalCost = 0;

    stocks.forEach(stock => {
      const stockShares = shares[stock.symbol] || 0;
      totalValue += stock.price * stockShares;
      totalChange += stock.change * stockShares;
      totalCost += stock.previousClose * stockShares;
    });

    const percentChange = totalCost > 0 ? ((totalChange / totalCost) * 100) : 0;

    return {
      totalValue,
      totalChange,
      percentChange,
      totalCost
    };
  };

  const { totalValue, totalChange, percentChange } = calculateTotals();
  const isPositive = totalChange >= 0;

  return (
    <div className="portfolio-summary">
      <h2>Portfolio Summary</h2>
      <div className="summary-content">
        <div className="summary-item">
          <span className="summary-label">Total Value</span>
          <span className="summary-value">${totalValue.toFixed(2)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Today's Change</span>
          <span className={`summary-value ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? '+' : ''}${totalChange.toFixed(2)} ({percentChange.toFixed(2)}%)
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Holdings</span>
          <span className="summary-value">{stocks.length} stocks</span>
        </div>
      </div>
    </div>
  );
};

export default PortfolioSummary;