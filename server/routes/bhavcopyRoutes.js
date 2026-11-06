import express from 'express';
import {
  getBhavcopy,
  getSummary,
  getStockBySymbol,
  refreshBhavcopy,
} from '../controllers/bhavcopyController.js';

const router = express.Router();

/**
 * Route: GET /api/market/bhavcopy/summary
 * Market overview statistics (advancers, decliners, top 10 gainers/losers, volume, value)
 */
router.get('/summary', getSummary);

/**
 * Route: POST /api/market/bhavcopy/refresh
 * Explicit refresh trigger
 */
router.post('/refresh', refreshBhavcopy);

/**
 * Route: GET /api/market/bhavcopy
 * Query parameters: date, series, search, page, limit, sort, order
 */
router.get('/', getBhavcopy);

/**
 * Route: GET /api/market/bhavcopy/:symbol
 * Specific stock details by symbol
 */
router.get('/:symbol', getStockBySymbol);

export default router;

