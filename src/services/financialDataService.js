/**
 * Financial Data Service
 * Fetches comprehensive financial metrics for Eight Pillars Framework analysis
 * Supports multiple data providers with fallback mechanisms
 */

import axios from 'axios';
import { DEFAULT_THRESHOLDS } from '../models/eightPillars';

// API Configuration
const API_CONFIG = {
  alphaVantage: {
    baseUrl: 'https://www.alphavantage.co/query',
    apiKey: process.env.REACT_APP_ALPHA_VANTAGE_API_KEY || 'demo',
    rateLimit: 12000 // 12 seconds for free tier
  },
  financialModelingPrep: {
    baseUrl: 'https://financialmodelingprep.com/api/v3',
    apiKey: process.env.REACT_APP_FMP_API_KEY || '',
    rateLimit: 300 // 300ms between calls
  },
  polygon: {
    baseUrl: 'https://api.polygon.io',
    apiKey: process.env.REACT_APP_POLYGON_API_KEY || '',
    rateLimit: 12 // 12ms for free tier (5 calls/minute)
  }
};

// Cache for API responses (simple in-memory cache)
const cache = new Map();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

class FinancialDataService {
  constructor() {
    this.lastApiCall = {};
    this.dataProviders = this.initializeProviders();
  }

  initializeProviders() {
    const providers = [];
    
    // Initialize available providers based on API keys
    if (API_CONFIG.alphaVantage.apiKey) {
      providers.push('alphaVantage');
    }
    if (API_CONFIG.financialModelingPrep.apiKey) {
      providers.push('financialModelingPrep');
    }
    if (API_CONFIG.polygon.apiKey) {
      providers.push('polygon');
    }
    
    return providers;
  }

  /**
   * Get cached data or fetch if expired
   */
  async getCachedOrFetch(key, fetchFunction) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    
    const data = await fetchFunction();
    cache.set(key, { data, timestamp: Date.now() });
    return data;
  }

  /**
   * Rate limiting helper
   */
  async respectRateLimit(provider) {
    const config = API_CONFIG[provider];
    const lastCall = this.lastApiCall[provider] || 0;
    const timeSinceLastCall = Date.now() - lastCall;
    
    if (timeSinceLastCall < config.rateLimit) {
      await new Promise(resolve => setTimeout(resolve, config.rateLimit - timeSinceLastCall));
    }
    
    this.lastApiCall[provider] = Date.now();
  }

  /**
   * Fetch comprehensive financial data for a stock
   */
  async getComprehensiveFinancials(symbol) {
    const cacheKey = `financials_${symbol}`;
    
    return this.getCachedOrFetch(cacheKey, async () => {
      const financials = {
        symbol,
        incomeStatement: null,
        balanceSheet: null,
        cashFlow: null,
        keyMetrics: null,
        growth: null,
        ratios: null,
        quote: null
      };

      // Try primary provider first, then fallback
      for (const provider of this.dataProviders) {
        try {
          switch (provider) {
            case 'alphaVantage':
              Object.assign(financials, await this.fetchAlphaVantageData(symbol));
              break;
            case 'financialModelingPrep':
              Object.assign(financials, await this.fetchFMPData(symbol));
              break;
            case 'polygon':
              Object.assign(financials, await this.fetchPolygonData(symbol));
              break;
          }
          
          // If we got sufficient data, break
          if (this.hasMinimumRequiredData(financials)) {
            break;
          }
        } catch (error) {
          console.warn(`Failed to fetch from ${provider}:`, error.message);
        }
      }
      
      return financials;
    });
  }

  /**
   * Alpha Vantage data fetching
   */
  async fetchAlphaVantageData(symbol) {
    await this.respectRateLimit('alphaVantage');
    const { baseUrl, apiKey } = API_CONFIG.alphaVantage;
    
    const [income, balance, cashflow, overview, quote] = await Promise.all([
      this.fetchWithRetry(`${baseUrl}?function=INCOME_STATEMENT&symbol=${symbol}&apikey=${apiKey}`),
      this.fetchWithRetry(`${baseUrl}?function=BALANCE_SHEET&symbol=${symbol}&apikey=${apiKey}`),
      this.fetchWithRetry(`${baseUrl}?function=CASH_FLOW&symbol=${symbol}&apikey=${apiKey}`),
      this.fetchWithRetry(`${baseUrl}?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`),
      this.fetchWithRetry(`${baseUrl}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`)
    ]);
    
    return {
      incomeStatement: this.parseAlphaVantageIncome(income),
      balanceSheet: this.parseAlphaVantageBalance(balance),
      cashFlow: this.parseAlphaVantageCashFlow(cashflow),
      keyMetrics: this.parseAlphaVantageOverview(overview),
      quote: this.parseAlphaVantageQuote(quote)
    };
  }

  /**
   * Financial Modeling Prep data fetching
   */
  async fetchFMPData(symbol) {
    await this.respectRateLimit('financialModelingPrep');
    const { baseUrl, apiKey } = API_CONFIG.financialModelingPrep;
    
    const endpoints = {
      income: `/income-statement/${symbol}?limit=5&apikey=${apiKey}`,
      balance: `/balance-sheet-statement/${symbol}?limit=5&apikey=${apiKey}`,
      cashflow: `/cash-flow-statement/${symbol}?limit=5&apikey=${apiKey}`,
      metrics: `/key-metrics-ttm/${symbol}?apikey=${apiKey}`,
      ratios: `/ratios-ttm/${symbol}?apikey=${apiKey}`,
      growth: `/financial-growth/${symbol}?limit=5&apikey=${apiKey}`,
      quote: `/quote/${symbol}?apikey=${apiKey}`
    };
    
    const results = {};
    for (const [key, endpoint] of Object.entries(endpoints)) {
      try {
        const response = await this.fetchWithRetry(baseUrl + endpoint);
        results[key] = response;
      } catch (error) {
        console.warn(`FMP ${key} fetch failed:`, error.message);
      }
    }
    
    return this.parseFMPData(results);
  }

  /**
   * Polygon.io data fetching
   */
  async fetchPolygonData(symbol) {
    await this.respectRateLimit('polygon');
    const { baseUrl, apiKey } = API_CONFIG.polygon;
    
    // Polygon endpoints for financial data
    const endpoints = {
      financials: `/v2/reference/financials/${symbol}?apiKey=${apiKey}`,
      details: `/v3/reference/tickers/${symbol}?apiKey=${apiKey}`,
      quote: `/v2/aggs/ticker/${symbol}/prev?apiKey=${apiKey}`
    };
    
    const results = {};
    for (const [key, endpoint] of Object.entries(endpoints)) {
      try {
        const response = await this.fetchWithRetry(baseUrl + endpoint);
        results[key] = response;
      } catch (error) {
        console.warn(`Polygon ${key} fetch failed:`, error.message);
      }
    }
    
    return this.parsePolygonData(results);
  }

  /**
   * Fetch with retry logic
   */
  async fetchWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await axios.get(url);
        return response.data;
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  /**
   * Parse Alpha Vantage income statement
   */
  parseAlphaVantageIncome(data) {
    if (!data || !data.annualReports) return null;
    
    return data.annualReports.map(report => ({
      fiscalYear: report.fiscalDateEnding,
      revenue: parseFloat(report.totalRevenue) || 0,
      grossProfit: parseFloat(report.grossProfit) || 0,
      ebitda: parseFloat(report.ebitda) || 0,
      ebit: parseFloat(report.ebit) || 0,
      netIncome: parseFloat(report.netIncome) || 0,
      eps: parseFloat(report.reportedEPS) || 0
    }));
  }

  /**
   * Parse Alpha Vantage balance sheet
   */
  parseAlphaVantageBalance(data) {
    if (!data || !data.annualReports) return null;
    
    return data.annualReports.map(report => ({
      fiscalYear: report.fiscalDateEnding,
      totalAssets: parseFloat(report.totalAssets) || 0,
      totalLiabilities: parseFloat(report.totalLiabilities) || 0,
      totalDebt: parseFloat(report.shortTermDebt || 0) + parseFloat(report.longTermDebt || 0),
      cashAndEquivalents: parseFloat(report.cashAndCashEquivalentsAtCarryingValue) || 0,
      shareholderEquity: parseFloat(report.totalShareholderEquity) || 0,
      sharesOutstanding: parseFloat(report.commonStockSharesOutstanding) || 0
    }));
  }

  /**
   * Parse Alpha Vantage cash flow
   */
  parseAlphaVantageCashFlow(data) {
    if (!data || !data.annualReports) return null;
    
    return data.annualReports.map(report => ({
      fiscalYear: report.fiscalDateEnding,
      operatingCashFlow: parseFloat(report.operatingCashflow) || 0,
      capitalExpenditures: Math.abs(parseFloat(report.capitalExpenditures)) || 0,
      freeCashFlow: parseFloat(report.operatingCashflow || 0) - Math.abs(parseFloat(report.capitalExpenditures || 0)),
      dividendsPaid: Math.abs(parseFloat(report.dividendPayout)) || 0,
      stockRepurchased: Math.abs(parseFloat(report.paymentsForRepurchaseOfCommonStock)) || 0
    }));
  }

  /**
   * Parse Alpha Vantage overview
   */
  parseAlphaVantageOverview(data) {
    if (!data || !data.Symbol) return null;
    
    return {
      marketCap: parseFloat(data.MarketCapitalization) || 0,
      peRatio: parseFloat(data.PERatio) || 0,
      pegRatio: parseFloat(data.PEGRatio) || 0,
      bookValue: parseFloat(data.BookValue) || 0,
      dividendYield: parseFloat(data.DividendYield) || 0,
      eps: parseFloat(data.EPS) || 0,
      beta: parseFloat(data.Beta) || 0,
      week52High: parseFloat(data['52WeekHigh']) || 0,
      week52Low: parseFloat(data['52WeekLow']) || 0,
      forwardPE: parseFloat(data.ForwardPE) || 0,
      profitMargin: parseFloat(data.ProfitMargin) || 0,
      operatingMargin: parseFloat(data.OperatingMarginTTM) || 0,
      returnOnAssets: parseFloat(data.ReturnOnAssetsTTM) || 0,
      returnOnEquity: parseFloat(data.ReturnOnEquityTTM) || 0,
      revenuePerShare: parseFloat(data.RevenuePerShareTTM) || 0,
      sector: data.Sector,
      industry: data.Industry,
      description: data.Description
    };
  }

  /**
   * Parse Alpha Vantage quote
   */
  parseAlphaVantageQuote(data) {
    if (!data || !data['Global Quote']) return null;
    
    const quote = data['Global Quote'];
    return {
      symbol: quote['01. symbol'],
      price: parseFloat(quote['05. price']) || 0,
      change: parseFloat(quote['09. change']) || 0,
      changePercent: quote['10. change percent'],
      volume: parseInt(quote['06. volume']) || 0,
      latestTradingDay: quote['07. latest trading day'],
      previousClose: parseFloat(quote['08. previous close']) || 0,
      open: parseFloat(quote['02. open']) || 0,
      high: parseFloat(quote['03. high']) || 0,
      low: parseFloat(quote['04. low']) || 0
    };
  }

  /**
   * Parse FMP data
   */
  parseFMPData(data) {
    const result = {
      incomeStatement: null,
      balanceSheet: null,
      cashFlow: null,
      keyMetrics: null,
      ratios: null,
      growth: null,
      quote: null
    };
    
    if (data.income && Array.isArray(data.income)) {
      result.incomeStatement = data.income.map(item => ({
        fiscalYear: item.date,
        revenue: item.revenue || 0,
        grossProfit: item.grossProfit || 0,
        ebitda: item.ebitda || 0,
        ebit: item.operatingIncome || 0,
        netIncome: item.netIncome || 0,
        eps: item.eps || 0
      }));
    }
    
    if (data.balance && Array.isArray(data.balance)) {
      result.balanceSheet = data.balance.map(item => ({
        fiscalYear: item.date,
        totalAssets: item.totalAssets || 0,
        totalLiabilities: item.totalLiabilities || 0,
        totalDebt: item.totalDebt || 0,
        cashAndEquivalents: item.cashAndCashEquivalents || 0,
        shareholderEquity: item.totalStockholdersEquity || 0,
        sharesOutstanding: item.commonStock || 0
      }));
    }
    
    if (data.cashflow && Array.isArray(data.cashflow)) {
      result.cashFlow = data.cashflow.map(item => ({
        fiscalYear: item.date,
        operatingCashFlow: item.operatingCashFlow || 0,
        capitalExpenditures: Math.abs(item.capitalExpenditure) || 0,
        freeCashFlow: item.freeCashFlow || 0,
        dividendsPaid: Math.abs(item.dividendsPaid) || 0,
        stockRepurchased: Math.abs(item.commonStockRepurchased) || 0
      }));
    }
    
    if (data.metrics && Array.isArray(data.metrics) && data.metrics.length > 0) {
      const m = data.metrics[0];
      result.keyMetrics = {
        marketCap: m.marketCapTTM || 0,
        peRatio: m.peRatioTTM || 0,
        pegRatio: m.pegRatioTTM || 0,
        bookValue: m.bookValuePerShareTTM || 0,
        dividendYield: m.dividendYieldTTM || 0,
        eps: m.netIncomePerShareTTM || 0,
        roic: m.roicTTM || 0,
        roe: m.roeTTM || 0,
        roa: m.returnOnTangibleAssetsTTM || 0
      };
    }
    
    if (data.ratios && Array.isArray(data.ratios) && data.ratios.length > 0) {
      const r = data.ratios[0];
      result.ratios = {
        currentRatio: r.currentRatioTTM || 0,
        quickRatio: r.quickRatioTTM || 0,
        debtToEquity: r.debtEquityRatioTTM || 0,
        interestCoverage: r.interestCoverageTTM || 0,
        grossMargin: r.grossProfitMarginTTM || 0,
        operatingMargin: r.operatingProfitMarginTTM || 0,
        netMargin: r.netProfitMarginTTM || 0,
        fcfMargin: r.freeCashFlowPerShareTTM || 0
      };
    }
    
    if (data.growth && Array.isArray(data.growth)) {
      result.growth = data.growth.map(item => ({
        year: item.date,
        revenueGrowth: item.revenueGrowth || 0,
        netIncomeGrowth: item.netIncomeGrowth || 0,
        epsGrowth: item.epsgrowth || 0,
        fcfGrowth: item.freeCashFlowGrowth || 0
      }));
    }
    
    if (data.quote && Array.isArray(data.quote) && data.quote.length > 0) {
      const q = data.quote[0];
      result.quote = {
        symbol: q.symbol,
        price: q.price || 0,
        change: q.change || 0,
        changePercent: q.changesPercentage || 0,
        volume: q.volume || 0,
        marketCap: q.marketCap || 0
      };
    }
    
    return result;
  }

  /**
   * Parse Polygon data
   */
  parsePolygonData(data) {
    const result = {
      incomeStatement: null,
      balanceSheet: null,
      cashFlow: null,
      keyMetrics: null,
      quote: null
    };
    
    if (data.financials && data.financials.results) {
      const financials = data.financials.results;
      
      // Group by statement type
      const income = financials.filter(f => f.fiscal_period === 'FY');
      const balance = financials.filter(f => f.fiscal_period === 'FY');
      
      if (income.length > 0) {
        result.incomeStatement = income.map(item => ({
          fiscalYear: item.fiscal_year,
          revenue: item.financials?.income_statement?.revenues?.value || 0,
          grossProfit: item.financials?.income_statement?.gross_profit?.value || 0,
          ebitda: item.financials?.income_statement?.operating_income?.value || 0,
          netIncome: item.financials?.income_statement?.net_income_loss?.value || 0
        }));
      }
      
      if (balance.length > 0) {
        result.balanceSheet = balance.map(item => ({
          fiscalYear: item.fiscal_year,
          totalAssets: item.financials?.balance_sheet?.assets?.value || 0,
          totalLiabilities: item.financials?.balance_sheet?.liabilities?.value || 0,
          shareholderEquity: item.financials?.balance_sheet?.equity?.value || 0
        }));
      }
    }
    
    if (data.details && data.details.results) {
      const details = data.details.results;
      result.keyMetrics = {
        marketCap: details.market_cap || 0,
        sector: details.sic_description,
        industry: details.sic_code,
        description: details.description
      };
    }
    
    if (data.quote && data.quote.results && data.quote.results.length > 0) {
      const q = data.quote.results[0];
      result.quote = {
        price: q.c || 0, // close price
        volume: q.v || 0,
        high: q.h || 0,
        low: q.l || 0,
        open: q.o || 0
      };
    }
    
    return result;
  }

  /**
   * Check if we have minimum required data for Eight Pillars analysis
   */
  hasMinimumRequiredData(financials) {
    return !!(
      financials.incomeStatement &&
      financials.balanceSheet &&
      financials.cashFlow &&
      (financials.keyMetrics || financials.ratios)
    );
  }

  /**
   * Calculate CAGR (Compound Annual Growth Rate)
   */
  calculateCAGR(beginValue, endValue, years) {
    if (beginValue <= 0 || endValue <= 0 || years <= 0) return 0;
    return (Math.pow(endValue / beginValue, 1 / years) - 1) * 100;
  }

  /**
   * Calculate moving average
   */
  calculateAverage(values) {
    if (!values || values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Get industry-specific thresholds
   */
  getIndustryThresholds(sector) {
    const sectorKey = sector ? sector.toLowerCase().replace(/\s+/g, '') : 'default';
    return DEFAULT_THRESHOLDS.grossMargin[sectorKey] || DEFAULT_THRESHOLDS.grossMargin.default;
  }
}

// Export singleton instance
export default new FinancialDataService();