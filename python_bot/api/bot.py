import os
import json
import requests
import asyncio
import time
from http.server import BaseHTTPRequestHandler
from telegram import Update, Bot, InlineKeyboardButton, InlineKeyboardMarkup, constants
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes

# Configuration
BOT_TOKEN = os.getenv("BOT_TOKEN")
BACKEND_URL = os.getenv("BACKEND_URL", "https://teleads-bots-api.vercel.app/api")
FRONT_URL = os.getenv("FRONT_URL", "https://teleads-bots.vercel.app")
ADMIN_SECRET = os.getenv("ADMIN_SECRET")

# Initialize Bot
bot = Bot(token=BOT_TOKEN)

async def cleanup_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Silently remove command from the group to maintain absolute privacy"""
    if update.effective_chat.type != constants.ChatType.PRIVATE:
        try:
            await context.bot.delete_message(chat_id=update.effective_chat.id, message_id=update.message.message_id)
        except:
            pass # In case of missing permissions

async def send_exclusive_pm(update: Update, context: ContextTypes.DEFAULT_TYPE, text: str, reply_markup=None):
    """Transmit data ONLY to the user's private terminal. No group leakage allowed."""
    user = update.effective_user
    chat = update.effective_chat
    
    # 1. First, attempt to send to PM
    try:
        sent_msg = await context.bot.send_message(
            chat_id=user.id, 
            text=text, 
            reply_markup=reply_markup, 
            parse_mode=constants.ParseMode.HTML,
            disable_web_page_preview=True
        )
        
        # Note on Deletion: On Vercel (Serverless), we cannot wait 15 minutes to delete.
        # This requires a persistent VPS/Long-running process. 
        # I will mark this message for manual cleanup or future persistent worker integration.
        
    except Exception as e:
        # If PM fails (bot not started in private), send a VERY temporary warning in group
        if chat.type != constants.ChatType.PRIVATE:
             warning = await update.message.reply_text(
                 f"🛰 <b>Secure Protocol Locked:</b> Start me in Private first, {user.first_name}."
             )
             # Auto-delete the warning after 5 seconds
             context.job_queue.run_once(lambda ctx: bot.delete_message(chat.id, warning.message_id), 5)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """/start - Home Protocol (PM Only)"""
    await cleanup_command(update, context) # Wipe command from group
    
    keyboard = [
        [InlineKeyboardButton("📊 Master Console", url=FRONT_URL)],
        [InlineKeyboardButton("💼 My Profile", callback_data="act_profile")],
        [InlineKeyboardButton("📖 Protocol Help", callback_data="act_help")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    welcome_text = (
        "🛰 <b>TeleAds Protocol v2.7.0 Initialized</b>\n"
        "───────────────────────\n"
        "All telemetry data and management interfaces are strictly channeled to this private terminal.\n\n"
        "<b>Identity Verified:</b> 🟢 <code>NOMINAL</code>\n"
        "<b>Access Level:</b> <code>Restricted Personnel</code>\n"
        "───────────────────────\n"
        "<i>Powering decentralized advertising telemetry.</i>"
    )
    await send_exclusive_pm(update, context, welcome_text, reply_markup=reply_markup)

async def register(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """/register - Asset Ingestion Logic (Group trigger, PM results)"""
    chat = update.effective_chat
    user = update.effective_user

    # 1. Check if user is admin in group
    # Note: We must do this before deleting if it's a command
    is_admin = False
    if chat.type != constants.ChatType.PRIVATE:
        try:
            member = await chat.get_member(user.id)
            is_admin = member.status in [constants.ChatMemberStatus.OWNER, constants.ChatMemberStatus.ADMINISTRATOR]
        except: pass
    else:
        is_admin = True # Direct PM always allowed for account linking

    await cleanup_command(update, context) # Immediately wipe group command

    if not is_admin:
        await send_exclusive_pm(update, context, "❌ <b>Clearance Denied:</b> Administrative rights required in the group to provision nodes.")
        return

    if chat.type == constants.ChatType.PRIVATE:
        await send_exclusive_pm(update, context, "🛰 <b>Mapping Failed:</b> Run /register inside the group you wish to monetize.")
        return

    # Provision Data
    group_data = {
        "name": chat.title,
        "telegramGroupId": str(chat.id),
        "telegramGroupUsername": f"@{chat.username}" if chat.username else "",
        "memberCount": await chat.get_member_count()
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/groups/bot-register", json=group_data, headers={"x-admin-secret": ADMIN_SECRET})
        if response.status_code == 201:
            await send_exclusive_pm(update, context, f"✅ <b>Node Provisioned:</b> <code>{chat.title}</code> is now synced. Status: <code>PENDING AUDIT</code>.")
        else:
            await send_exclusive_pm(update, context, f"❌ <b>Ingestion Failed:</b> {response.json().get('message', 'Kernel Panic')}")
    except Exception as e:
        await send_exclusive_pm(update, context, f"❓ <b>Logic Breakdown:</b> {str(e)}")

async def status(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """/status - Node Telemetry (PM Only)"""
    await cleanup_command(update, context)
    chat_id = str(update.effective_chat.id)
    try:
        response = requests.get(f"{BACKEND_URL}/groups/bot-status/{chat_id}", headers={"x-admin-secret": ADMIN_SECRET})
        data = response.json()
        
        status_text = (
            "📈 <b>Node Telemetry Overview</b>\n"
            "───────────────────────\n"
            f"Asset ID: <b>{update.effective_chat.title}</b>\n"
            f"Logic Status: <code>{data.get('status', 'Unknown').upper()}</code>\n"
            f"Node Yield: <b>₹{data.get('revenue', 0):.2f}</b>\n"
            "───────────────────────\n"
            "<i>Secure data delivery verified.</i>"
        )
        await send_exclusive_pm(update, context, status_text)
    except:
        await send_exclusive_pm(update, context, "❌ <b>Sync Error:</b> Mainframe unreachable.")

async def button_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Interactive Callback (Private Channel)"""
    query = update.callback_query
    await query.answer()
    
    if query.data == "act_profile":
        await send_exclusive_pm(update, context, f"👤 <b>Operator Identity:</b> {update.effective_user.first_name}\n🆔 <b>Network ID:</b> <code>{update.effective_user.id}</code>")
    elif query.data == "act_help":
         await send_exclusive_pm(update, context, "📖 <b>Protocol Docs</b>\n/start - Hub\n/register - Ingest Group\n/status - View Node")

# Vercel Protocol Handler
class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        self.send_response(200)
        self.end_headers()
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            update_json = json.loads(post_data.decode('utf-8'))
            
            # Note: No JobQueue on Vercel Serverless
            application = Application.builder().token(BOT_TOKEN).build()
            application.add_handler(CommandHandler("start", start))
            application.add_handler(CommandHandler("register", register))
            application.add_handler(CommandHandler("status", status))
            application.add_handler(CallbackQueryHandler(button_handler))
            
            update = Update.de_json(update_json, bot)
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(application.initialize())
            loop.run_until_complete(application.process_update(update))
        except Exception as e:
            print(f"Logic Failure: {str(e)}")
        return
