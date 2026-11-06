import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import bhavcopyRoutes from './routes/bhavcopyRoutes.js';
import marketDepthRoutes from './routes/marketDepthRoutes.js';
import { getLatestBhavcopy } from './services/nseBhavcopyService.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all origins in development
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Mount Bhavcopy routes
app.use('/api/market/bhavcopy', bhavcopyRoutes);

// Mount XTS Market Depth routes
app.use('/api/market/depth', marketDepthRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Finspark NSE Market Data Server',
  });
});

// Fallback 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.url}`,
  });
});

// Error handling middleware
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('[Server Unhandled Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// Start listener if executed directly
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Finspark NSE Bhavcopy Backend listening on port ${PORT}`);
    console.log(`📊 Base Bhavcopy API: http://localhost:${PORT}/api/market/bhavcopy`);
    console.log(`📈 Summary Endpoint:  http://localhost:${PORT}/api/market/bhavcopy/summary`);
    console.log(`🩺 Health Check:      http://localhost:${PORT}/api/health`);
    console.log(`=======================================================`);

    // Asynchronously pre-warm latest Bhavcopy data in background
    getLatestBhavcopy()
      .then((data) => {
        console.log(`[NSE Warmup]: Ready! Latest Bhavcopy loaded for ${data.tradingDate} (${data.totalParsed} stocks)`);
      })
      .catch((err) => {
        console.warn(`[NSE Warmup Notice]: ${err.message}`);
      });
  });
}

export default app;
