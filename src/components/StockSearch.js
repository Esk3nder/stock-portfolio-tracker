import React, { useState } from 'react';
import { searchStocks } from '../services/stockService';
import './StockSearch.css';

const StockSearch = ({ onAddStock }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      const results = await searchStocks(searchTerm);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStock = (stock) => {
    onAddStock(stock['1. symbol']);
    setSearchResults([]);
    setSearchTerm('');
  };

  return (
    <div className="stock-search">
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search for stocks..."
          className="search-input"
        />
        <button type="submit" disabled={loading} className="search-button">
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {searchResults.length > 0 && (
        <div className="search-results">
          {searchResults.map((stock, index) => (
            <div key={index} className="search-result-item">
              <div>
                <strong>{stock['1. symbol']}</strong> - {stock['2. name']}
                <br />
                <small>{stock['4. region']} • {stock['3. type']}</small>
              </div>
              <button
                onClick={() => handleAddStock(stock)}
                className="add-button"
              >
                Add
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StockSearch;