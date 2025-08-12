/**
 * Eight Pillars Screening Component
 * Main interface for screening stocks against the Eight Pillars Framework
 */

import React, { useState } from 'react';
import eightPillarsEngine from '../services/eightPillarsEngine';
import './EightPillarsScreen.css';

const EightPillarsScreen = () => {
  const [screeningMode, setScreeningMode] = useState('single'); // 'single' or 'batch'
  const [inputSymbol, setInputSymbol] = useState('');
  const [batchSymbols, setBatchSymbols] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [screeningResults, setScreeningResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    minPillars: 6,
    sector: 'all',
    sortBy: 'totalScore'
  });

  // Popular stocks for quick screening
  const popularStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK.B', 'JNJ', 'V'];

  /**
   * Analyze a single stock
   */
  const analyzeSingleStock = async () => {
    if (!inputSymbol.trim()) {
      setError('Please enter a stock symbol');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const result = await eightPillarsEngine.analyzeStock(inputSymbol.toUpperCase());
      setAnalysis(result);
    } catch (err) {
      setError(`Failed to analyze ${inputSymbol}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Screen multiple stocks
   */
  const screenMultipleStocks = async () => {
    const symbols = batchSymbols
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(s => s.length > 0);

    if (symbols.length === 0) {
      setError('Please enter at least one stock symbol');
      return;
    }

    setLoading(true);
    setError(null);
    setScreeningResults(null);

    try {
      const results = await eightPillarsEngine.screenStocks(symbols, {
        minPillars: filters.minPillars,
        sortBy: filters.sortBy,
        includePartialData: true
      });
      setScreeningResults(results);
    } catch (err) {
      setError(`Screening failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Quick screen popular stocks
   */
  const quickScreenPopular = async () => {
    setBatchSymbols(popularStocks.join(', '));
    setScreeningMode('batch');
    
    setLoading(true);
    setError(null);
    
    try {
      const results = await eightPillarsEngine.screenStocks(popularStocks, {
        minPillars: 0, // Show all results
        sortBy: 'totalScore',
        includePartialData: true
      });
      setScreeningResults(results);
    } catch (err) {
      setError(`Quick screen failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get color class based on pillar pass/fail
   */
  const getPillarColorClass = (passes) => {
    return passes ? 'pillar-pass' : 'pillar-fail';
  };

  /**
   * Get rating color class
   */
  const getRatingColorClass = (score) => {
    if (score >= 7) return 'rating-elite';
    if (score >= 6) return 'rating-strong';
    if (score >= 4) return 'rating-moderate';
    return 'rating-weak';
  };

  /**
   * Format percentage values
   */
  const formatPercent = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return `${value.toFixed(1)}%`;
  };

  /**
   * Render pillar indicator
   */
  const renderPillarIndicator = (pillarData, pillarName) => {
    const assessment = pillarData?.assessment;
    if (!assessment) return null;

    return (
      <div className={`pillar-indicator ${getPillarColorClass(assessment.passes)}`}>
        <div className="pillar-header">
          <span className="pillar-name">{pillarName}</span>
          <span className="pillar-status">{assessment.passes ? '✓' : '✗'}</span>
        </div>
        <div className="pillar-details">
          <span className="pillar-value">
            {typeof assessment.value === 'number' ? assessment.value.toFixed(1) : assessment.value}
          </span>
          <span className="pillar-threshold">
            (Threshold: {assessment.threshold})
          </span>
        </div>
        <div className="pillar-trend">
          Trend: {assessment.trend || 'N/A'}
        </div>
      </div>
    );
  };

  /**
   * Render single stock analysis
   */
  const renderSingleAnalysis = () => {
    if (!analysis) return null;

    return (
      <div className="analysis-container">
        <div className="analysis-header">
          <h2>{analysis.symbol} - {analysis.companyName}</h2>
          <div className="analysis-meta">
            <span className="sector">{analysis.sector}</span>
            <span className="industry">{analysis.industry}</span>
          </div>
        </div>

        <div className="summary-section">
          <div className={`overall-score ${getRatingColorClass(analysis.summary.totalScore)}`}>
            <div className="score-number">{analysis.summary.totalScore}/8</div>
            <div className="score-label">Pillars Passed</div>
            <div className="score-rating">{analysis.summary.overallRating}</div>
          </div>
          
          <div className="summary-details">
            <div className="recommendation">
              <strong>Recommendation:</strong> {analysis.summary.recommendation}
            </div>
            <div className="confidence">
              <strong>Data Confidence:</strong> {analysis.summary.confidenceScore.toFixed(0)}%
            </div>
            <div className="strengths">
              <strong>Primary Strength:</strong> {analysis.summary.primaryStrength}
            </div>
            <div className="weaknesses">
              <strong>Primary Weakness:</strong> {analysis.summary.primaryWeakness}
            </div>
          </div>
        </div>

        <div className="pillars-grid">
          <h3>Eight Pillars Analysis</h3>
          <div className="pillars-container">
            {renderPillarIndicator(analysis.moat, 'Moat (ROIC)')}
            {renderPillarIndicator(analysis.fortress, 'Fortress (Debt/EBITDA)')}
            {renderPillarIndicator(analysis.engine, 'Engine (Revenue Growth)')}
            {renderPillarIndicator(analysis.efficiency, 'Efficiency (Rule of 40)')}
            {renderPillarIndicator(analysis.pricingPower, 'Pricing Power (Margins)')}
            {renderPillarIndicator(analysis.capitalAllocation, 'Capital Allocation (ROE)')}
            {renderPillarIndicator(analysis.cashGeneration, 'Cash Generation (FCF)')}
            {renderPillarIndicator(analysis.durability, 'Durability (Market Share)')}
          </div>
        </div>

        <div className="detailed-metrics">
          <h3>Detailed Metrics</h3>
          <div className="metrics-grid">
            <div className="metric-card">
              <h4>Profitability</h4>
              <div className="metric-row">
                <span>ROIC:</span>
                <span>{formatPercent(analysis.moat.roic)}</span>
              </div>
              <div className="metric-row">
                <span>ROE:</span>
                <span>{formatPercent(analysis.capitalAllocation.roe)}</span>
              </div>
              <div className="metric-row">
                <span>Gross Margin:</span>
                <span>{formatPercent(analysis.pricingPower.grossMargin)}</span>
              </div>
              <div className="metric-row">
                <span>FCF Margin:</span>
                <span>{formatPercent(analysis.cashGeneration.fcfMargin)}</span>
              </div>
            </div>

            <div className="metric-card">
              <h4>Growth</h4>
              <div className="metric-row">
                <span>Revenue CAGR (3yr):</span>
                <span>{formatPercent(analysis.engine.revenueCagr3Yr)}</span>
              </div>
              <div className="metric-row">
                <span>Revenue CAGR (5yr):</span>
                <span>{formatPercent(analysis.engine.revenueCagr5Yr)}</span>
              </div>
              <div className="metric-row">
                <span>Rule of 40:</span>
                <span>{formatPercent(analysis.efficiency.ruleOf40)}</span>
              </div>
            </div>

            <div className="metric-card">
              <h4>Financial Health</h4>
              <div className="metric-row">
                <span>Debt/EBITDA:</span>
                <span>{analysis.fortress.debtToEbitda.toFixed(2)}x</span>
              </div>
              <div className="metric-row">
                <span>Interest Coverage:</span>
                <span>{analysis.fortress.interestCoverage.toFixed(1)}x</span>
              </div>
              <div className="metric-row">
                <span>FCF Conversion:</span>
                <span>{formatPercent(analysis.cashGeneration.fcfConversion)}</span>
              </div>
              <div className="metric-row">
                <span>Buyback Yield:</span>
                <span>{formatPercent(analysis.capitalAllocation.buybackYield)}</span>
              </div>
            </div>

            <div className="metric-card">
              <h4>Market Position</h4>
              <div className="metric-row">
                <span>Competitive Position:</span>
                <span>{analysis.durability.competitivePosition}</span>
              </div>
              <div className="metric-row">
                <span>TAM Growth:</span>
                <span>{formatPercent(analysis.durability.tamGrowthRate)}</span>
              </div>
              <div className="metric-row">
                <span>Secular Trends:</span>
                <span>{analysis.durability.secularTrends.join(', ') || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Render batch screening results
   */
  const renderScreeningResults = () => {
    if (!screeningResults) return null;

    return (
      <div className="screening-results">
        <div className="results-header">
          <h2>Screening Results</h2>
          <div className="results-stats">
            <span>Screened: {screeningResults.statistics.totalScreened}</span>
            <span>Passed (6+ Pillars): {screeningResults.statistics.totalPassed}</span>
            <span>Average Score: {screeningResults.statistics.averageScore.toFixed(1)}</span>
          </div>
        </div>

        <div className="results-filters">
          <label>
            Min Pillars:
            <select 
              value={filters.minPillars} 
              onChange={(e) => setFilters({...filters, minPillars: parseInt(e.target.value)})}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          
          <label>
            Sort By:
            <select 
              value={filters.sortBy} 
              onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
            >
              <option value="totalScore">Total Score</option>
              <option value="roic">ROIC</option>
              <option value="growth">Revenue Growth</option>
            </select>
          </label>
        </div>

        <div className="results-table">
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Company</th>
                <th>Score</th>
                <th>Rating</th>
                <th>ROIC</th>
                <th>Debt/EBITDA</th>
                <th>Rev CAGR</th>
                <th>Rule of 40</th>
                <th>Gross Margin</th>
                <th>ROE</th>
                <th>FCF Margin</th>
                <th>Market Position</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {screeningResults.stocks
                .filter(stock => stock.summary.totalScore >= filters.minPillars)
                .map(stock => (
                  <tr key={stock.symbol} className={getRatingColorClass(stock.summary.totalScore)}>
                    <td className="symbol">{stock.symbol}</td>
                    <td className="company">{stock.companyName}</td>
                    <td className="score">
                      <span className="score-badge">{stock.summary.totalScore}/8</span>
                    </td>
                    <td className="rating">{stock.summary.overallRating}</td>
                    <td className={getPillarColorClass(stock.moat.assessment?.passes)}>
                      {formatPercent(stock.moat.roic)}
                    </td>
                    <td className={getPillarColorClass(stock.fortress.assessment?.passes)}>
                      {stock.fortress.debtToEbitda.toFixed(2)}x
                    </td>
                    <td className={getPillarColorClass(stock.engine.assessment?.passes)}>
                      {formatPercent(stock.engine.revenueCagr3Yr)}
                    </td>
                    <td className={getPillarColorClass(stock.efficiency.assessment?.passes)}>
                      {formatPercent(stock.efficiency.ruleOf40)}
                    </td>
                    <td className={getPillarColorClass(stock.pricingPower.assessment?.passes)}>
                      {formatPercent(stock.pricingPower.grossMargin)}
                    </td>
                    <td className={getPillarColorClass(stock.capitalAllocation.assessment?.passes)}>
                      {formatPercent(stock.capitalAllocation.roe)}
                    </td>
                    <td className={getPillarColorClass(stock.cashGeneration.assessment?.passes)}>
                      {formatPercent(stock.cashGeneration.fcfMargin)}
                    </td>
                    <td className={getPillarColorClass(stock.durability.assessment?.passes)}>
                      {stock.durability.competitivePosition}
                    </td>
                    <td>
                      <button 
                        className="btn-view-details"
                        onClick={() => {
                          setAnalysis(stock);
                          setScreeningMode('single');
                        }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {screeningResults.statistics.topPerformers.length > 0 && (
          <div className="top-performers">
            <h3>Top Performers</h3>
            <ul>
              {screeningResults.statistics.topPerformers.map((performer, index) => (
                <li key={index}>{performer}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="eight-pillars-screen">
      <div className="screen-header">
        <h1>Eight Pillars Framework Screening</h1>
        <p>Screen stocks against the comprehensive Eight Pillars investment framework</p>
      </div>

      <div className="screening-controls">
        <div className="mode-selector">
          <button 
            className={`mode-btn ${screeningMode === 'single' ? 'active' : ''}`}
            onClick={() => setScreeningMode('single')}
          >
            Single Stock Analysis
          </button>
          <button 
            className={`mode-btn ${screeningMode === 'batch' ? 'active' : ''}`}
            onClick={() => setScreeningMode('batch')}
          >
            Batch Screening
          </button>
        </div>

        {screeningMode === 'single' ? (
          <div className="single-input">
            <input
              type="text"
              placeholder="Enter stock symbol (e.g., AAPL)"
              value={inputSymbol}
              onChange={(e) => setInputSymbol(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && analyzeSingleStock()}
            />
            <button 
              className="btn-analyze"
              onClick={analyzeSingleStock}
              disabled={loading}
            >
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        ) : (
          <div className="batch-input">
            <textarea
              placeholder="Enter stock symbols separated by commas (e.g., AAPL, MSFT, GOOGL)"
              value={batchSymbols}
              onChange={(e) => setBatchSymbols(e.target.value)}
              rows="3"
            />
            <div className="batch-controls">
              <button 
                className="btn-screen"
                onClick={screenMultipleStocks}
                disabled={loading}
              >
                {loading ? 'Screening...' : 'Screen Stocks'}
              </button>
              <button 
                className="btn-quick-screen"
                onClick={quickScreenPopular}
                disabled={loading}
              >
                Quick Screen Popular Stocks
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
        </div>
      )}

      {loading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Analyzing financial data...</p>
        </div>
      )}

      {screeningMode === 'single' && renderSingleAnalysis()}
      {screeningMode === 'batch' && renderScreeningResults()}
    </div>
  );
};

export default EightPillarsScreen;