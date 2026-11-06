import express from 'express';
import dummyMarketDepthData from '../../src/data/dummy_market_data.js';

const router = express.Router();

/**
 * GET /api/market/depth
 * Returns all XTS Market Depth Touchline records (Book Type 1)
 */
router.get('/', (req, res) => {
  try {
    const { search, limit } = req.query;
    let data = [...dummyMarketDepthData];

    if (search) {
      const q = String(search).toLowerCase();
      data = data.filter(
        (item) =>
          item.tradingSymbol.toLowerCase().includes(q) ||
          item.displayName.toLowerCase().includes(q) ||
          String(item.exchangeInstrumentID).includes(q)
      );
    }

    if (limit) {
      const max = parseInt(limit, 10);
      if (!isNaN(max) && max > 0) {
        data = data.slice(0, max);
      }
    }

    res.json({
      success: true,
      count: data.length,
      standard: 'Symphony Fintech XTS Market Data API v2',
      bookType: 1,
      data,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/market/depth/:symbol
 * Returns single instrument market depth by tradingSymbol or exchangeInstrumentID
 */
router.get('/:symbol', (req, res) => {
  try {
    const { symbol } = req.params;
    const cleanSym = String(symbol).toUpperCase().trim();

    const record = dummyMarketDepthData.find(
      (item) =>
        item.tradingSymbol.toUpperCase() === cleanSym ||
        String(item.exchangeInstrumentID) === cleanSym
    );

    if (!record) {
      return res.status(404).json({
        success: false,
        error: `Instrument '${symbol}' not found in XTS market depth records.`,
      });
    }

    res.json({
      success: true,
      standard: 'Symphony Fintech XTS Market Data API v2',
      bookType: 1,
      data: record,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

