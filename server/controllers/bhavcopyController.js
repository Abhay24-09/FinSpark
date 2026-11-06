import {
  getBhavcopyByDate,
  getLatestBhavcopy,
  generateMarketSummary,
  parseDateInput,
} from '../services/nseBhavcopyService.js';

/**
 * Controller for GET /api/market/bhavcopy
 */
export async function getBhavcopy(req, res) {
  try {
    const {
      date,
      series = 'EQ',
      search = '',
      page = 1,
      limit = 50,
      sort = 'volume',
      order = 'desc',
    } = req.query;

    let bhavcopyData;
    if (date) {
      const yyyymmdd = parseDateInput(date);
      bhavcopyData = await getBhavcopyByDate(yyyymmdd);
    } else {
      bhavcopyData = await getLatestBhavcopy();
    }

    let stocks = bhavcopyData.stocks;

    // Filter by Series (default 'EQ' unless 'ALL' or specific series like 'BE', 'SM', 'GB')
    if (series && series.toUpperCase() !== 'ALL') {
      const targetSeries = series.toUpperCase();
      stocks = stocks.filter((s) => s.series === targetSeries);
    }

    // Filter by search query (symbol or security name)
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      stocks = stocks.filter(
        (s) =>
          s.symbol.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.isin.toLowerCase().includes(q)
      );
    }

    // Sort
    const sortField = sort.trim();
    const isAsc = order.toLowerCase() === 'asc';
    stocks = [...stocks].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string') {
        return isAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      valA = Number(valA) || 0;
      valB = Number(valB) || 0;
      return isAsc ? valA - valB : valB - valA;
    });

    const total = stocks.length;
    let paginatedData = stocks;
    let pageNum = 1;
    let limitNum = total;

    // Pagination
    if (limit !== 'all') {
      pageNum = Math.max(1, parseInt(page, 10) || 1);
      limitNum = Math.max(1, Math.min(500, parseInt(limit, 10) || 50));
      const startIndex = (pageNum - 1) * limitNum;
      paginatedData = stocks.slice(startIndex, startIndex + limitNum);
    }

    return res.json({
      success: true,
      tradingDate: bhavcopyData.tradingDate,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: limit === 'all' ? 1 : Math.ceil(total / limitNum),
      series: series.toUpperCase(),
      data: paginatedData,
      metadata: {
        source: 'NSE CM-UDiFF Common Bhavcopy Final',
        fileName: bhavcopyData.fileName,
        retrievedAt: bhavcopyData.retrievedAt,
        deliverableQuantityAvailable: false,
        deliverableQuantityNote:
          'NSE CM-UDiFF Common Bhavcopy Final contains traded volume & traded value. Deliverable quantities are published in separate MTO reports.',
      },
    });
  } catch (error) {
    console.error('[Bhavcopy Controller Error]:', error.message);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      error: error.message,
      tradingDate: error.date || null,
    });
  }
}

/**
 * Controller for GET /api/market/bhavcopy/summary
 */
export async function getSummary(req, res) {
  try {
    const { date } = req.query;

    let bhavcopyData;
    if (date) {
      const yyyymmdd = parseDateInput(date);
      bhavcopyData = await getBhavcopyByDate(yyyymmdd);
    } else {
      bhavcopyData = await getLatestBhavcopy();
    }

    const summary = generateMarketSummary(bhavcopyData.stocks, bhavcopyData.tradingDate);

    return res.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error('[Bhavcopy Summary Controller Error]:', error.message);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      error: error.message,
      tradingDate: error.date || null,
    });
  }
}

/**
 * Controller for GET /api/market/bhavcopy/:symbol
 */
export async function getStockBySymbol(req, res) {
  try {
    const { symbol } = req.params;
    const { date } = req.query;

    if (!symbol) {
      return res.status(400).json({ success: false, error: 'Stock symbol is required' });
    }

    let bhavcopyData;
    if (date) {
      const yyyymmdd = parseDateInput(date);
      bhavcopyData = await getBhavcopyByDate(yyyymmdd);
    } else {
      bhavcopyData = await getLatestBhavcopy();
    }

    const targetSymbol = symbol.trim().toUpperCase();
    const stock = bhavcopyData.stocks.find(
      (s) => s.symbol.toUpperCase() === targetSymbol
    );

    if (!stock) {
      return res.status(404).json({
        success: false,
        error: `Security with symbol '${targetSymbol}' not found in NSE Bhavcopy for ${bhavcopyData.tradingDate}`,
        tradingDate: bhavcopyData.tradingDate,
      });
    }

    return res.json({
      success: true,
      tradingDate: bhavcopyData.tradingDate,
      data: stock,
    });
  } catch (error) {
    console.error('[Bhavcopy Symbol Controller Error]:', error.message);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Controller for POST /api/market/bhavcopy/refresh
 */
export async function refreshBhavcopy(req, res) {
  try {
    console.log('[Bhavcopy Controller]: Refreshing latest Bhavcopy data...');
    const data = await getLatestBhavcopy(7);
    const summary = generateMarketSummary(data.stocks, data.tradingDate);

    return res.json({
      success: true,
      message: `Refreshed successfully for trading date: ${data.tradingDate}`,
      tradingDate: data.tradingDate,
      totalStocks: data.totalParsed,
      summary,
    });
  } catch (error) {
    console.error('[Bhavcopy Refresh Error]:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
