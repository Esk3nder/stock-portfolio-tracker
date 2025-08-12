import React from 'react';
import './StockCard.css';

const StockCard = ({ stock, onRemove, shares, onUpdateShares }) => {
  const totalValue = stock.price * shares;
  const totalChange = stock.change * shares;
  const isPositive = stock.change >= 0;

  return (
    <div className="stock-card">
      <div className="stock-header">
        <h3>{stock.symbol}</h3>
        <button className="remove-button" onClick={() => onRemove(stock.symbol)}>
          ×
        </button>
      </div>
      
      <div className="stock-price">
        <span className="current-price">${stock.price.toFixed(2)}</span>
        <span className={`price-change ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent})
        </span>
      </div>

      <div className="stock-details">
        <div className="detail-row">
          <span>Open:</span>
          <span>${stock.open.toFixed(2)}</span>
        </div>
        <div className="detail-row">
          <span>High:</span>
          <span>${stock.high.toFixed(2)}</span>
        </div>
        <div className="detail-row">
          <span>Low:</span>
          <span>${stock.low.toFixed(2)}</span>
        </div>
        <div className="detail-row">
          <span>Volume:</span>
          <span>{stock.volume.toLocaleString()}</span>
        </div>
      </div>

      <div className="portfolio-section">
        <div className="shares-input">
          <label>Shares:</label>
          <input
            type="number"
            value={shares}
            onChange={(e) => onUpdateShares(stock.symbol, parseInt(e.target.value) || 0)}
            min="0"
          />
        </div>
        <div className="portfolio-value">
          <div>Total Value: ${totalValue.toFixed(2)}</div>
          <div className={`total-change ${totalChange >= 0 ? 'positive' : 'negative'}`}>
            {totalChange >= 0 ? '+' : ''}${totalChange.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="last-update">
        Last updated: {stock.latestTradingDay}
      </div>
    </div>
  );
};

export default StockCard;