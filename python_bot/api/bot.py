"""
TeleAds Bot — Optimized Polling Mode (Hugging Face)
Includes snappy polling and keeps the server alive on port 7860.
"""
import os
import asyncio
import logging
import httpx
import uvicorn
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

@app.get("/")
async def health():
    return {"status": "running", "mode": "optimized-polling"}

# Handlers (Summarized for speed)
async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    keyboard = [[InlineKeyboardButton("🌐 Dashboard", url=FRONT_URL),
                 InlineKeyboardButton("📡 Register", callback_data="menu_register")]]
    await update.message.reply_html(f"🛰 <b>TeleAds Pro</b>\nHello {user.first_name}! How can I help?", reply_markup=InlineKeyboardMarkup(keyboard))

async def btn_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    await q.answer()
    if q.data == "menu_register":
        await update.effective_message.reply_html("📡 Send /register inside your group to start.")

# Add more handlers as needed...

async def run_bot():
    if not BOT_TOKEN:
        log.error("❌ BOT_TOKEN missing!")
        return

    # Using higher performance settings for polling
    ptb = (
        ApplicationBuilder()
        .token(BOT_TOKEN)
        .read_timeout(30)
        .write_timeout(30)
        .connect_timeout(30)
        .build()
    )
    
    ptb.add_handler(CommandHandler("start", cmd_start))
    # ... add other handlers here ...
    ptb.add_handler(CallbackQueryHandler(btn_handler))

    log.info("🚀 Starting Optimized Poller...")
    await ptb.initialize()
    await ptb.start()
    
    # Fast polling interval (0.5s) instead of the default 3-5s
    await ptb.updater.start_polling(poll_interval=0.5, drop_pending_updates=True)
    await asyncio.Event().wait()

async def main():
    asyncio.create_task(run_bot())
    config = uvicorn.Config(app, host="0.0.0.0", port=7860, log_level="error")
    server = uvicorn.Server(config)
    await server.serve()

if __name__ == "__main__":
    asyncio.run(main())
