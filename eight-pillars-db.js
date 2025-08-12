/**
 * Eight Pillars Local Database
 * Simple JSON-based local storage for Eight Pillars analysis data
 */

const fs = require('fs');
const path = require('path');

class EightPillarsDB {
  constructor(dataDir = null) {
    this.dataDir = dataDir || path.join(__dirname, 'eight-pillars-data');
    this.dbFile = path.join(this.dataDir, 'database.json');
    this.initialize();
  }
  
  /**
   * Initialize database
   */
  initialize() {
    // Create data directory if it doesn't exist
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    
    // Create database file if it doesn't exist
    if (!fs.existsSync(this.dbFile)) {
      this.createDatabase();
    }
  }
  
  /**
   * Create new database structure
   */
  createDatabase() {
    const db = {
      version: '1.0.0',
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      stocks: {},
      history: [],
      watchlist: [],
      portfolio: [],
      settings: {
        autoUpdate: false,
        updateInterval: 86400000, // 24 hours in ms
        thresholds: {
          roic: 20,
          debtToEbitda: 2.5,
          revenueCagr: 10,
          ruleOf40: 40,
          grossMargin: 40,
          roe: 20,
          fcfMargin: 15,
          fcfConversion: 80
        }
      }
    };
    
    this.saveDatabase(db);
    console.log('✅ Created new database');
    return db;
  }
  
  /**
   * Load database from file
   */
  loadDatabase() {
    try {
      const data = fs.readFileSync(this.dbFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading database:', error);
      return this.createDatabase();
    }
  }
  
  /**
   * Save database to file
   */
  saveDatabase(db) {
    db.lastUpdated = new Date().toISOString();
    fs.writeFileSync(this.dbFile, JSON.stringify(db, null, 2));
  }
  
  /**
   * Add or update stock analysis
   */
  addAnalysis(symbol, analysis) {
    const db = this.loadDatabase();
    
    // Initialize stock record if it doesn't exist
    if (!db.stocks[symbol]) {
      db.stocks[symbol] = {
        symbol: symbol,
        analyses: [],
        latestAnalysis: null,
        firstAdded: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
    }
    
    // Add analysis with timestamp
    const timestampedAnalysis = {
      ...analysis,
      timestamp: new Date().toISOString()
    };
    
    db.stocks[symbol].analyses.push(timestampedAnalysis);
    db.stocks[symbol].latestAnalysis = timestampedAnalysis;
    db.stocks[symbol].lastUpdated = new Date().toISOString();
    
    // Add to history
    db.history.push({
      action: 'analysis_added',
      symbol: symbol,
      timestamp: new Date().toISOString(),
      score: analysis.summary?.totalScore || 0,
      rating: analysis.summary?.rating || 'Unknown'
    });
    
    // Keep only last 100 history items
    if (db.history.length > 100) {
      db.history = db.history.slice(-100);
    }
    
    this.saveDatabase(db);
    console.log(`✅ Added analysis for ${symbol}`);
    return timestampedAnalysis;
  }
  
  /**
   * Get latest analysis for a stock
   */
  getLatestAnalysis(symbol) {
    const db = this.loadDatabase();
    return db.stocks[symbol]?.latestAnalysis || null;
  }
  
  /**
   * Get all analyses for a stock
   */
  getAnalysisHistory(symbol) {
    const db = this.loadDatabase();
    return db.stocks[symbol]?.analyses || [];
  }
  
  /**
   * Get all stocks in database
   */
  getAllStocks() {
    const db = this.loadDatabase();
    return Object.keys(db.stocks).map(symbol => ({
      symbol,
      latestScore: db.stocks[symbol].latestAnalysis?.summary?.totalScore || 0,
      latestRating: db.stocks[symbol].latestAnalysis?.summary?.rating || 'Unknown',
      lastUpdated: db.stocks[symbol].lastUpdated,
      analysisCount: db.stocks[symbol].analyses.length
    }));
  }
  
  /**
   * Get stocks that meet framework (6+ pillars)
   */
  getQualityStocks(minPillars = 6) {
    const db = this.loadDatabase();
    const qualityStocks = [];
    
    for (const symbol in db.stocks) {
      const latest = db.stocks[symbol].latestAnalysis;
      if (latest && latest.summary && latest.summary.totalScore >= minPillars) {
        qualityStocks.push({
          symbol,
          companyName: latest.companyName,
          score: latest.summary.totalScore,
          rating: latest.summary.rating,
          recommendation: latest.summary.recommendation,
          lastUpdated: db.stocks[symbol].lastUpdated
        });
      }
    }
    
    return qualityStocks.sort((a, b) => b.score - a.score);
  }
  
  /**
   * Add stock to watchlist
   */
  addToWatchlist(symbol, notes = '') {
    const db = this.loadDatabase();
    
    // Check if already in watchlist
    if (!db.watchlist.find(item => item.symbol === symbol)) {
      db.watchlist.push({
        symbol,
        addedDate: new Date().toISOString(),
        notes
      });
      
      this.saveDatabase(db);
      console.log(`✅ Added ${symbol} to watchlist`);
      return true;
    }
    
    return false;
  }
  
  /**
   * Remove from watchlist
   */
  removeFromWatchlist(symbol) {
    const db = this.loadDatabase();
    const index = db.watchlist.findIndex(item => item.symbol === symbol);
    
    if (index !== -1) {
      db.watchlist.splice(index, 1);
      this.saveDatabase(db);
      console.log(`✅ Removed ${symbol} from watchlist`);
      return true;
    }
    
    return false;
  }
  
  /**
   * Get watchlist
   */
  getWatchlist() {
    const db = this.loadDatabase();
    return db.watchlist.map(item => {
      const analysis = this.getLatestAnalysis(item.symbol);
      return {
        ...item,
        latestScore: analysis?.summary?.totalScore || null,
        latestRating: analysis?.summary?.rating || null
      };
    });
  }
  
  /**
   * Add stock to portfolio
   */
  addToPortfolio(symbol, shares, purchasePrice, purchaseDate = null) {
    const db = this.loadDatabase();
    
    db.portfolio.push({
      symbol,
      shares,
      purchasePrice,
      purchaseDate: purchaseDate || new Date().toISOString(),
      addedDate: new Date().toISOString()
    });
    
    this.saveDatabase(db);
    console.log(`✅ Added ${shares} shares of ${symbol} to portfolio`);
    return true;
  }
  
  /**
   * Get portfolio with current analysis
   */
  getPortfolio() {
    const db = this.loadDatabase();
    return db.portfolio.map(holding => {
      const analysis = this.getLatestAnalysis(holding.symbol);
      return {
        ...holding,
        latestScore: analysis?.summary?.totalScore || null,
        latestRating: analysis?.summary?.rating || null,
        companyName: analysis?.companyName || holding.symbol
      };
    });
  }
  
  /**
   * Get analysis statistics
   */
  getStatistics() {
    const db = this.loadDatabase();
    const allStocks = this.getAllStocks();
    const qualityStocks = this.getQualityStocks();
    
    const scores = allStocks.map(s => s.latestScore).filter(s => s > 0);
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    
    return {
      totalStocks: allStocks.length,
      totalAnalyses: Object.values(db.stocks).reduce((sum, stock) => sum + stock.analyses.length, 0),
      qualityStocks: qualityStocks.length,
      averageScore: avgScore.toFixed(2),
      watchlistSize: db.watchlist.length,
      portfolioSize: db.portfolio.length,
      lastUpdated: db.lastUpdated,
      databaseVersion: db.version
    };
  }
  
  /**
   * Search stocks by criteria
   */
  searchStocks(criteria) {
    const db = this.loadDatabase();
    const results = [];
    
    for (const symbol in db.stocks) {
      const latest = db.stocks[symbol].latestAnalysis;
      if (!latest) continue;
      
      let matches = true;
      
      // Check minimum score
      if (criteria.minScore !== undefined && latest.summary.totalScore < criteria.minScore) {
        matches = false;
      }
      
      // Check sector
      if (criteria.sector && latest.sector !== criteria.sector) {
        matches = false;
      }
      
      // Check specific pillar requirements
      if (criteria.pillars) {
        for (const pillarName in criteria.pillars) {
          const pillar = latest.pillars[pillarName];
          if (!pillar || pillar.passes !== criteria.pillars[pillarName]) {
            matches = false;
            break;
          }
        }
      }
      
      if (matches) {
        results.push({
          symbol,
          companyName: latest.companyName,
          sector: latest.sector,
          score: latest.summary.totalScore,
          rating: latest.summary.rating,
          pillars: latest.pillars
        });
      }
    }
    
    return results;
  }
  
  /**
   * Export database to CSV
   */
  exportToCSV(filename = null) {
    const db = this.loadDatabase();
    const csvFile = filename || path.join(this.dataDir, `export_${new Date().toISOString().split('T')[0]}.csv`);
    
    const headers = ['Symbol', 'Company', 'Sector', 'Score', 'Rating', 'Recommendation', 'Last Updated'];
    const rows = [headers];
    
    for (const symbol in db.stocks) {
      const latest = db.stocks[symbol].latestAnalysis;
      if (latest) {
        rows.push([
          symbol,
          latest.companyName,
          latest.sector,
          latest.summary.totalScore,
          latest.summary.rating,
          latest.summary.recommendation,
          db.stocks[symbol].lastUpdated
        ]);
      }
    }
    
    const csv = rows.map(row => row.join(',')).join('\n');
    fs.writeFileSync(csvFile, csv);
    console.log(`✅ Exported to ${csvFile}`);
    return csvFile;
  }
}

module.exports = EightPillarsDB;