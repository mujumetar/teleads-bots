# 🚀 Vercel Deployment Guide: TeleAds Platform (Optimized v3)

This updated guide reflects the efficiency improvements made to the **TeleAds** platform for seamless Vercel (Serverless) execution.

---

## 1. Prerequisites
- **GitHub Repository**: Push your code to a GitHub repo.
- **Vercel Account**: Sign up at [vercel.com](https://vercel.com).
- **MongoDB Atlas**: Get a connection string (`MONGODB_URI`).
- **Telegram Bot Token**: Create one via [@BotFather](https://t.me/BotFather).

---

## 2. Deploying the Backend (Node.js/Express)
The backend is located in the `backend/` directory.

1.  Import your repository into Vercel and set **Root Directory** to `backend`.
2.  **Environment Variables**:
    -   `MONGODB_URI`: Your MongoDB Atlas URL.
    -   `JWT_SECRET`: A secure random string.
    -   `ADMIN_SECRET`: A shared secret (e.g., `AdsBot_Admin_2026`).
    -   `CRON_SECRET`: (Optional) Secure Bearer token for Cron triggering.
    -   `VERCEL`: `true` (Disables polling and manual intervals).
3.  **Automatic Ad Scheduler (Cron)**: 
    -   The system now uses **Vercel Cron Jobs** (configured in `vercel.json`).
    -   It automatically pings `/api/cron/process-ads` every 15 minutes.
    -   Check your Vercel Dashboard > **Settings** > **Cron Jobs** to verify.

---

## 3. Deploying the Optimized Python Bot
The bot is located in the `python_bot/` directory and now uses **FastAPI** for maximum performance.

1.  Import your repository into Vercel and set **Root Directory** to `python_bot`.
2.  **Environment Variables**:
    -   `BOT_TOKEN`: Your Telegram Bot Token.
    -   `BACKEND_URL`: Your deployed Backend URL + `/api` (e.g., `https://teleads-api.vercel.app/api`).
    -   `ADMIN_SECRET`: MUST match the one in the Backend.
    -   `VERCEL_URL`: (Optional) Your bot deployment URL (e.g., `https://teleads-bot.vercel.app`).
3.  **Webhook Setup (New!)**:
    -   Once deployed, visit `https://your-bot-url.vercel.app/setup` to automatically register the webhook with Telegram.
    -   No manual browser manipulation of `api.telegram.org` URLs needed anymore.

---

## 4. Bot Efficiency Improvements
- **FastAPI Migration**: Moved from `BaseHTTPRequestHandler` to FastAPI. This reduces execution time and improves reliability on serverless functions.
- **Async HTTPX**: Replaced `requests` with `httpx`, allowing non-blocking calls to the backend.
- **Global Initialization**: The bot and application objects are initialized once at the module level, leveraging Vercel's container reuse for faster cold starts.
- **Node.js Integration**: Ad posting logic is now handled by the Backend on a scheduled Cron, keeping the Bot responsive for user interactions.

---

## 💡 Bot Idea: The "TeleAds Mini-App" UX
To further improve efficiency and user retention, consider migrating the `/status` and `/earnings` commands to a **Telegram Mini App**:
1.  Instead of sending text reports, use `InlineKeyboardButton(text="Open Dashboard", web_app={"url": FRONT_URL})`.
2.  This offloads complex data visualization to the client side (Vercel-hosted React frontend).
3.  The bot remains a "thin gateway" for group registration and notifications, while the Mini App provides a premium, rich management experience directly inside Telegram.
