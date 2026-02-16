const db = require('../database/db');

class AnalyticsService {
  async generateAnalytics(data, fileId, userId) {
    if (!data || data.length === 0) {
      return {
        pieCharts: [],
        barCharts: [],
        lineCharts: [],
        summary: {}
      };
    }

    const numericColumns = this.getNumericColumns(data);
    const categoricalColumns = this.getCategoricalColumns(data);

    const analytics = {
      pieCharts: this.generatePieCharts(data, categoricalColumns),
      barCharts: this.generateBarCharts(data, categoricalColumns, numericColumns),
      lineCharts: this.generateLineCharts(data, numericColumns, categoricalColumns),
      summary: this.generateSummary(data, numericColumns)
    };

    // Add AI Insights
    analytics.aiInsights = this.generateAiInsights(analytics, data);

    // Add specific Time-Sales trend if date column exists
    const timeSalesChart = this.generateTimeSalesChart(data, numericColumns);
    if (timeSalesChart) {
      analytics.lineCharts.unshift(timeSalesChart);
    }

    // Cache analytics
    this.cacheAnalytics(userId, fileId, analytics);

    return analytics;
  }

  getNumericColumns(data) {
    if (!data || data.length === 0) return [];

    const firstRow = data[0];
    return Object.keys(firstRow).filter(key => {
      if (key === '_id') return false;
      const value = firstRow[key];
      return typeof value === 'number' && !isNaN(value);
    });
  }

  getCategoricalColumns(data) {
    if (!data || data.length === 0) return [];

    const firstRow = data[0];
    return Object.keys(firstRow).filter(key => {
      if (key === '_id') return false;
      const value = firstRow[key];
      return typeof value === 'string' || (typeof value !== 'number');
    });
  }

  generatePieCharts(data, categoricalColumns) {
    const charts = [];

    // Filter out columns that are likely unique identifiers or names
    categoricalColumns.slice(0, 3).forEach(column => {
      const distribution = {};

      data.forEach(row => {
        const value = row[column] || 'Unknown';
        distribution[value] = (distribution[value] || 0) + 1;
      });

      const chartData = Object.keys(distribution).map(key => ({
        name: String(key).substring(0, 20),
        value: distribution[key]
      })).sort((a, b) => b.value - a.value).slice(0, 20);

      if (chartData.length > 0) {
        charts.push({
          title: `Distribution: ${column}`,
          data: chartData
        });
      }
    });

    return charts;
  }

  generateBarCharts(data, categoricalColumns, numericColumns) {
    const charts = [];

    if (categoricalColumns.length > 0 && numericColumns.length > 0) {
      const catCol = categoricalColumns[0];
      const numCol = numericColumns[0];

      const aggregated = {};

      data.forEach(row => {
        const category = row[catCol] || 'Unknown';
        const value = row[numCol] || 0;
        aggregated[category] = (aggregated[category] || 0) + value;
      });

      const chartData = Object.keys(aggregated).map(key => ({
        name: String(key).substring(0, 20),
        value: aggregated[key]
      })).sort((a, b) => b.value - a.value).slice(0, 20);

      if (chartData.length > 0) {
        charts.push({
          title: `${numCol} by ${catCol}`,
          data: chartData
        });
      }
    }

    return charts;
  }

  generateLineCharts(data, numericColumns, categoricalColumns) {
    const charts = [];

    // Find a suitable label column
    let labelColumn = 'Row';
    if (categoricalColumns && categoricalColumns.length > 0) {
      // Prefer specific name-like columns
      const preferred = ['name', 'product', 'item', 'category', 'title'];
      labelColumn = categoricalColumns.find(c => preferred.includes(c.toLowerCase())) || categoricalColumns[0];
    }

    numericColumns.slice(0, 2).forEach(column => {
      const chartData = data.slice(0, 50).map((row, index) => ({
        name: labelColumn === 'Row' ? `Row ${index + 1}` : (row[labelColumn] || `Row ${index + 1}`),
        value: row[column] || 0
      }));

      if (chartData.length > 0) {
        charts.push({
          title: `Trend: ${column}`,
          data: chartData
        });
      }
    });

    return charts;
  }

  generateTimeSalesChart(data, numericColumns) {
    if (!data || data.length === 0) return null;

    // Helper: parse robustly from string/number to Date (handles ISO strings and epoch seconds/ms)
    const parseDateVal = (val) => {
      if (val == null) return null;
      if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
      // number-like epoch
      if (typeof val === 'number') {
        if (Math.abs(val) > 1e12) return new Date(val); // ms
        if (Math.abs(val) > 1e9) return new Date(val * 1000); // seconds
        return null;
      }
      // numeric strings
      const n = Number(val);
      if (!Number.isNaN(n) && String(val).trim().length <= 13 && Math.abs(n) > 1e9) {
        if (Math.abs(n) > 1e12) return new Date(n);
        if (Math.abs(n) > 1e9) return new Date(n * 1000);
      }
      // date strings
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d;
      return null;
    };

    // Try to find a date column by name preference
    let dateCol = Object.keys(data[0] || {}).find(key =>
      ['date', 'time', 'timestamp', 'created_at'].includes(key.toLowerCase())
    );

    // If none by name, scan columns and pick the one with most parseable dates
    if (!dateCol) {
      const cols = Object.keys(data[0] || {});
      let best = null;
      let bestCount = 0;
      const sampleSize = Math.min(200, data.length);

      cols.forEach(col => {
        let count = 0;
        for (let i = 0; i < sampleSize; i++) {
          if (parseDateVal(data[i][col])) count++;
        }
        if (count > bestCount) {
          bestCount = count;
          best = col;
        }
      });

      // require at least a few parsable values to consider it a date column
      if (best && bestCount >= Math.max(1, Math.floor(sampleSize * 0.05))) {
        dateCol = best;
      }
    }

    if (!dateCol) return null;

    const salesCol = numericColumns.find(col =>
      ['sales', 'revenue', 'total', 'amount'].includes(col.toLowerCase())
    ) || numericColumns[0];

    if (!salesCol) return null;

    const monthly = {};

    // Aggregate only for rows with valid dates (no dummy month initialization)
    data.forEach(row => {
      const dateVal = row[dateCol];
      const parsed = parseDateVal(dateVal);
      if (!parsed) return;
      const year = parsed.getFullYear();
      const month = parsed.getMonth();
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;
      const label = new Date(year, month, 1).toLocaleString('default', { month: 'short', year: 'numeric' });

      if (!monthly[key]) monthly[key] = { label, value: 0 };
      monthly[key].value += (Number(row[salesCol]) || 0);
    });

    const chartData = Object.keys(monthly)
      .sort()
      .map(key => ({ name: monthly[key].label, value: Number(monthly[key].value.toFixed(2)) }));

    if (chartData.length === 0) return null;

    return { title: 'Trend: Time-Sales', data: chartData };
  }

  generateSummary(data, numericColumns) {
    const summary = {
      totalRows: data.length,
      totalColumns: Object.keys(data[0] || {}).length
    };

    numericColumns.forEach(column => {
      const values = data.map(row => row[column]).filter(v => v != null && !isNaN(v));
      if (values.length > 0) {
        summary[column] = {
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          sum: values.reduce((a, b) => a + b, 0)
        };
      }
    });

    return summary;
  }

  cacheAnalytics(userId, fileId, analytics) {
    const chartTypes = ['pie', 'bar', 'line', 'summary'];

    chartTypes.forEach(type => {
      db.getDb().run(
        `INSERT OR REPLACE INTO analytics_cache (user_id, file_id, chart_type, chart_data, updated_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [userId, fileId, type, JSON.stringify(analytics[`${type}Charts`] || analytics.summary)],
        (err) => {
          if (err) console.error('Error caching analytics:', err);
        }
      );
    });
  }

  generateAiInsights(analytics, data) {
    const insights = [];
    const summaryKeys = Object.keys(analytics.summary).filter(k => k !== 'totalRows' && k !== 'totalColumns');

    // 1. Dynamic Overview
    const dimensionFocus = summaryKeys.length > 0 ? `with a primary focus on **${summaryKeys[0]}**` : "";
    insights.push(`Analyzed ${analytics.summary.totalRows} records ${dimensionFocus}. The dataset exhibits ${analytics.summary.totalColumns > 8 ? 'high' : 'standard'} complexity across business dimensions.`);

    // 2. Anomaly/Peak Detection
    summaryKeys.forEach(key => {
      const stats = analytics.summary[key];
      if (stats.max > stats.avg * 3) {
        insights.push(`Discovery: A significant peak in **${key}** was detected (Max: ${stats.max}), which is substantially higher than the average (${stats.avg.toFixed(2)}).`);
      }
    });

    // 3. Category Performance (Dynamic Column Names)
    if (analytics.barCharts.length > 0) {
      const chart = analytics.barCharts[0];
      const top = chart.data[0];
      const colName = chart.title.split(' by ')[1] || 'category';
      if (top) {
        insights.push(`In terms of **${colName}**, "${top.name}" is outperforming others, suggesting it as a key driver for your business.`);
      }
    }

    // 4. Trend Intelligence
    const timeSales = analytics.lineCharts.find(c => c.title === 'Trend: Time-Sales');
    if (timeSales && timeSales.data.length >= 2) {
      const values = timeSales.data.map(d => d.value);
      const last = values[values.length - 1];
      const prev = values[values.length - 2];
      const growth = prev !== 0 ? ((last - prev) / prev * 100).toFixed(1) : 0;

      if (growth > 20) {
        insights.push(`Explosive Growth: Your ${timeSales.title.split(': ')[1]} saw a **${growth}% surge** recently. Investigating the cause could help replicate this success.`);
      } else if (growth > 0) {
        insights.push(`Steady Progress: Maintain current strategies as you've achieved a **${growth}% month-over-month increase**.`);
      } else if (growth < -10) {
        insights.push(`Alert: A **${Math.abs(growth)}% decline** was observed. This may indicate seasonal fluctuations or emerging bottlenecks in your workflow.`);
      }
    }

    // 5. Distribution Diversity
    if (analytics.pieCharts.length > 0) {
      const chart = analytics.pieCharts[0];
      const diversity = chart.data.length;
      const colName = chart.title.split(': ')[1] || 'segment';
      if (diversity > 10) {
        insights.push(`Your **${colName}** base is highly diversified with over ${diversity} segments, reducing dependency on any single source.`);
      } else if (diversity > 1 && diversity <= 3) {
        insights.push(`Streamlined Operations: Your business shows high concentration in just a few **${colName}** segments.`);
      }
    }

    // 6. Value Summary
    if (summaryKeys.includes('price') || summaryKeys.includes('Sales')) {
      const key = summaryKeys.includes('price') ? 'price' : 'Sales';
      insights.push(`Financial Footprint: The total value across your tracked **${key}** metrics has reached **${analytics.summary[key].sum.toFixed(2)}**.`);
    }

    // Ensure we return a varied selection (max 4-5)
    return insights.sort(() => 0.5 - Math.random()).slice(0, 5);
  }
}

module.exports = new AnalyticsService();

