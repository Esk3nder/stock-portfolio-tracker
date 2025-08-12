/**
 * Eight Pillars Dashboard Component
 * Visual dashboard for displaying Eight Pillars analysis with charts
 */

import React from 'react';
import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Area, AreaChart
} from 'recharts';
import './EightPillarsDashboard.css';

const EightPillarsDashboard = ({ analysis, screeningResults }) => {
  // Color palette
  const COLORS = {
    elite: '#667eea',
    strong: '#28a745',
    moderate: '#ffc107',
    weak: '#dc3545',
    primary: '#007bff',
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8'
  };

  // Prepare radar chart data for single stock
  const prepareRadarData = (stockAnalysis) => {
    if (!stockAnalysis) return [];

    return [
      {
        pillar: 'Moat',
        value: Math.min(100, (stockAnalysis.moat.roic / 20) * 50),
        fullMark: 100
      },
      {
        pillar: 'Fortress',
        value: Math.min(100, Math.max(0, (2.5 - stockAnalysis.fortress.debtToEbitda) / 2.5 * 100)),
        fullMark: 100
      },
      {
        pillar: 'Engine',
        value: Math.min(100, (stockAnalysis.engine.revenueCagr3Yr / 10) * 50),
        fullMark: 100
      },
      {
        pillar: 'Efficiency',
        value: Math.min(100, (stockAnalysis.efficiency.ruleOf40 / 40) * 50),
        fullMark: 100
      },
      {
        pillar: 'Pricing',
        value: Math.min(100, (stockAnalysis.pricingPower.grossMargin / 50) * 50),
        fullMark: 100
      },
      {
        pillar: 'Allocation',
        value: Math.min(100, (stockAnalysis.capitalAllocation.roe / 20) * 50),
        fullMark: 100
      },
      {
        pillar: 'Cash',
        value: Math.min(100, (stockAnalysis.cashGeneration.fcfMargin / 15) * 50),
        fullMark: 100
      },
      {
        pillar: 'Durability',
        value: stockAnalysis.durability.assessment?.passes ? 75 : 25,
        fullMark: 100
      }
    ];
  };

  // Prepare bar chart data for multiple stocks comparison
  const prepareComparisonData = (results) => {
    if (!results || !results.stocks) return [];

    return results.stocks.slice(0, 10).map(stock => ({
      name: stock.symbol,
      score: stock.summary.totalScore,
      roic: stock.moat.roic,
      growth: stock.engine.revenueCagr3Yr,
      fcfMargin: stock.cashGeneration.fcfMargin
    }));
  };

  // Prepare distribution data for pie chart
  const prepareDistributionData = (results) => {
    if (!results || !results.stocks) return [];

    const distribution = {
      elite: 0,
      strong: 0,
      moderate: 0,
      weak: 0
    };

    results.stocks.forEach(stock => {
      const score = stock.summary.totalScore;
      if (score >= 7) distribution.elite++;
      else if (score >= 6) distribution.strong++;
      else if (score >= 4) distribution.moderate++;
      else distribution.weak++;
    });

    return [
      { name: 'Elite (7-8)', value: distribution.elite, color: COLORS.elite },
      { name: 'Strong (6)', value: distribution.strong, color: COLORS.strong },
      { name: 'Moderate (4-5)', value: distribution.moderate, color: COLORS.moderate },
      { name: 'Weak (0-3)', value: distribution.weak, color: COLORS.weak }
    ].filter(d => d.value > 0);
  };

  // Prepare historical trend data
  const prepareTrendData = (stockAnalysis) => {
    if (!stockAnalysis) return [];

    const trendData = [];
    if (stockAnalysis.moat.roicHistory) {
      stockAnalysis.moat.roicHistory.forEach((item, index) => {
        const dataPoint = trendData[index] || { year: item.year };
        dataPoint.roic = item.roic;
        trendData[index] = dataPoint;
      });
    }

    if (stockAnalysis.engine.revenueHistory) {
      stockAnalysis.engine.revenueHistory.forEach((item, index) => {
        const dataPoint = trendData[index] || { year: item.year };
        dataPoint.growth = item.growth;
        trendData[index] = dataPoint;
      });
    }

    if (stockAnalysis.capitalAllocation.history) {
      stockAnalysis.capitalAllocation.history.forEach((item, index) => {
        const dataPoint = trendData[index] || { year: item.year };
        dataPoint.roe = item.roe;
        trendData[index] = dataPoint;
      });
    }

    return trendData.slice(0, 5).reverse();
  };

  // Prepare pillar pass rate data
  const preparePillarPassRates = (results) => {
    if (!results || !results.stocks) return [];

    const passRates = {
      moat: 0,
      fortress: 0,
      engine: 0,
      efficiency: 0,
      pricingPower: 0,
      capitalAllocation: 0,
      cashGeneration: 0,
      durability: 0
    };

    const total = results.stocks.length;
    if (total === 0) return [];

    results.stocks.forEach(stock => {
      if (stock.moat.assessment?.passes) passRates.moat++;
      if (stock.fortress.assessment?.passes) passRates.fortress++;
      if (stock.engine.assessment?.passes) passRates.engine++;
      if (stock.efficiency.assessment?.passes) passRates.efficiency++;
      if (stock.pricingPower.assessment?.passes) passRates.pricingPower++;
      if (stock.capitalAllocation.assessment?.passes) passRates.capitalAllocation++;
      if (stock.cashGeneration.assessment?.passes) passRates.cashGeneration++;
      if (stock.durability.assessment?.passes) passRates.durability++;
    });

    return [
      { name: 'Moat', passRate: (passRates.moat / total) * 100 },
      { name: 'Fortress', passRate: (passRates.fortress / total) * 100 },
      { name: 'Engine', passRate: (passRates.engine / total) * 100 },
      { name: 'Efficiency', passRate: (passRates.efficiency / total) * 100 },
      { name: 'Pricing', passRate: (passRates.pricingPower / total) * 100 },
      { name: 'Allocation', passRate: (passRates.capitalAllocation / total) * 100 },
      { name: 'Cash Gen', passRate: (passRates.cashGeneration / total) * 100 },
      { name: 'Durability', passRate: (passRates.durability / total) * 100 }
    ];
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Render single stock dashboard
  const renderSingleStockDashboard = () => {
    if (!analysis) return null;

    const radarData = prepareRadarData(analysis);
    const trendData = prepareTrendData(analysis);

    return (
      <div className="dashboard-single">
        <div className="dashboard-header">
          <h2>{analysis.symbol} - Eight Pillars Analysis Dashboard</h2>
          <div className="dashboard-score">
            <span className={`score-badge ${getRatingClass(analysis.summary.totalScore)}`}>
              {analysis.summary.totalScore}/8 Pillars
            </span>
            <span className="rating-text">{analysis.summary.overallRating}</span>
          </div>
        </div>

        <div className="dashboard-grid">
          {/* Radar Chart - Pillar Strengths */}
          <div className="chart-card">
            <h3>Pillar Strength Analysis</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid strokeDasharray="3 3" />
                <PolarAngleAxis dataKey="pillar" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name={analysis.symbol}
                  dataKey="value"
                  stroke={COLORS.primary}
                  fill={COLORS.primary}
                  fillOpacity={0.6}
                />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Historical Trends */}
          {trendData.length > 0 && (
            <div className="chart-card">
              <h3>Historical Performance Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {trendData[0].roic !== undefined && (
                    <Line
                      type="monotone"
                      dataKey="roic"
                      stroke={COLORS.primary}
                      name="ROIC %"
                      strokeWidth={2}
                    />
                  )}
                  {trendData[0].growth !== undefined && (
                    <Line
                      type="monotone"
                      dataKey="growth"
                      stroke={COLORS.success}
                      name="Revenue Growth %"
                      strokeWidth={2}
                    />
                  )}
                  {trendData[0].roe !== undefined && (
                    <Line
                      type="monotone"
                      dataKey="roe"
                      stroke={COLORS.warning}
                      name="ROE %"
                      strokeWidth={2}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Key Metrics Bar Chart */}
          <div className="chart-card">
            <h3>Key Financial Metrics</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  { metric: 'ROIC', value: analysis.moat.roic, threshold: 20 },
                  { metric: 'Rev Growth', value: analysis.engine.revenueCagr3Yr, threshold: 10 },
                  { metric: 'Rule of 40', value: analysis.efficiency.ruleOf40, threshold: 40 },
                  { metric: 'Gross Margin', value: analysis.pricingPower.grossMargin, threshold: 40 },
                  { metric: 'ROE', value: analysis.capitalAllocation.roe, threshold: 20 },
                  { metric: 'FCF Margin', value: analysis.cashGeneration.fcfMargin, threshold: 15 }
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="value" fill={COLORS.primary} name="Actual" />
                <Bar dataKey="threshold" fill={COLORS.secondary} name="Threshold" opacity={0.5} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pillar Pass/Fail Summary */}
          <div className="chart-card">
            <h3>Pillar Assessment Summary</h3>
            <div className="pillar-summary">
              {Object.entries({
                'Moat': analysis.moat.assessment?.passes,
                'Fortress': analysis.fortress.assessment?.passes,
                'Engine': analysis.engine.assessment?.passes,
                'Efficiency': analysis.efficiency.assessment?.passes,
                'Pricing Power': analysis.pricingPower.assessment?.passes,
                'Capital Allocation': analysis.capitalAllocation.assessment?.passes,
                'Cash Generation': analysis.cashGeneration.assessment?.passes,
                'Durability': analysis.durability.assessment?.passes
              }).map(([pillar, passes]) => (
                <div key={pillar} className={`pillar-item ${passes ? 'pass' : 'fail'}`}>
                  <span className="pillar-icon">{passes ? '✓' : '✗'}</span>
                  <span className="pillar-label">{pillar}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render batch screening dashboard
  const renderBatchDashboard = () => {
    if (!screeningResults || !screeningResults.stocks) return null;

    const comparisonData = prepareComparisonData(screeningResults);
    const distributionData = prepareDistributionData(screeningResults);
    const pillarPassRates = preparePillarPassRates(screeningResults);

    return (
      <div className="dashboard-batch">
        <div className="dashboard-header">
          <h2>Eight Pillars Screening Dashboard</h2>
          <div className="dashboard-stats">
            <span>Stocks Analyzed: {screeningResults.statistics.totalScreened}</span>
            <span>Framework Qualified: {screeningResults.statistics.totalPassed}</span>
            <span>Average Score: {screeningResults.statistics.averageScore.toFixed(1)}</span>
          </div>
        </div>

        <div className="dashboard-grid">
          {/* Score Distribution Pie Chart */}
          {distributionData.length > 0 && (
            <div className="chart-card">
              <h3>Quality Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Stocks Comparison */}
          {comparisonData.length > 0 && (
            <div className="chart-card">
              <h3>Top Stocks by Pillar Score</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 8]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="score" fill={COLORS.primary} name="Pillars Passed">
                    {comparisonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getScoreColor(entry.score)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Pillar Pass Rates */}
          {pillarPassRates.length > 0 && (
            <div className="chart-card">
              <h3>Pillar Pass Rates Across Portfolio</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={pillarPassRates} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip content={<CustomTooltip />} formatter={(value) => `${value.toFixed(0)}%`} />
                  <Bar dataKey="passRate" fill={COLORS.info} name="Pass Rate">
                    {pillarPassRates.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.passRate > 50 ? COLORS.success : COLORS.danger}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Multi-metric Comparison */}
          {comparisonData.length > 0 && (
            <div className="chart-card">
              <h3>Key Metrics Comparison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="roic"
                    stackId="1"
                    stroke={COLORS.primary}
                    fill={COLORS.primary}
                    name="ROIC %"
                  />
                  <Area
                    type="monotone"
                    dataKey="growth"
                    stackId="2"
                    stroke={COLORS.success}
                    fill={COLORS.success}
                    name="Growth %"
                  />
                  <Area
                    type="monotone"
                    dataKey="fcfMargin"
                    stackId="3"
                    stroke={COLORS.warning}
                    fill={COLORS.warning}
                    name="FCF Margin %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Top Performers List */}
        {screeningResults.statistics.topPerformers.length > 0 && (
          <div className="top-performers-section">
            <h3>Elite Compounders</h3>
            <div className="performers-grid">
              {screeningResults.statistics.topPerformers.map((performer, index) => (
                <div key={index} className="performer-card">
                  <span className="performer-rank">#{index + 1}</span>
                  <span className="performer-name">{performer}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Helper function to get rating class
  const getRatingClass = (score) => {
    if (score >= 7) return 'elite';
    if (score >= 6) return 'strong';
    if (score >= 4) return 'moderate';
    return 'weak';
  };

  // Helper function to get score color
  const getScoreColor = (score) => {
    if (score >= 7) return COLORS.elite;
    if (score >= 6) return COLORS.strong;
    if (score >= 4) return COLORS.moderate;
    return COLORS.weak;
  };

  return (
    <div className="eight-pillars-dashboard">
      {analysis && renderSingleStockDashboard()}
      {screeningResults && renderBatchDashboard()}
      
      {!analysis && !screeningResults && (
        <div className="dashboard-empty">
          <h3>No Data Available</h3>
          <p>Run a stock analysis or screening to see the dashboard</p>
        </div>
      )}
    </div>
  );
};

export default EightPillarsDashboard;