import { useState, useEffect, useCallback } from 'react';
import { getStockQuote, batchUpdateStocks } from '../services/stockService';

const usePortfolio = () => {
  const [stocks, setStocks] = useState([]);
  const [shares, setShares] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    const savedStocks = localStorage.getItem('portfolio-stocks');
    const savedShares = localStorage.getItem('portfolio-shares');
    
    if (savedStocks) {
      setStocks(JSON.parse(savedStocks));
    }
    if (savedShares) {
      setShares(JSON.parse(savedShares));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('portfolio-stocks', JSON.stringify(stocks));
  }, [stocks]);

  useEffect(() => {
    localStorage.setItem('portfolio-shares', JSON.stringify(shares));
  }, [shares]);

  const addStock = async (symbol) => {
    if (stocks.some(s => s.symbol === symbol)) {
      setError('Stock already in portfolio');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const quote = await getStockQuote(symbol);
      setStocks(prev => [...prev, quote]);
      setShares(prev => ({ ...prev, [symbol]: 0 }));
    } catch (err) {
      setError(`Failed to add ${symbol}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const removeStock = (symbol) => {
    setStocks(prev => prev.filter(s => s.symbol !== symbol));
    setShares(prev => {
      const newShares = { ...prev };
      delete newShares[symbol];
      return newShares;
    });
  };

  const updateShares = (symbol, count) => {
    setShares(prev => ({ ...prev, [symbol]: count }));
  };

  const refreshAllStocks = useCallback(async () => {
    if (stocks.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const symbols = stocks.map(s => s.symbol);
      const updates = await batchUpdateStocks(symbols);
      
      const validUpdates = updates.filter(u => !u.error);
      if (validUpdates.length > 0) {
        setStocks(validUpdates);
        setLastUpdate(new Date());
      }
      
      if (updates.some(u => u.error)) {
        setError('Some stocks failed to update');
      }
    } catch (err) {
      setError('Failed to refresh stocks');
    } finally {
      setLoading(false);
    }
  }, [stocks]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshAllStocks();
    }, 60000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshAllStocks]);

  return {
    stocks,
    shares,
    loading,
    error,
    lastUpdate,
    autoRefresh,
    addStock,
    removeStock,
    updateShares,
    refreshAllStocks,
    setAutoRefresh,
    clearError: () => setError(null)
  };
};

export default usePortfolio;