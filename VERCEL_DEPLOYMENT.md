# 🚀 Vercel Deployment Guide: TeleAds Platform

This guide provides step-by-step instructions for deploying the **TeleAds** platform to Vercel, including the Node.js backend, React frontend, and the Python-based Telegram bot.

---

## 1. Prerequisites
- **GitHub Repository**: Push your code to a GitHub repo.
- **Vercel Account**: Sign up at [vercel.com](https://vercel.com).
- **MongoDB Atlas**: Get a connection string (`MONGODB_URI`).
- **Telegram Bot Token**: Create one via [@BotFather](https://t.me/BotFather).
- **Razorpay API Keys**: For processing payments (optional).

---

## 2. Deploying the Backend (Node.js/Express)
The backend is located in the `backend/` directory.

1.  Go to Vercel Dashboard > **New Project** > Import Repository.
2.  **Root Directory**: Set to `backend`.
3.  **Framework Preset**: Other (Vercel will auto-detect Node.js).
4.  **Install Command**: `npm install`
5.  **Build Command**: (Empty or `npm run build`)
6.  **Environment Variables**:
    -   `MONGODB_URI`: Your MongoDB Atlas URL.
    -   `JWT_SECRET`: A secure random string.
    -   `RAZORPAY_KEY_ID`: Your Razorpay Key.
    -   `RAZORPAY_KEY_SECRET`: Your Razorpay Secret.
    -   `ADMIN_SECRET`: A shared secret (e.g., `AdsBot_Admin_2026`).
    -   `VERCEL`: `true` (This skips the poller bot and interval tasks).
7.  Click **Deploy**.
8.  **Note your Backend URL** (e.g., `https://teleads-api.vercel.app`).

---

## 3. Deploying the Python Bot (Vercel Functions)
The bot is located in the `python_bot/` directory.

1.  Go to Vercel Dashboard > **New Project** > Import SAME Repository.
2.  **Root Directory**: Set to `python_bot`.
3.  **Framework Preset**: Other.
4.  **Environment Variables**:
    -   `BOT_TOKEN`: Your Telegram Bot Token.
    -   `BACKEND_URL`: Your deployed Backend URL + `/api` (e.g., `https://teleads-api.vercel.app/api`).
    -   `ADMIN_SECRET`: MUST match the one in the Backend.
5.  Click **Deploy**.
6.  **Note your Bot URL** (e.g., `https://teleads-bot.vercel.app`).

### 🔗 Connecting the Bot (Webhook Setup)
Telegram needs to know where to send messages. Run this in your browser:
`https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://<YOUR_BOT_URL>/api/bot`

---

## 4. Deploying the Frontend (React/Vite)
The frontend is located in the `frontend/` directory.

1.  Go to Vercel Dashboard > **New Project** > Import Repository again.
2.  **Root Directory**: Set to `frontend`.
3.  **Framework Preset**: Vite.
4.  **Environment Variables**:
    -   `VITE_API_URL`: Your deployed Backend URL + `/api` (e.g., `https://teleads-api.vercel.app/api`).
5.  Click **Deploy**.

---

## 🛠️ Performance & Maintenance
- **Ad Scheduler (Cron)**: Since Vercel is serverless, the `setInterval` in `server.js` will not work. 
- To run ads automatically on Vercel, you must set up a **Vercel Cron Job** or an external service (like GitHub Actions or Cron-job.org) to ping the following endpoint every 30 minutes:
  `GET https://teleads-api.vercel.app/api/ad-scheduler` (You may need to create this endpoint).

### Creating the Scheduler Endpoint (Required for Vercel)
Add this to your `backend/routes/admin.js` to allow remote triggering:
```javascript
router.get('/trigger-ads', async (req, res) => {
  const { processAdQueue } = require('../bot/telegramBot');
  await processAdQueue();
  res.json({ success: true, message: 'Ad queue processed' });
});
```

---

## 📖 Local Server Mode
If you want to run the entire system on a traditional VPS (non-serverless):
1.  Set `VERCEL=false` (default) in your `.env`.
2.  The backend will start the **Poller Bot** (starts receiving messages directly).
3.  The ad scheduler will run using `setInterval`.
4.  This is recommended for high-traffic environments where webhooks might be overkill.
