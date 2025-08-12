import axios from 'axios';
import { API_KEY, BASE_URL, API_FUNCTIONS } from '../config/api';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const searchStocks = async (keywords) => {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        function: API_FUNCTIONS.SEARCH,
        keywords,
        apikey: API_KEY
      }
    });
    
    return response.data.bestMatches || [];
  } catch (error) {
    console.error('Error searching stocks:', error);
    return [];
  }
};

export const getStockQuote = async (symbol) => {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        function: API_FUNCTIONS.QUOTE,
        symbol,
        apikey: API_KEY
      }
    });
    
    const quote = response.data['Global Quote'];
    if (!quote) {
      throw new Error('No data available');
    }
    
    return {
      symbol: quote['01. symbol'],
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: quote['10. change percent'],
      volume: parseInt(quote['06. volume']),
      latestTradingDay: quote['07. latest trading day'],
      previousClose: parseFloat(quote['08. previous close']),
      open: parseFloat(quote['02. open']),
      high: parseFloat(quote['03. high']),
      low: parseFloat(quote['04. low'])
    };
  } catch (error) {
    console.error('Error fetching stock quote:', error);
    throw error;
  }
};

export const getIntradayData = async (symbol, interval = '5min') => {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        function: API_FUNCTIONS.INTRADAY,
        symbol,
        interval,
        apikey: API_KEY
      }
    });
    
    const timeSeries = response.data[`Time Series (${interval})`];
    if (!timeSeries) {
      throw new Error('No data available');
    }
    
    return Object.entries(timeSeries).map(([time, data]) => ({
      time,
      open: parseFloat(data['1. open']),
      high: parseFloat(data['2. high']),
      low: parseFloat(data['3. low']),
      close: parseFloat(data['4. close']),
      volume: parseInt(data['5. volume'])
    })).reverse();
  } catch (error) {
    console.error('Error fetching intraday data:', error);
    throw error;
  }
};

export const batchUpdateStocks = async (symbols) => {
  const results = [];
  
  for (const symbol of symbols) {
    try {
      const quote = await getStockQuote(symbol);
      results.push(quote);
      await delay(12000);
    } catch (error) {
      console.error(`Failed to update ${symbol}:`, error);
      results.push({ symbol, error: true });
    }
  }
  
  return results;
};