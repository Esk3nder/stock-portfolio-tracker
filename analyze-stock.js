#!/usr/bin/env node

/**
 * Analyze Stock - Eight Pillars Framework
 * Interactive tool to analyze any stock and store in database
 * 
 * Usage:
 *   node analyze-stock.js AAPL
 *   node analyze-stock.js AAPL MSFT GOOGL
 *   node analyze-stock.js --watchlist
 *   node analyze-stock.js --portfolio AAPL 100 250.50
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const EightPillarsDB = require('./eight-pillars-db');

// Configuration
const FMP_API_KEY = process.env.REACT_APP_FMP_API_KEY || 'uBEF4Mk6MMsBVa0YDYfg2aHdR2fd81rW';
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

// Initialize database
const db = new EightPillarsDB();

// Default thresholds
const DEFAULT_THRESHOLDS = {
  roic: 20,
  debtToEbitda: 2.5,
  revenueCagr: 10,
  ruleOf40: 40,
  grossMargin: {
    software: 70,
    consumer: 50,
    industrial: 35,
    financial: 40,
    healthcare: 60,
    default: 40
  },
  roe: 20,
  fcfMargin: 15,
  fcfConversion: 80
};

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

/**
 * Fetch financial data from FMP API
 */
async function fetchFinancialData(symbol) {
  process.stdout.write(`${colors.cyan}📊 Fetching data for ${symbol}...${colors.reset}`);
  
  const endpoints = {
    profile: `/profile/${symbol}`,
    keyMetrics: `/key-metrics/${symbol}`,
    incomeStatement: `/income-statement/${symbol}`,
    balanceSheet: `/balance-sheet-statement/${symbol}`,
    cashFlow: `/cash-flow-statement/${symbol}`,
    ratios: `/ratios/${symbol}`,
    growth: `/financial-growth/${symbol}`,
    quote: `/quote/${symbol}`
  };
  
  const data = {};
  let successCount = 0;
  
  for (const [key, endpoint] of Object.entries(endpoints)) {
    try {
      const url = `${FMP_BASE_URL}${endpoint}?apikey=${FMP_API_KEY}&limit=5`;
      const response = await axios.get(url);
      data[key] = response.data;
      successCount++;
    } catch (error) {
      data[key] = null;
    }
  }
  
  console.log(` ${colors.green}✓${colors.reset} (${successCount}/${Object.keys(endpoints).length} endpoints)`);
  return data;
}

/**
 * Calculate CAGR
 */
function calculateCAGR(startValue, endValue, years) {
  if (startValue <= 0 || endValue <= 0 || years <= 0) return null;
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
}

/**
 * Calculate Eight Pillars metrics
 */
function calculateEightPillars(data) {
  const analysis = {
    symbol: data.profile?.[0]?.symbol || 'Unknown',
    companyName: data.profile?.[0]?.companyName || 'Unknown Company',
    sector: data.profile?.[0]?.sector || 'Unknown',
    industry: data.profile?.[0]?.industry || 'Unknown',
    marketCap: data.profile?.[0]?.mktCap || 0,
    price: data.quote?.[0]?.price || 0,
    analysisDate: new Date().toISOString(),
    pillars: {},
    summary: {}
  };
  
  // Pillar 1: Moat Test (ROIC > 20%)
  if (data.keyMetrics && data.keyMetrics[0]) {
    const roic = data.keyMetrics[0].roic * 100;
    analysis.pillars.moat = {
      name: 'Moat Test (ROIC > 20%)',
      value: roic,
      threshold: DEFAULT_THRESHOLDS.roic,
      passes: roic > DEFAULT_THRESHOLDS.roic,
      details: `ROIC: ${roic.toFixed(2)}%`
    };
  }
  
  // Pillar 2: Fortress Test (Debt-to-EBITDA < 2.5x)
  if (data.keyMetrics && data.keyMetrics[0] && data.incomeStatement && data.incomeStatement[0]) {
    const netDebt = data.keyMetrics[0].netDebt || 0;
    const ebitda = data.incomeStatement[0].ebitda || 0;
    const debtToEbitda = ebitda !== 0 ? netDebt / ebitda : 999;
    
    analysis.pillars.fortress = {
      name: 'Fortress Test (Debt/EBITDA < 2.5x)',
      value: debtToEbitda,
      threshold: DEFAULT_THRESHOLDS.debtToEbitda,
      passes: debtToEbitda < DEFAULT_THRESHOLDS.debtToEbitda && debtToEbitda >= 0,
      details: `Debt/EBITDA: ${debtToEbitda.toFixed(2)}x`
    };
  }
  
  // Pillar 3: Engine Test (Revenue CAGR > 10%)
  if (data.incomeStatement && data.incomeStatement.length >= 3) {
    const latestRevenue = data.incomeStatement[0].revenue;
    const oldRevenue = data.incomeStatement[2].revenue;
    const cagr = calculateCAGR(oldRevenue, latestRevenue, 3);
    
    analysis.pillars.engine = {
      name: 'Engine Test (Revenue CAGR > 10%)',
      value: cagr,
      threshold: DEFAULT_THRESHOLDS.revenueCagr,
      passes: cagr > DEFAULT_THRESHOLDS.revenueCagr,
      details: `3-Year Revenue CAGR: ${cagr ? cagr.toFixed(2) + '%' : 'N/A'}`
    };
  }
  
  // Pillar 4: Efficiency Test (Rule of 40 > 40%)
  if (data.growth && data.growth[0] && data.incomeStatement && data.incomeStatement[0]) {
    const revenueGrowth = data.growth[0].revenueGrowth * 100;
    const ebitdaMargin = (data.incomeStatement[0].ebitda / data.incomeStatement[0].revenue) * 100;
    const ruleOf40 = revenueGrowth + ebitdaMargin;
    
    analysis.pillars.efficiency = {
      name: 'Efficiency Test (Rule of 40)',
      value: ruleOf40,
      threshold: DEFAULT_THRESHOLDS.ruleOf40,
      passes: ruleOf40 > DEFAULT_THRESHOLDS.ruleOf40,
      details: `Rule of 40: ${ruleOf40.toFixed(2)}% (Growth: ${revenueGrowth.toFixed(1)}% + EBITDA Margin: ${ebitdaMargin.toFixed(1)}%)`
    };
  }
  
  // Pillar 5: Pricing Power Test (Gross Margin)
  if (data.ratios && data.ratios[0]) {
    const grossMargin = data.ratios[0].grossProfitMargin * 100;
    const sector = analysis.sector.toLowerCase();
    let threshold = DEFAULT_THRESHOLDS.grossMargin.default;
    
    if (sector.includes('software') || sector.includes('technology')) {
      threshold = DEFAULT_THRESHOLDS.grossMargin.software;
    } else if (sector.includes('consumer')) {
      threshold = DEFAULT_THRESHOLDS.grossMargin.consumer;
    } else if (sector.includes('industrial')) {
      threshold = DEFAULT_THRESHOLDS.grossMargin.industrial;
    } else if (sector.includes('financial')) {
      threshold = DEFAULT_THRESHOLDS.grossMargin.financial;
    } else if (sector.includes('healthcare')) {
      threshold = DEFAULT_THRESHOLDS.grossMargin.healthcare;
    }
    
    analysis.pillars.pricingPower = {
      name: 'Pricing Power Test (Gross Margin)',
      value: grossMargin,
      threshold: threshold,
      passes: grossMargin > threshold,
      details: `Gross Margin: ${grossMargin.toFixed(2)}% (Industry threshold: ${threshold}%)`
    };
  }
  
  // Pillar 6: Capital Allocation Test (ROE > 20%)
  if (data.keyMetrics && data.keyMetrics[0]) {
    const roe = data.keyMetrics[0].roe * 100;
    
    analysis.pillars.capitalAllocation = {
      name: 'Capital Allocation Test (ROE)',
      value: roe,
      threshold: DEFAULT_THRESHOLDS.roe,
      passes: roe > DEFAULT_THRESHOLDS.roe,
      details: `ROE: ${roe.toFixed(2)}%`
    };
  }
  
  // Pillar 7: Cash Generation Test (FCF Margin > 15%)
  if (data.cashFlow && data.cashFlow[0] && data.incomeStatement && data.incomeStatement[0]) {
    const fcf = data.cashFlow[0].freeCashFlow;
    const revenue = data.incomeStatement[0].revenue;
    const netIncome = data.incomeStatement[0].netIncome;
    const fcfMargin = (fcf / revenue) * 100;
    const fcfConversion = netIncome !== 0 ? (fcf / netIncome) * 100 : 0;
    
    analysis.pillars.cashGeneration = {
      name: 'Cash Generation Test (FCF)',
      value: fcfMargin,
      threshold: DEFAULT_THRESHOLDS.fcfMargin,
      passes: fcfMargin > DEFAULT_THRESHOLDS.fcfMargin && fcfConversion > DEFAULT_THRESHOLDS.fcfConversion,
      details: `FCF Margin: ${fcfMargin.toFixed(2)}%, FCF Conversion: ${fcfConversion.toFixed(2)}%`
    };
  }
  
  // Pillar 8: Durability Test (Qualitative)
  if (data.keyMetrics && data.keyMetrics[0]) {
    const peRatio = data.keyMetrics[0].peRatio;
    const marketCap = data.keyMetrics[0].marketCap;
    const reasonable = peRatio > 15 && peRatio < 35 && marketCap > 10000000000;
    
    analysis.pillars.durability = {
      name: 'Durability Test (Market Position)',
      value: peRatio,
      threshold: 'Qualitative',
      passes: reasonable,
      details: `P/E: ${peRatio?.toFixed(2) || 'N/A'}, Market Cap: $${(marketCap / 1000000000).toFixed(2)}B`
    };
  }
  
  // Calculate summary
  const passedPillars = Object.values(analysis.pillars).filter(p => p.passes);
  const totalScore = passedPillars.length;
  
  analysis.summary = {
    totalScore: totalScore,
    totalPillars: Object.keys(analysis.pillars).length,
    passedPillars: passedPillars.map(p => p.name),
    failedPillars: Object.values(analysis.pillars).filter(p => !p.passes).map(p => p.name),
    meetsFramework: totalScore >= 6,
    rating: getRating(totalScore),
    recommendation: getRecommendation(totalScore)
  };
  
  return analysis;
}

/**
 * Get rating based on score
 */
function getRating(score) {
  if (score >= 8) return 'Elite Compounder';
  if (score >= 7) return 'Strong Compounder';
  if (score >= 6) return 'Quality Growth';
  if (score >= 5) return 'Moderate Quality';
  if (score >= 4) return 'Mixed Signals';
  if (score >= 3) return 'Below Framework';
  return 'Weak Fundamentals';
}

/**
 * Get recommendation based on score
 */
function getRecommendation(score) {
  if (score >= 7) return 'Strong Buy';
  if (score >= 6) return 'Buy';
  if (score >= 5) return 'Watch';
  if (score >= 4) return 'Hold';
  return 'Avoid';
}

/**
 * Display analysis results with colors
 */
function displayAnalysis(analysis) {
  console.log(`\n${colors.bright}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}📈 EIGHT PILLARS ANALYSIS RESULTS${colors.reset}`);
  console.log(`${colors.bright}${'='.repeat(60)}${colors.reset}`);
  
  console.log(`\n${colors.cyan}🏢 Company:${colors.reset} ${analysis.companyName} (${analysis.symbol})`);
  console.log(`${colors.cyan}📊 Sector:${colors.reset} ${analysis.sector}`);
  console.log(`${colors.cyan}🏭 Industry:${colors.reset} ${analysis.industry}`);
  console.log(`${colors.cyan}💰 Market Cap:${colors.reset} $${(analysis.marketCap / 1000000000).toFixed(2)}B`);
  console.log(`${colors.cyan}💵 Current Price:${colors.reset} $${analysis.price.toFixed(2)}`);
  
  console.log(`\n${colors.bright}${'─'.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}🎯 PILLAR RESULTS:${colors.reset}`);
  console.log(`${colors.bright}${'─'.repeat(60)}${colors.reset}`);
  
  Object.values(analysis.pillars).forEach(pillar => {
    const icon = pillar.passes ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
    const color = pillar.passes ? colors.green : colors.red;
    console.log(`\n${icon} ${color}${pillar.name}${colors.reset}`);
    console.log(`   ${pillar.details}`);
  });
  
  console.log(`\n${colors.bright}${'─'.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}📊 SUMMARY:${colors.reset}`);
  console.log(`${colors.bright}${'─'.repeat(60)}${colors.reset}`);
  
  const scoreColor = analysis.summary.totalScore >= 6 ? colors.green : 
                     analysis.summary.totalScore >= 4 ? colors.yellow : colors.red;
  
  console.log(`\n🎯 Total Score: ${scoreColor}${analysis.summary.totalScore}/${analysis.summary.totalPillars}${colors.reset} pillars passed`);
  console.log(`⭐ Rating: ${scoreColor}${analysis.summary.rating}${colors.reset}`);
  
  const frameworkColor = analysis.summary.meetsFramework ? colors.green : colors.red;
  console.log(`✅ Meets Framework (6+ pillars): ${frameworkColor}${analysis.summary.meetsFramework ? 'YES' : 'NO'}${colors.reset}`);
  
  const recColor = analysis.summary.totalScore >= 6 ? colors.green : 
                   analysis.summary.totalScore >= 4 ? colors.yellow : colors.red;
  console.log(`💡 Recommendation: ${recColor}${analysis.summary.recommendation}${colors.reset}`);
}

/**
 * Analyze a single stock
 */
async function analyzeStock(symbol) {
  try {
    // Fetch data
    const rawData = await fetchFinancialData(symbol.toUpperCase());
    
    // Calculate Eight Pillars
    console.log(`${colors.cyan}🔍 Calculating Eight Pillars metrics...${colors.reset}`);
    const analysis = calculateEightPillars(rawData);
    
    // Display results
    displayAnalysis(analysis);
    
    // Save to database
    console.log(`\n${colors.cyan}💾 Saving to database...${colors.reset}`);
    db.addAnalysis(symbol.toUpperCase(), analysis);
    
    // Save raw data
    const dataDir = path.join(__dirname, 'eight-pillars-data');
    const timestamp = new Date().toISOString().split('T')[0];
    const rawFile = path.join(dataDir, `${symbol.toUpperCase()}_raw_${timestamp}.json`);
    fs.writeFileSync(rawFile, JSON.stringify(rawData, null, 2));
    
    console.log(`${colors.green}✓ Analysis complete and saved!${colors.reset}`);
    
    // Ask if user wants to add to watchlist
    if (analysis.summary.totalScore >= 6) {
      console.log(`\n${colors.yellow}This stock meets the framework criteria!${colors.reset}`);
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question('Add to watchlist? (y/n): ', (answer) => {
        if (answer.toLowerCase() === 'y') {
          db.addToWatchlist(symbol.toUpperCase(), `${analysis.summary.rating} - Score: ${analysis.summary.totalScore}/8`);
          console.log(`${colors.green}✓ Added to watchlist!${colors.reset}`);
        }
        rl.close();
      });
    }
    
    return analysis;
    
  } catch (error) {
    console.error(`${colors.red}❌ Error analyzing ${symbol}:${colors.reset}`, error.message);
    return null;
  }
}

/**
 * Batch analyze multiple stocks
 */
async function batchAnalyze(symbols) {
  console.log(`\n${colors.bright}🚀 BATCH ANALYSIS${colors.reset}`);
  console.log(`Analyzing ${symbols.length} stocks: ${symbols.join(', ')}\n`);
  
  const results = [];
  
  for (const symbol of symbols) {
    const analysis = await analyzeStock(symbol);
    if (analysis) {
      results.push({
        symbol: symbol.toUpperCase(),
        score: analysis.summary.totalScore,
        rating: analysis.summary.rating,
        recommendation: analysis.summary.recommendation
      });
    }
    
    // Rate limiting
    if (symbols.indexOf(symbol) < symbols.length - 1) {
      console.log(`\n${colors.cyan}⏳ Waiting before next request...${colors.reset}\n`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Display summary
  console.log(`\n${colors.bright}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}📊 BATCH ANALYSIS SUMMARY${colors.reset}`);
  console.log(`${colors.bright}${'='.repeat(60)}${colors.reset}`);
  
  results.sort((a, b) => b.score - a.score);
  
  console.log('\n🏆 Results (sorted by score):');
  results.forEach((r, i) => {
    const color = r.score >= 6 ? colors.green : 
                  r.score >= 4 ? colors.yellow : colors.red;
    console.log(`${i + 1}. ${color}${r.symbol}: ${r.score}/8 - ${r.rating} (${r.recommendation})${colors.reset}`);
  });
  
  const qualityStocks = results.filter(r => r.score >= 6);
  if (qualityStocks.length > 0) {
    console.log(`\n${colors.green}✅ ${qualityStocks.length} stocks meet framework criteria (6+ pillars)${colors.reset}`);
  }
}

/**
 * Show watchlist
 */
function showWatchlist() {
  const watchlist = db.getWatchlist();
  
  console.log(`\n${colors.bright}👁️ WATCHLIST${colors.reset}`);
  console.log(`${colors.bright}${'='.repeat(60)}${colors.reset}\n`);
  
  if (watchlist.length === 0) {
    console.log('Watchlist is empty');
  } else {
    watchlist.forEach((item, i) => {
      const color = item.latestScore >= 6 ? colors.green : 
                   item.latestScore >= 4 ? colors.yellow : colors.red;
      console.log(`${i + 1}. ${color}${item.symbol}${colors.reset}`);
      console.log(`   Score: ${item.latestScore || 'N/A'}/8`);
      console.log(`   Rating: ${item.latestRating || 'N/A'}`);
      console.log(`   Notes: ${item.notes}`);
      console.log(`   Added: ${new Date(item.addedDate).toLocaleDateString()}\n`);
    });
  }
}

/**
 * Show portfolio
 */
function showPortfolio() {
  const portfolio = db.getPortfolio();
  
  console.log(`\n${colors.bright}💼 PORTFOLIO${colors.reset}`);
  console.log(`${colors.bright}${'='.repeat(60)}${colors.reset}\n`);
  
  if (portfolio.length === 0) {
    console.log('Portfolio is empty');
  } else {
    portfolio.forEach((holding, i) => {
      const color = holding.latestScore >= 6 ? colors.green : 
                   holding.latestScore >= 4 ? colors.yellow : colors.red;
      console.log(`${i + 1}. ${color}${holding.symbol}${colors.reset} - ${holding.companyName}`);
      console.log(`   Shares: ${holding.shares}`);
      console.log(`   Purchase Price: $${holding.purchasePrice}`);
      console.log(`   Current Rating: ${holding.latestRating || 'N/A'}`);
      console.log(`   Purchase Date: ${new Date(holding.purchaseDate).toLocaleDateString()}\n`);
    });
  }
}

/**
 * Show statistics
 */
function showStats() {
  const stats = db.getStatistics();
  const qualityStocks = db.getQualityStocks();
  
  console.log(`\n${colors.bright}📊 DATABASE STATISTICS${colors.reset}`);
  console.log(`${colors.bright}${'='.repeat(60)}${colors.reset}\n`);
  
  console.log(`📈 Total Stocks Analyzed: ${colors.cyan}${stats.totalStocks}${colors.reset}`);
  console.log(`📊 Total Analyses: ${colors.cyan}${stats.totalAnalyses}${colors.reset}`);
  console.log(`🏆 Quality Stocks (6+ pillars): ${colors.green}${stats.qualityStocks}${colors.reset}`);
  console.log(`📉 Average Score: ${colors.cyan}${stats.averageScore}/8${colors.reset}`);
  console.log(`👁️ Watchlist Size: ${colors.cyan}${stats.watchlistSize}${colors.reset}`);
  console.log(`💼 Portfolio Size: ${colors.cyan}${stats.portfolioSize}${colors.reset}`);
  
  if (qualityStocks.length > 0) {
    console.log(`\n${colors.bright}🏆 TOP QUALITY STOCKS:${colors.reset}`);
    qualityStocks.slice(0, 5).forEach((stock, i) => {
      console.log(`${i + 1}. ${colors.green}${stock.symbol}${colors.reset} - ${stock.companyName}`);
      console.log(`   Score: ${stock.score}/8, ${stock.rating}`);
    });
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  
  console.log(`${colors.bright}${colors.cyan}🎯 Eight Pillars Stock Analyzer${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  
  if (args.length === 0) {
    console.log('\nUsage:');
    console.log('  node analyze-stock.js AAPL                    # Analyze single stock');
    console.log('  node analyze-stock.js AAPL MSFT GOOGL         # Analyze multiple stocks');
    console.log('  node analyze-stock.js --watchlist             # Show watchlist');
    console.log('  node analyze-stock.js --portfolio             # Show portfolio');
    console.log('  node analyze-stock.js --stats                 # Show statistics');
    console.log('  node analyze-stock.js --add-portfolio AAPL 100 250.50  # Add to portfolio');
    return;
  }
  
  // Handle special commands
  if (args[0] === '--watchlist') {
    showWatchlist();
  } else if (args[0] === '--portfolio') {
    showPortfolio();
  } else if (args[0] === '--stats') {
    showStats();
  } else if (args[0] === '--add-portfolio' && args.length >= 4) {
    const symbol = args[1].toUpperCase();
    const shares = parseInt(args[2]);
    const price = parseFloat(args[3]);
    db.addToPortfolio(symbol, shares, price);
    console.log(`${colors.green}✓ Added ${shares} shares of ${symbol} at $${price} to portfolio${colors.reset}`);
  } else {
    // Analyze stocks
    const symbols = args.filter(arg => !arg.startsWith('--'));
    
    if (symbols.length === 1) {
      await analyzeStock(symbols[0]);
    } else if (symbols.length > 1) {
      await batchAnalyze(symbols);
    }
  }
  
  console.log(`\n${colors.cyan}Use 'node analyze-stock.js --stats' to view overall statistics${colors.reset}`);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error(`${colors.red}❌ Error:${colors.reset}`, error.message);
  process.exit(1);
});

// Run the program
main().catch(console.error);