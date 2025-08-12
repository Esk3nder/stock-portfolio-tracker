/**
 * Simple Eight Pillars Test Script
 * Direct API calls and calculations without ES module dependencies
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const FMP_API_KEY = process.env.REACT_APP_FMP_API_KEY || 'uBEF4Mk6MMsBVa0YDYfg2aHdR2fd81rW';
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

// Local storage directory
const DATA_DIR = path.join(__dirname, 'eight-pillars-data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Default thresholds for Eight Pillars
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

/**
 * Fetch financial data from FMP API
 */
async function fetchFinancialData(symbol) {
  console.log(`📊 Fetching data for ${symbol}...`);
  
  const endpoints = {
    profile: `/profile/${symbol}`,
    keyMetrics: `/key-metrics/${symbol}`,
    incomeStatement: `/income-statement/${symbol}`,
    balanceSheet: `/balance-sheet-statement/${symbol}`,
    cashFlow: `/cash-flow-statement/${symbol}`,
    ratios: `/ratios/${symbol}`,
    growth: `/financial-growth/${symbol}`
  };
  
  const data = {};
  
  for (const [key, endpoint] of Object.entries(endpoints)) {
    try {
      const url = `${FMP_BASE_URL}${endpoint}?apikey=${FMP_API_KEY}&limit=5`;
      const response = await axios.get(url);
      data[key] = response.data;
      console.log(`  ✅ ${key}: ${Array.isArray(response.data) ? response.data.length : 1} records`);
    } catch (error) {
      console.log(`  ⚠️  ${key}: Failed to fetch`);
      data[key] = null;
    }
  }
  
  return data;
}

/**
 * Calculate CAGR (Compound Annual Growth Rate)
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
    analysisDate: new Date().toISOString(),
    pillars: {},
    summary: {}
  };
  
  // Pillar 1: Moat Test (ROIC > 20%)
  if (data.keyMetrics && data.keyMetrics[0]) {
    const roic = data.keyMetrics[0].roic * 100; // Convert to percentage
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
    const oldRevenue = data.incomeStatement[2].revenue; // 3 years ago
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
    
    // Set industry-specific threshold
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
  
  // Pillar 8: Durability Test (Qualitative - using P/E as proxy)
  if (data.keyMetrics && data.keyMetrics[0]) {
    const peRatio = data.keyMetrics[0].peRatio;
    const marketCap = data.keyMetrics[0].marketCap;
    
    // Simple heuristic: reasonable P/E (15-35) and large market cap (>10B) suggests durability
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
 * Save analysis to local file
 */
function saveAnalysis(symbol, analysis, rawData) {
  const timestamp = new Date().toISOString().split('T')[0];
  
  // Save analysis
  const analysisFile = path.join(DATA_DIR, `${symbol}_analysis_${timestamp}.json`);
  fs.writeFileSync(analysisFile, JSON.stringify(analysis, null, 2));
  console.log(`\n💾 Saved analysis to: ${analysisFile}`);
  
  // Save raw data
  const rawFile = path.join(DATA_DIR, `${symbol}_raw_${timestamp}.json`);
  fs.writeFileSync(rawFile, JSON.stringify(rawData, null, 2));
  console.log(`💾 Saved raw data to: ${rawFile}`);
  
  return { analysisFile, rawFile };
}

/**
 * Display analysis results
 */
function displayAnalysis(analysis) {
  console.log('\n' + '='.repeat(60));
  console.log('📈 EIGHT PILLARS ANALYSIS RESULTS');
  console.log('='.repeat(60));
  
  console.log(`\n🏢 Company: ${analysis.companyName} (${analysis.symbol})`);
  console.log(`📊 Sector: ${analysis.sector}`);
  console.log(`🏭 Industry: ${analysis.industry}`);
  console.log(`📅 Analysis Date: ${new Date(analysis.analysisDate).toLocaleDateString()}`);
  
  console.log('\n' + '─'.repeat(60));
  console.log('🎯 PILLAR RESULTS:');
  console.log('─'.repeat(60));
  
  Object.values(analysis.pillars).forEach(pillar => {
    const icon = pillar.passes ? '✅' : '❌';
    console.log(`\n${icon} ${pillar.name}`);
    console.log(`   ${pillar.details}`);
  });
  
  console.log('\n' + '─'.repeat(60));
  console.log('📊 SUMMARY:');
  console.log('─'.repeat(60));
  console.log(`\n🎯 Total Score: ${analysis.summary.totalScore}/${analysis.summary.totalPillars} pillars passed`);
  console.log(`⭐ Rating: ${analysis.summary.rating}`);
  console.log(`✅ Meets Framework (6+ pillars): ${analysis.summary.meetsFramework ? 'YES' : 'NO'}`);
  console.log(`💡 Recommendation: ${analysis.summary.recommendation}`);
  
  if (analysis.summary.passedPillars.length > 0) {
    console.log(`\n✅ Passed Pillars:`);
    analysis.summary.passedPillars.forEach(p => console.log(`   • ${p}`));
  }
  
  if (analysis.summary.failedPillars.length > 0) {
    console.log(`\n❌ Failed Pillars:`);
    analysis.summary.failedPillars.forEach(p => console.log(`   • ${p}`));
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🎯 Eight Pillars Framework Test');
  console.log('=' .repeat(60));
  
  const symbols = process.argv.slice(2);
  
  if (symbols.length === 0) {
    console.log('\nUsage: node test-eight-pillars-simple.js [SYMBOL1] [SYMBOL2] ...');
    console.log('Example: node test-eight-pillars-simple.js AAPL MSFT GOOGL');
    console.log('\nTesting with default symbol: V (Visa)');
    symbols.push('V');
  }
  
  for (const symbol of symbols) {
    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Testing ${symbol.toUpperCase()}`);
      console.log(`${'='.repeat(60)}`);
      
      // Fetch data
      const rawData = await fetchFinancialData(symbol.toUpperCase());
      
      // Calculate Eight Pillars
      console.log('\n🔍 Calculating Eight Pillars metrics...');
      const analysis = calculateEightPillars(rawData);
      
      // Display results
      displayAnalysis(analysis);
      
      // Save to files
      const files = saveAnalysis(symbol.toUpperCase(), analysis, rawData);
      
      // Add delay between requests
      if (symbols.length > 1 && symbols.indexOf(symbol) < symbols.length - 1) {
        console.log('\n⏳ Waiting before next request...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      console.error(`\n❌ Error processing ${symbol}:`, error.message);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ All tests complete!');
  console.log(`📁 Data saved in: ${DATA_DIR}`);
  
  // List saved files
  const files = fs.readdirSync(DATA_DIR);
  console.log(`\n📂 Saved files (${files.length} total):`);
  files.slice(-10).forEach(f => console.log(`   • ${f}`));
  if (files.length > 10) {
    console.log(`   ... and ${files.length - 10} more files`);
  }
}

// Run the test
main().catch(console.error);