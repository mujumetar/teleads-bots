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

// Import bot
const { initBot, processAdQueue } = require('./bot/telegramBot');

const app = express();

// Middleware
app.use(cors({ origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://127.0.0.1:5173'], credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/categories', categoryRoutes);

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

      // Run ad queue processor every 30 minutes
      setInterval(processAdQueue, 30 * 60 * 1000);
      console.log('⏰ Ad scheduler started (runs every 30 min)');
    })
    .catch(err => {
      console.error('❌ MongoDB connection error:', err.message);
      process.exit(1);
    });
} else {
  // If on Vercel, just connect to DB immediately
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(() => console.log('✅ MongoDB connected (Serverless)'))
    .catch(err => console.error('❌ MongoDB connection error:', err.message));
}

module.exports = app;
