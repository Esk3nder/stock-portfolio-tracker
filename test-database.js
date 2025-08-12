/**
 * Test Eight Pillars Database
 * Demonstrates storing and retrieving Eight Pillars analysis data
 */

const fs = require('fs');
const path = require('path');
const EightPillarsDB = require('./eight-pillars-db');

// Initialize database
const db = new EightPillarsDB();

/**
 * Load existing analysis files and add to database
 */
function importExistingAnalyses() {
  console.log('\n📥 Importing existing analyses...');
  const dataDir = path.join(__dirname, 'eight-pillars-data');
  
  if (!fs.existsSync(dataDir)) {
    console.log('No existing data directory found');
    return;
  }
  
  const files = fs.readdirSync(dataDir);
  const analysisFiles = files.filter(f => f.includes('_analysis_') && f.endsWith('.json'));
  
  analysisFiles.forEach(file => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
      const symbol = data.symbol;
      db.addAnalysis(symbol, data);
      console.log(`  ✅ Imported ${symbol}`);
    } catch (error) {
      console.log(`  ❌ Failed to import ${file}:`, error.message);
    }
  });
  
  console.log(`\n✅ Imported ${analysisFiles.length} analyses`);
}

/**
 * Demonstrate database functionality
 */
function demonstrateDatabase() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 EIGHT PILLARS DATABASE DEMONSTRATION');
  console.log('='.repeat(60));
  
  // 1. Get all stocks
  console.log('\n1️⃣ ALL STOCKS IN DATABASE:');
  console.log('─'.repeat(40));
  const allStocks = db.getAllStocks();
  allStocks.forEach(stock => {
    console.log(`  ${stock.symbol}: Score ${stock.latestScore}/8, Rating: ${stock.latestRating}`);
    console.log(`     Analyses: ${stock.analysisCount}, Last updated: ${new Date(stock.lastUpdated).toLocaleDateString()}`);
  });
  
  // 2. Get quality stocks (6+ pillars)
  console.log('\n2️⃣ QUALITY STOCKS (6+ PILLARS):');
  console.log('─'.repeat(40));
  const qualityStocks = db.getQualityStocks();
  if (qualityStocks.length > 0) {
    qualityStocks.forEach(stock => {
      console.log(`  🏆 ${stock.symbol} (${stock.companyName})`);
      console.log(`     Score: ${stock.score}/8, Rating: ${stock.rating}`);
      console.log(`     Recommendation: ${stock.recommendation}`);
    });
  } else {
    console.log('  No stocks meeting quality criteria');
  }
  
  // 3. Add stocks to watchlist
  console.log('\n3️⃣ WATCHLIST MANAGEMENT:');
  console.log('─'.repeat(40));
  
  // Add quality stocks to watchlist
  qualityStocks.forEach(stock => {
    db.addToWatchlist(stock.symbol, `High quality - ${stock.rating}`);
  });
  
  // Display watchlist
  const watchlist = db.getWatchlist();
  console.log(`\n  📋 Watchlist (${watchlist.length} stocks):`);
  watchlist.forEach(item => {
    console.log(`     • ${item.symbol}: Score ${item.latestScore || 'N/A'}, Notes: ${item.notes}`);
  });
  
  // 4. Portfolio simulation
  console.log('\n4️⃣ PORTFOLIO SIMULATION:');
  console.log('─'.repeat(40));
  
  // Add some stocks to portfolio
  if (qualityStocks.length > 0) {
    const topStock = qualityStocks[0];
    db.addToPortfolio(topStock.symbol, 100, 150.00);
    console.log(`  Added ${topStock.symbol} to portfolio`);
  }
  
  // Display portfolio
  const portfolio = db.getPortfolio();
  console.log(`\n  💼 Portfolio (${portfolio.length} holdings):`);
  portfolio.forEach(holding => {
    console.log(`     • ${holding.symbol} (${holding.companyName})`);
    console.log(`       Shares: ${holding.shares}, Purchase Price: $${holding.purchasePrice}`);
    console.log(`       Current Rating: ${holding.latestRating || 'N/A'}`);
  });
  
  // 5. Search functionality
  console.log('\n5️⃣ SEARCH FUNCTIONALITY:');
  console.log('─'.repeat(40));
  
  // Search for stocks with minimum score
  const highScorers = db.searchStocks({ minScore: 5 });
  console.log(`\n  🔍 Stocks with 5+ pillars: ${highScorers.length}`);
  highScorers.forEach(stock => {
    console.log(`     • ${stock.symbol}: ${stock.score}/8 (${stock.sector})`);
  });
  
  // 6. Statistics
  console.log('\n6️⃣ DATABASE STATISTICS:');
  console.log('─'.repeat(40));
  const stats = db.getStatistics();
  console.log(`  📈 Total Stocks: ${stats.totalStocks}`);
  console.log(`  📊 Total Analyses: ${stats.totalAnalyses}`);
  console.log(`  🏆 Quality Stocks: ${stats.qualityStocks}`);
  console.log(`  📉 Average Score: ${stats.averageScore}/8`);
  console.log(`  👁️ Watchlist Size: ${stats.watchlistSize}`);
  console.log(`  💼 Portfolio Size: ${stats.portfolioSize}`);
  console.log(`  🕐 Last Updated: ${new Date(stats.lastUpdated).toLocaleString()}`);
  console.log(`  🔢 Database Version: ${stats.databaseVersion}`);
  
  // 7. Export to CSV
  console.log('\n7️⃣ EXPORT FUNCTIONALITY:');
  console.log('─'.repeat(40));
  const csvFile = db.exportToCSV();
  console.log(`  📄 Exported to: ${csvFile}`);
  
  // 8. Get specific stock analysis
  console.log('\n8️⃣ INDIVIDUAL STOCK ANALYSIS:');
  console.log('─'.repeat(40));
  
  if (allStocks.length > 0) {
    const testSymbol = allStocks[0].symbol;
    const analysis = db.getLatestAnalysis(testSymbol);
    
    if (analysis) {
      console.log(`\n  📊 ${testSymbol} - ${analysis.companyName}`);
      console.log(`     Sector: ${analysis.sector}`);
      console.log(`     Industry: ${analysis.industry}`);
      console.log('\n     Pillar Results:');
      
      Object.values(analysis.pillars).forEach(pillar => {
        const icon = pillar.passes ? '✅' : '❌';
        console.log(`       ${icon} ${pillar.name}`);
        console.log(`          ${pillar.details}`);
      });
      
      console.log(`\n     Overall: ${analysis.summary.totalScore}/8 - ${analysis.summary.rating}`);
    }
  }
  
  // 9. Historical analysis
  console.log('\n9️⃣ HISTORICAL ANALYSIS:');
  console.log('─'.repeat(40));
  
  if (allStocks.length > 0) {
    const testSymbol = allStocks[0].symbol;
    const history = db.getAnalysisHistory(testSymbol);
    
    console.log(`\n  📅 History for ${testSymbol}: ${history.length} analyses`);
    history.slice(-3).forEach((analysis, index) => {
      console.log(`     ${index + 1}. ${new Date(analysis.timestamp).toLocaleString()}`);
      console.log(`        Score: ${analysis.summary.totalScore}/8, Rating: ${analysis.summary.rating}`);
    });
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🎯 Eight Pillars Database Test');
  console.log('=' .repeat(60));
  
  // Import existing analyses
  importExistingAnalyses();
  
  // Demonstrate database functionality
  demonstrateDatabase();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Database test complete!');
  console.log(`📁 Database location: ${path.join(__dirname, 'eight-pillars-data', 'database.json')}`);
}

// Run the test
main();