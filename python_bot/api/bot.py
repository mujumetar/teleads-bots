import os
import json
import requests
from http.server import BaseHTTPRequestHandler
from telegram import Update, Bot
from telegram.ext import Application, CommandHandler, ContextTypes

# Configuration
BOT_TOKEN = os.getenv("BOT_TOKEN")
BACKEND_URL = os.getenv("BACKEND_URL") # e.g. http://your-node-backend.com/api
ADMIN_SECRET = os.getenv("ADMIN_SECRET") # Shared secret between Python and Node

# Initialize Bot
bot = Bot(token=BOT_TOKEN)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """/start - Welcome message"""
    await update.message.reply_text(
        "🚀 *TeleAds Python Bot (Vercel Mode)*\n\n"
        "I am connected to your main Ad Dashboard.\n"
        "Use /register to add this group to the ads network.",
        parse_mode="Markdown"
    )

async def register(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """/register - Register group with the Node.js backend"""
    chat = update.effective_chat
    if chat.type == "private":
        await update.message.reply_text("⚠️ Run this command in a group or channel.")
        return

    # Call your Node.js backend API (Requires an admin role or secret)
    group_data = {
        "name": chat.title,
        "telegramGroupId": str(chat.id),
        "telegramGroupUsername": f"@{chat.username}" if chat.username else "",
        "memberCount": await chat.get_member_count()
    }
    
    try:
        # Note: You'll need to create an endpoint in Node.js that accepts this secret
        response = requests.post(
            f"{BACKEND_URL}/groups/bot-register", 
            json=group_data,
            headers={"x-admin-secret": ADMIN_SECRET}
        )
        
        if response.status_code == 201:
            await update.message.reply_text("✅ Group Registered! Complete setup on the dashboard.")
        else:
            await update.message.reply_text(f"❌ Error: {response.json().get('message', 'Failed to register')}")
    except Exception as e:
        await update.message.reply_text(f"❌ Connection error: {str(e)}")

async def status(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """/status - Check group approval and health"""
    chat_id = str(update.effective_chat.id)
    try:
        response = requests.get(
            f"{BACKEND_URL}/groups/bot-status/{chat_id}",
            headers={"x-admin-secret": ADMIN_SECRET}
        )
        data = response.json()
        await update.message.reply_text(
            f"📈 *Group Performance*\n\n"
            f"Status: *{data.get('status', 'Unknown').upper()}*\n"
            f"Total Revenue: *₹{data.get('revenue', 0):.2f}*\n\n"
            "_Make sure our bot has administrative permissions to post ads._",
            parse_mode="Markdown"
        )
    except:
        await update.message.reply_text("❌ Unable to sync with dashboard.")

async def earnings(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """/earnings - Alias for status revenue"""
    await status(update, context)

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """/help - Detailed instructions"""
    await update.message.reply_text(
        "📖 *TeleAds Help Center*\n\n"
        "• /register - Register group with network\n"
        "• /status - Check approval and earnings\n"
        "• /earnings - Quick view of revenue\n"
        "• /start - Welcome & info\n\n"
        f"Manage your account at: {BACKEND_URL.replace('/api', '')}",
        parse_mode="Markdown"
    )

# Vercel Handler
class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        self.send_response(200)
        self.end_headers()
        
        # Get the update from Telegram
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        update_json = json.loads(post_data.decode('utf-8'))
        
        # Initialize Application (Vercel specific minimal setup)
        application = Application.builder().token(BOT_TOKEN).build()
        application.add_handler(CommandHandler("start", start))
        application.add_handler(CommandHandler("register", register))
        application.add_handler(CommandHandler("status", status))
        application.add_handler(CommandHandler("earnings", earnings))
        application.add_handler(CommandHandler("help", help_command))
        
        # Manually process the update
        update = Update.de_json(update_json, bot)
        
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(application.initialize())
        loop.run_until_complete(application.process_update(update))
        
        return
