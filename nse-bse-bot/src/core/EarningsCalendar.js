/**
 * Earnings Calendar for Nifty 50 Companies
 * Tracks upcoming earnings dates to avoid volatility
 */

const Logger = require('../utils/logger');

class EarningsCalendar {
  constructor(options = {}) {
    this.logger = options.logger || new Logger({ module: 'Earnings' });
    
    // Approximate earnings dates for major Nifty 50 companies
    // Q1 (Apr-Jun), Q2 (Jul-Sep), Q3 (Oct-Dec), Q4 (Jan-Mar)
    this.calendar = {
      // IT Sector — usually last week of quarter
      'TCS':        { q1: 'Jul-15/2026', q2: 'Oct-15/2026', q3: 'Jan-15/2027', q4: 'Apr-15/2026' },
      'INFY':        { q1: 'Jul-18/2026', q2: 'Oct-18/2026', q3: 'Jan-18/2027', q4: 'Apr-18/2026' },
      'WIPRO':       { q1: 'Jul-20/2026', q2: 'Oct-20/2026', q3: 'Jan-20/2027', q4: 'Apr-20/2026' },
      'HCLTECH':     { q1: 'Jul-22/2026', q2: 'Oct-22/2026', q3: 'Jan-22/2027', q4: 'Apr-22/2026' },
      'TECHM':       { q1: 'Jul-25/2026', q2: 'Oct-25/2026', q3: 'Jan-25/2027', q4: 'Apr-25/2026' },
      'LTIM':        { q1: 'Jul-28/2026', q2: 'Oct-28/2026', q3: 'Jan-28/2027', q4: 'Apr-28/2026' },

      // Banking — usually first half of quarter-end month
      'HDFCBANK':    { q1: 'Aug-03/2026', q2: 'Nov-03/2026', q3: 'Feb-03/2027', q4: 'May-03/2026' },
      'ICICIBANK':   { q1: 'Jul-28/2026', q2: 'Oct-28/2026', q3: 'Jan-28/2027', q4: 'Apr-28/2026' },
      'SBIN':        { q1: 'Aug-05/2026', q2: 'Nov-05/2026', q3: 'Feb-05/2027', q4: 'May-05/2026' },
      'KOTAKBANK':   { q1: 'Aug-10/2026', q2: 'Nov-10/2026', q3: 'Feb-10/2027', q4: 'May-10/2026' },
      'AXISBANK':    { q1: 'Aug-12/2026', q2: 'Nov-12/2026', q3: 'Feb-12/2027', q4: 'May-12/2026' },

      // FMCG — mid-quarter
      'HUL':         { q1: 'Jul-28/2026', q2: 'Oct-28/2026', q3: 'Jan-28/2027', q4: 'Apr-28/2026' },
      'ITC':         { q1: 'Aug-05/2026', q2: 'Nov-05/2026', q3: 'Feb-05/2027', q4: 'May-05/2026' },
      'NESTLEIND':    { q1: 'Aug-08/2026', q2: 'Nov-08/2026', q3: 'Feb-08/2027', q4: 'May-08/2026' },
      'BRITANNIA':    { q1: 'Aug-10/2026', q2: 'Nov-10/2026', q3: 'Feb-10/2027', q4: 'May-10/2026' },

      // Auto — usually last week of quarter
      'MARUTI':      { q1: 'Jul-30/2026', q2: 'Oct-30/2026', q3: 'Jan-30/2027', q4: 'Apr-30/2026' },
      'TATAMOTORS':  { q1: 'Aug-08/2026', q2: 'Nov-08/2026', q3: 'Feb-08/2027', q4: 'May-08/2026' },
      'M&M':         { q1: 'Aug-10/2026', q2: 'Nov-10/2026', q3: 'Feb-10/2027', q4: 'May-10/2026' },
      'BAJAJ-AUTO':  { q1: 'Jul-25/2026', q2: 'Oct-25/2026', q3: 'Jan-25/2027', q4: 'Apr-25/2026' },

      // Pharma
      'SUNPHARMA':   { q1: 'Aug-08/2026', q2: 'Nov-08/2026', q3: 'Feb-08/2027', q4: 'May-08/2026' },
      'DRREDDY':     { q1: 'Jul-28/2026', q2: 'Oct-28/2026', q3: 'Jan-28/2027', q4: 'Apr-28/2026' },
      'CIPLA':       { q1: 'Aug-05/2026', q2: 'Nov-05/2026', q3: 'Feb-05/2027', q4: 'May-05/2026' },

      // Energy
      'RELIANCE':    { q1: 'Aug-05/2026', q2: 'Nov-05/2026', q3: 'Feb-05/2027', q4: 'May-05/2026' },
      'ONGC':        { q1: 'Aug-12/2026', q2: 'Nov-12/2026', q3: 'Feb-12/2027', q4: 'May-12/2026' },

      // Finance
      'BAJFINANCE':  { q1: 'Jul-28/2026', q2: 'Oct-28/2026', q3: 'Jan-28/2027', q4: 'Apr-28/2026' },
      'HDFCLIFE':   { q1: 'Aug-08/2026', q2: 'Nov-08/2026', q3: 'Feb-08/2027', q4: 'May-08/2026' },

      // Others
      'TITAN':       { q1: 'Aug-08/2026', q2: 'Nov-08/2026', q3: 'Feb-08/2027', q4: 'May-08/2026' },
      'ADANIPORTS':  { q1: 'Aug-10/2026', q2: 'Nov-10/2026', q3: 'Feb-10/2027', q4: 'May-10/2026' },
      'NTPC':        { q1: 'Aug-12/2026', q2: 'Nov-12/2026', q3: 'Feb-12/2027', q4: 'May-12/2026' },
      'POWERGRID':   { q1: 'Aug-12/2026', q2: 'Nov-12/2026', q3: 'Feb-12/2027', q4: 'May-12/2026' },
      'COALINDIA':   { q1: 'Aug-10/2026', q2: 'Nov-10/2026', q3: 'Feb-10/2027', q4: 'May-10/2026' },
      'LT':          { q1: 'Jul-30/2026', q2: 'Oct-30/2026', q3: 'Jan-30/2027', q4: 'Apr-30/2026' },
      'ULTRACEMCO':  { q1: 'Aug-05/2026', q2: 'Nov-05/2026', q3: 'Feb-05/2027', q4: 'May-05/2026' },
      'SBIN':        { q1: 'Aug-05/2026', q2: 'Nov-05/2026', q3: 'Feb-05/2027', q4: 'May-05/2026' },
      'BHARTIARTL':  { q1: 'Jul-28/2026', q2: 'Oct-28/2026', q3: 'Jan-28/2027', q4: 'Apr-28/2026' },
      'ASIANPAINT':  { q1: 'Aug-05/2026', q2: 'Nov-05/2026', q3: 'Feb-05/2027', q4: 'May-05/2026' },
    };
  }

  /**
   * Get current quarter key (Q1, Q2, Q3, Q4)
   */
  getCurrentQuarter() {
    const month = new Date().getMonth() + 1;
    if (month >= 4 && month <= 6) return 'q1';
    if (month >= 7 && month <= 9) return 'q2';
    if (month >= 10 && month <= 12) return 'q3';
    return 'q4';
  }

  /**
   * Get current financial year (Apr-March)
   */
  getCurrentFY() {
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();
    return month >= 4 ? year : year - 1;
  }

  /**
   * Check if a stock is in earnings window
   * @param {string} symbol - Stock symbol
   * @param {number} daysWindow - Days before/after to consider (default: 7)
   */
  isInEarningsWindow(symbol, daysWindow = 7) {
    const earnings = this.calendar[symbol];
    if (!earnings) return { inWindow: false, daysUntil: null, quarter: null };

    const currentQ = this.getCurrentQuarter();
    const dateStr = earnings[currentQ];
    if (!dateStr) return { inWindow: false, daysUntil: null, quarter: currentQ.toUpperCase() };

    try {
      const earningsDate = this.parseDate(dateStr);
      const today = new Date();
      const daysUntil = Math.round((earningsDate - today) / (1000 * 60 * 60 * 24));
      const inWindow = daysUntil >= -daysWindow && daysUntil <= daysWindow;

      return {
        inWindow,
        daysUntil,
        quarter: currentQ.toUpperCase(),
        earningsDate: dateStr.toISOString().split('T')[0],
        symbol,
      };
    } catch (e) {
      return { inWindow: false, daysUntil: null, quarter: currentQ.toUpperCase() };
    }
  }

  /**
   * Get earnings status for all tracked stocks
   */
  getAllEarningsStatus() {
    const results = [];
    for (const symbol of Object.keys(this.calendar)) {
      const status = this.isInEarningsWindow(symbol);
      if (status.inWindow || Math.abs(status.daysUntil || 999) <= 30) {
        results.push(status);
      }
    }
    return results.sort((a, b) => (a.daysUntil || 999) - (b.daysUntil || 999));
  }

  /**
   * Filter out stocks near earnings from signal candidates
   */
  filterEarningsStocks(stocks) {
    return stocks.filter(s => {
      const earnings = this.isInEarningsWindow(s.symbol, 5);
      if (earnings.inWindow) {
        this.logger?.info(`⚠️ ${s.symbol} filtered: earnings in ${Math.abs(earnings.daysUntil)} days`);
        return false;
      }
      return true;
    });
  }

  /**
   * Get trading mode recommendation
   * @param {string} symbol - Stock symbol
   * @returns {string} 'SAFE' | 'CAUTION' | 'AVOID'
   */
  getTradingMode(symbol) {
    const earnings = this.isInEarningsWindow(symbol, 5);
    if (!earnings.inWindow) return 'SAFE';
    if (Math.abs(earnings.daysUntil || 0) <= 3) return 'AVOID';
    return 'CAUTION';
  }

  /**
   * Get next earnings for a symbol
   */
  getNextEarnings(symbol) {
    const earnings = this.calendar[symbol];
    if (!earnings) return null;
    const currentQ = this.getCurrentQuarter();
    return { quarter: currentQ.toUpperCase(), date: earnings[currentQ] };
  }

  parseDate(dateStr) {
    // Parse format: "Jul-15/2026"
    const [monthStr, dayYear] = dateStr.split('-');
    const [day, year] = dayYear.split('/');
    const monthMap = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
    return new Date(2000 + parseInt(year), monthMap[monthStr.toLowerCase()] || 0, parseInt(day));
  }
}

module.exports = EarningsCalendar;
