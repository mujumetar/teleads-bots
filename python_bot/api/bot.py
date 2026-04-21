"""
TeleAds Bot — Production Polling Mode
Optimized for Render, Hugging Face, and Local.
"""
import os
import asyncio
import logging
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI
from telegram import (
    Update, InlineKeyboardButton, InlineKeyboardMarkup, constants
)
from telegram.ext import (
    Application, ApplicationBuilder, CommandHandler,
    CallbackQueryHandler, ContextTypes
)

load_dotenv()

logging.basicConfig(
    format="%(asctime)s | %(levelname)s | %(message)s",
    level=logging.INFO
)
log = logging.getLogger(__name__)

# Config
BOT_TOKEN    = os.getenv("BOT_TOKEN", "")
BACKEND_URL  = os.getenv("BACKEND_URL", "http://localhost:5000/api")
FRONT_URL    = os.getenv("FRONT_URL",   "https://teleads.vercel.app")
ADMIN_SECRET = os.getenv("ADMIN_SECRET", "")

app = FastAPI()

# Global PTB instance
ptb_app = None

@app.get("/")
async def health():
    return {"status": "running", "bot": "TeleAds Pro", "mode": "production-polling"}

# ──────────────────────────────────────────────
#  Bot Handlers
# ──────────────────────────────────────────────
async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    keyboard = [[InlineKeyboardButton("🌐 Dashboard", url=FRONT_URL),
                 InlineKeyboardButton("📡 Register", callback_data="menu_register")]]
    await update.message.reply_html(
        f"🛰 <b>TeleAds Pro</b>\nHello {user.first_name}! I am active and ready.",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

async def btn_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    await q.answer()
    if q.data == "menu_register":
        await update.effective_message.reply_html("📡 Send /register inside your group to start.")

# ──────────────────────────────────────────────
#  Lifecycle Events (Startup/Shutdown)
# ──────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    global ptb_app
    if not BOT_TOKEN:
        log.error("❌ BOT_TOKEN missing from Environment Variables!")
        return

    log.info("🚀 Initializing Telegram Bot...")
    ptb_app = (
        ApplicationBuilder()
        .token(BOT_TOKEN)
        .read_timeout(30)
        .connect_timeout(30)
        .build()
    )
    
    ptb_app.add_handler(CommandHandler("start", cmd_start))
    ptb_app.add_handler(CallbackQueryHandler(btn_handler))
    
    await ptb_app.initialize()
    await ptb_app.start()
    
    # Start polling in the background without blocking FastAPI
    await ptb_app.updater.start_polling(poll_interval=0.5, drop_pending_updates=True)
    log.info("✅ Bot is now Polling 24/7.")

@app.on_event("shutdown")
async def shutdown_event():
    global ptb_app
    if ptb_app:
        log.info("🛑 Shutting down bot...")
        await ptb_app.updater.stop()
        await ptb_app.stop()
        await ptb_app.shutdown()

# This part is for running locally or via Render's simple 'python' command
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)
