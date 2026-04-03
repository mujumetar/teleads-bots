require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Import routes
const authRoutes = require('./routes/auth');
const campaignRoutes = require('./routes/campaigns');
const groupRoutes = require('./routes/groups');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payments');
const trackingRoutes = require('./routes/tracking');
const categoryRoutes = require('./routes/categories');
const cronRoutes = require('./routes/cron');
const aiRoutes = require('./routes/ai');
const systemConfigRoutes = require('./routes/systemConfig');
const walletRoutes = require('./routes/wallet');
const analyticsRoutes = require('./routes/analytics');
const antiFraudRoutes = require('./routes/antiFraud');
const manualAdsRoutes = require('./routes/manualAds');
const transactionsRoutes = require('./routes/transactions');

// Import bot
const { initBot, processAdQueue } = require('./bot/telegramBot');

const app = express();

// Root endpoint for health check
app.get('/', (req, res) => res.json({ message: 'TeleAds API is live!', status: 'healthy', version: '1.0.0' }));

// Allowed origins list (used by both preflight handler and cors middleware)
const ALLOWED_ORIGINS = [
  'https://teleads-bots.vercel.app',
  'https://teleads-bots-api.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

// Manual preflight handler (IMPORTANT: Must be at the very top, before all routes)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const isAllowed = !origin || ALLOWED_ORIGINS.includes(origin) || /\.vercel\.app$/.test(origin) || /^https?:\/\/localhost:\d+$/.test(origin) || /^https?:\/\/127\.0\.0\.1:\d+$/.test(origin);
  if (isAllowed && origin) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.header('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-admin-secret, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Middleware
// CORS Configuration
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const isAllowed = ALLOWED_ORIGINS.includes(origin) || /\.vercel\.app$/.test(origin) || /^https?:\/\/localhost:\d+$/.test(origin) || /^https?:\/\/127\.0\.0\.1:\d+$/.test(origin);
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('CORS blocked for origin:', origin);
      callback(new Error('CORS blocked for this origin'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-secret', 'X-CSRF-Token', 'X-Requested-With', 'Accept', 'Accept-Version', 'Content-Length', 'Content-MD5', 'Date', 'X-Api-Version']
}));
app.use(express.json());

// Database: single connect in serverless + local (cached by mongoose driver)
let dbConnectPromise = null;

function connectMongo() {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve();
  }
  if (!process.env.MONGODB_URI) {
    return Promise.reject(new Error('MONGODB_URI is not set'));
  }
  if (!dbConnectPromise) {
    dbConnectPromise = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000,
    });
  }
  return dbConnectPromise;
}

app.use(async (req, res, next) => {
  try {
    await connectMongo();
    next();
  } catch (err) {
    console.error('MongoDB:', err.message);
    res.status(500).json({
      message: 'Database connection failed',
      error: err.message,
      tip: 'Set MONGODB_URI in Vercel env (Atlas: allow 0.0.0.0/0 or Vercel IPs)',
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cron', cronRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/system', systemConfigRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/anti-fraud', antiFraudRoutes);
app.use('/api/admin/manual-ads', manualAdsRoutes);
app.use('/api/transactions', transactionsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Define Port
const PORT = process.env.PORT || 5000;

// Only start server and background tasks if not running as a serverless function (Vercel)
if (!process.env.VERCEL) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('✅ MongoDB connected');

      app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
      });

      // Initialize Telegram bot (poller mode) - skip if using Vercel/Webhooks
      initBot().then(bot => {
        if (bot && !process.env.DISABLE_POLLER) {
          bot.launch()
            .then(() => console.log('🤖 Telegram bot started (Poller Mode)'))
            .catch(err => console.error('Bot launch error:', err.message));

          // Graceful stop
          process.once('SIGINT', () => bot.stop('SIGINT'));
          process.once('SIGTERM', () => bot.stop('SIGTERM'));
        }
      });

      // Run ad queue processor every minute (it checks its own internal interval)
      setInterval(processAdQueue, 60 * 1000);
      console.log('⏰ Ad scheduler check active (every 1 min)');
    })
    .catch(err => {
      console.error('❌ MongoDB connection error:', err.message);
      process.exit(1);
    });
}

module.exports = app;
