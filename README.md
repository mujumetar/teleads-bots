# TeleAds - Telegram Ad Network Platform

A full-stack premium platform to monetize Telegram groups through an automated ad network.

## 🚀 Features

- **Advertisers:** Create campaigns, set budgets, target specific groups, and track performance.
- **Publishers:** Register Telegram groups via the bot, view earnings, and manage multiple groups.
- **Admin Panel:** Approve groups and campaigns, monitor platform stats, and manage users.
- **Superadmin:** Full control over user roles and system-wide wallet/revenue management.
- **Telegram Bot Integration:** Automated ad posting, group registration, and real-time status updates.
- **Premium Design:** Modern dark-themed dashboard with glassmorphism and responsive UI.

## 🛠️ Tech Stack

- **Frontend:** React (Vite), React Router, Axios, Lucide Icons, Vanilla CSS (Premium).
- **Backend:** Node.js (Express), MongoDB (Mongoose), JWT, Bcrypt, Telegraf (Telegram Bot).

## 📦 Setup & Installation

### 1. Prerequisites
- Node.js installed.
- MongoDB running locally or on Atlas.
- A Telegram Bot Token from [@BotFather](https://t.me/botfather).

### 2. Backend Setup
1. Navigate to the `backend` folder.
2. Edit `.env` and add your `MONGODB_URI` and `BOT_TOKEN`.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Seed admin accounts:
   ```bash
   node scripts/seed.js
   ```

### 3. Frontend Setup
1. Navigate to the `frontend` folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## 🔐 Credentials (from Seed)

- **Superadmin:** `superadmin@teleads.com` / `superadmin123`
- **Admin:** `admin@teleads.com` / `admin123`

## 🤖 Bot Commands
- `/start` - Get started with TeleAds.
- `/register` - Register a group (run this in a group).
- `/status` - Check group approval and stats.
- `/earnings` - View revenue earned by the group.
"# teleads-bots" 
