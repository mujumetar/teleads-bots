"""
TeleAds Bot — Standalone Polling Mode (Local Development)
Run: python api/bot.py
"""
import os
import requests
import asyncio
import logging
from dotenv import load_dotenv
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

BACKEND_URL  = os.getenv("BACKEND_URL", "http://localhost:5000/api")
FRONT_URL    = os.getenv("FRONT_URL",   "http://localhost:5173")
ADMIN_SECRET = os.getenv("ADMIN_SECRET", "")

# ──────────────────────────────────────────────
#  Fetch tokens from backend DB
# ──────────────────────────────────────────────
def fetch_bot_tokens():
    try:
        r = requests.get(
            f"{BACKEND_URL}/admin/bot-config",
            headers={"x-admin-secret": ADMIN_SECRET},
            timeout=10
        )
        r.raise_for_status()
        bots = r.json()
        if not bots:
            log.warning("⚠️  No active bots found in database.")
            log.warning("   → Go to Superadmin Dashboard > Bots > Add Bot")
        return bots
    except requests.exceptions.ConnectionError:
        log.error("❌ Cannot connect to backend at %s", BACKEND_URL)
        log.error("   → Make sure your backend is running: npm run dev")
        return []
    except requests.exceptions.HTTPError as e:
        log.error("❌ Backend rejected request: %s", e)
        log.error("   → Check ADMIN_SECRET in python_bot/.env matches backend/.env")
        return []
    except Exception as e:
        log.error("❌ Unexpected error fetching tokens: %s", e)
        return []


# ──────────────────────────────────────────────
#  Handlers
# ──────────────────────────────────────────────
async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    keyboard = [
        [
            InlineKeyboardButton("📡 Register Group", callback_data="menu_register"),
            InlineKeyboardButton("📊 My Groups",      callback_data="menu_mygroups"),
        ],
        [
            InlineKeyboardButton("💰 Earnings",  callback_data="menu_earnings"),
            InlineKeyboardButton("🔗 Refer & Earn", callback_data="menu_refer"),
        ],
        [
            InlineKeyboardButton("📈 Analytics", callback_data="menu_analytics"),
            InlineKeyboardButton("💸 Withdraw",  callback_data="menu_withdraw"),
        ],
        [
            InlineKeyboardButton("🔗 Link Account",  callback_data="menu_link"),
            InlineKeyboardButton("🌐 Dashboard", url=FRONT_URL)
        ],
    ]
    text = (
        f"🛰 <b>TeleAds Pro</b>\n"
        f"────────────────────────\n"
        f"👋 Hello, <b>{user.first_name}</b>!\n\n"
        f"<b>What would you like to do?</b>"
    )
    
    # Handle deep-linking referral
    if context.args:
        ref_code = context.args[0]
        try:
            requests.post(
                f"{BACKEND_URL}/groups/bot-referral",
                json={"telegramId": str(user.id), "referralCode": ref_code},
                headers={"x-admin-secret": ADMIN_SECRET},
                timeout=5
            )
        except: pass

    await update.message.reply_html(text, reply_markup=InlineKeyboardMarkup(keyboard))


async def cmd_register(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat = update.effective_chat
    user = update.effective_user

    if chat.type == constants.ChatType.PRIVATE:
        await update.message.reply_html(
            "⚠️ <b>Run /register inside the group you want to monetize.</b>"
        )
        return

    try:
        member = await chat.get_member(user.id)
        if member.status not in (
            constants.ChatMemberStatus.OWNER,
            constants.ChatMemberStatus.ADMINISTRATOR
        ):
            await context.bot.send_message(
                user.id,
                "🚫 <b>Access Denied.</b> Only group admins can register.",
                parse_mode=constants.ParseMode.HTML
            )
            return
    except Exception:
        pass

    # Fetch dynamic setting for min_group_members
    min_members = 100
    is_superadmin = False
    try:
        def get_data():
            r_settings = requests.get(f"{BACKEND_URL}/admin/bot-settings", headers={"x-admin-secret": ADMIN_SECRET}, timeout=5)
            r_user = requests.get(f"{BACKEND_URL}/groups/bot-user-stats/{user.id}", headers={"x-admin-secret": ADMIN_SECRET}, timeout=5)
            return r_settings.json(), r_user.json() if r_user.status_code == 200 else {}
        
        settings, user_data = await asyncio.to_thread(get_data)
        min_setting = next((s for s in settings if s.get('key') == 'min_group_members'), None)
        if min_setting: min_members = int(min_setting['value'])
        if user_data.get('role') == 'superadmin': is_superadmin = True
    except Exception as e:
        log.warning("Bypass check error: %s", e)

    member_count = await chat.get_member_count()
    if member_count < min_members and not is_superadmin:
        await update.message.reply_html(
            f"❌ Minimum <b>{min_members} members</b> required.\nYour group has <b>{member_count}</b>."
        )
        return

    try:
        payload = {
            "name": chat.title,
            "telegramGroupId": str(chat.id),
            "telegramGroupUsername": f"@{chat.username}" if chat.username else "",
            "memberCount": member_count,
            "telegramOwnerId": str(user.id)
        }
        resp = requests.post(
            f"{BACKEND_URL}/groups/bot-register",
            json=payload,
            headers={"x-admin-secret": ADMIN_SECRET},
            timeout=10
        )
        if resp.status_code == 409:
            await context.bot.send_message(
                user.id,
                "⚠️ <b>This group is already registered!</b>",
                parse_mode=constants.ParseMode.HTML
            )
            return
        
        resp.raise_for_status()
        await context.bot.send_message(
            user.id,
            f"✅ <b>Group Registered!</b>\n"
            f"🆔 <code>{chat.id}</code>\n"
            f"⏳ Pending Superadmin approval.\n\n"
            f"<i>Make sure to use /link email@example.com to see it in your dashboard!</i>",
            parse_mode=constants.ParseMode.HTML
        )
    except Exception as e:
        await update.message.reply_html(f"❌ Registration failed: <code>{e}</code>")


async def cmd_refer(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    try:
        r = requests.get(
            f"{BACKEND_URL}/groups/bot-user-stats/{user.id}",
            headers={"x-admin-secret": ADMIN_SECRET},
            timeout=5
        )
        data = r.json()
        ref_code = data.get("referralCode", "ERROR")
        bot_info = await context.bot.get_me()
        bot_username = bot_info.username
        
        ref_link = f"https://t.me/{bot_username}?start={ref_code}"
        
        text = (
            f"🔗 <b>Your Referral Program</b>\n"
            f"────────────────────────\n"
            f"Share your unique link and earn from everyone you invite:\n\n"
            f"💰 <b>10%</b> of Advertiser deposits\n"
            f"💸 <b>5%</b> of Publisher earnings\n\n"
            f"Your Referral Code: <code>{ref_code}</code>\n"
            f"Your Link: {ref_link}\n\n"
            f"<i>Earnings are credited instantly to your wallet!</i>"
        )
        await update.message.reply_html(text)
    except Exception as e:
        await update.message.reply_html(f"❌ Could not fetch referral info: {e}")


async def btn_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    await q.answer()
    data = q.data

    if data == "menu_refer":
        await cmd_refer(update, context)
        return

    replies = {
        "menu_register": "📡 <b>Register your group</b>\n\nAdd the bot to your group as an Admin, then send <code>/register</code> inside that group.",
        "menu_mygroups": "📊 <b>My Groups</b>\n\nOpen your dashboard to view your registered groups.",
        "menu_earnings": "💰 <b>Earnings</b>\n\nOpen your dashboard to view your earnings breakdown.",
        "menu_analytics": "📈 <b>Analytics</b>\n\nVisit the dashboard for detailed performance metrics.",
        "menu_withdraw": "💸 <b>Withdraw</b>\n\nMinimum withdrawal is ₹1,000. Visit dashboard to submit a request.",
        "menu_link": f"🔗 <b>Link your account</b>\n\nSend <code>/link your-email@example.com</code> to link your Telegram account.",
        "menu_refer": "🔗 <b>Refer & Earn</b>\n\nInvite your friends and earn commissions!\n\n• 10% of their ad deposits\n• 5% of their publisher earnings\n\nUse /refer to get your link."
    }
    text = replies.get(data, "⚙️ Coming soon.")
    keyboard = [[InlineKeyboardButton("🔙 Back", callback_data="menu_back"),
                 InlineKeyboardButton("🌐 Dashboard", url=FRONT_URL)]]

    if data == "menu_back":
        await cmd_start(update, context)
        return

    await q.edit_message_text(
        text,
        parse_mode=constants.ParseMode.HTML,
        reply_markup=InlineKeyboardMarkup(keyboard),
        disable_web_page_preview=True
    )

async def cmd_link(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await update.message.reply_html("⚠️ <b>Usage:</b> <code>/link email@example.com</code>")
        return
    
    email = context.args[0]
    user = update.effective_user
    try:
        def link_account():
            r = requests.post(
                f"{BACKEND_URL}/groups/bot-link-account",
                json={"email": email, "telegramId": str(user.id), "telegramUsername": user.username},
                headers={"x-admin-secret": ADMIN_SECRET},
                timeout=10
            )
            r.raise_for_status()
            return r.json()
            
        await asyncio.to_thread(link_account)
        await update.message.reply_html(f"✅ <b>Account Linked!</b>\n\nYour Telegram ID is now connected to <b>{email}</b>.\nYou can now use /stats and /earnings.")
    except Exception as e:
        if hasattr(e, 'response') and e.response is not None and e.response.status_code == 404:
            await update.message.reply_html(f"❌ <b>Email not found</b>\n\nCould not find <b>{email}</b> in our system. Please check your spelling or register on the dashboard first.")
        else:
            await update.message.reply_html("❌ Could not link account right now. Try again later.")

async def fetch_user_stats(telegram_id: str):
    def get_stats():
        r = requests.get(
            f"{BACKEND_URL}/groups/bot-user-stats/{telegram_id}",
            headers={"x-admin-secret": ADMIN_SECRET},
            timeout=5
        )
        r.raise_for_status()
        return r.json()
    return await asyncio.to_thread(get_stats)

async def cmd_stats(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    try:
        data = await fetch_user_stats(user_id)
        
        # Header
        text = (
            f"📊 <b>Publisher Statistics</b>\n"
            f"👤 Account: <code>{data.get('email')}</code>\n"
            f"──────────────────\n\n"
        )
        
        groups = data.get('groups', [])
        if not groups:
            text += "<i>No groups registered yet. Use /register inside your group to start!</i>\n"
        else:
            for g in groups:
                status_emoji = "✅" if g['status'] == 'approved' else "⏳" if g['status'] == 'pending' else "❌"
                text += (
                    f"<b>{status_emoji} {g['name']}</b>\n"
                    f"👥 Members: <code>{g['memberCount']}</code>\n"
                    f"📢 Ads Posted: <code>{g['totalAds']}</code>\n"
                    f"👁 Impressions: <code>{g['impressions']}</code>\n"
                    f"──────────────────\n"
                )
        
        text += f"\n🔗 <a href='{FRONT_URL}'>Open Web Dashboard</a>"
        
    except Exception as e:
        if hasattr(e, 'response') and e.response is not None and e.response.status_code == 404:
            text = f"⚠️ <b>Account Not Linked</b>\n\nPlease use <code>/link your-email@example.com</code> first."
        else:
            text = "❌ Could not fetch stats right now. Try again later."

    await update.message.reply_html(text)

async def cmd_earnings(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    try:
        data = await fetch_user_stats(user_id)
        wallet = float(data.get('walletBalance', 0))
        earned = float(data.get('totalEarned', 0))
        
        # Header
        text = (
            f"💰 <b>Earnings Overview</b>\n"
            f"👤 Account: <code>{data.get('email')}</code>\n"
            f"──────────────────\n\n"
            f"💳 <b>Wallet Balance:</b> ₹{wallet:.2f}\n"
            f"💵 <b>Lifetime Earned:</b> ₹{earned:.2f}\n"
            f"──────────────────\n\n"
        )
        
        groups = data.get('groups', [])
        if groups:
            text += "<b>Individual Group Revenue:</b>\n"
            for g in groups:
                text += f"▪️ {g['name']}: ₹{g['revenue']:.2f}\n"
            text += "──────────────────\n"
        
        text += f"\n🏦 <a href='{FRONT_URL}'>Withdraw Funds on Dashboard</a>"
        
    except Exception as e:
        if hasattr(e, 'response') and e.response is not None and e.response.status_code == 404:
            text = f"⚠️ <b>Account Not Linked</b>\n\nPlease use <code>/link your-email@example.com</code> first."
        else:
            text = "❌ Could not fetch earnings right now. Try again later."

    await update.message.reply_html(text)

async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_html(
        "ℹ️ <b>TeleAds Pro Help</b>\n\n"
        "<code>/start</code> - Main Menu\n"
        "<code>/register</code> - Register your group\n"
        "<code>/link email</code> - Link your dashboard account\n"
        "<code>/stats</code> - View statistics\n"
        "<code>/earnings</code> - View earnings\n\n"
        "Need support? Contact our team on the dashboard."
    )

def build_app(token: str) -> Application:
    app = ApplicationBuilder().token(token).build()
    app.add_handler(CommandHandler("start",    cmd_start))
    app.add_handler(CommandHandler("register", cmd_register))
    app.add_handler(CommandHandler("link",     cmd_link))
    app.add_handler(CommandHandler("refer",    cmd_refer))
    app.add_handler(CommandHandler("stats",    cmd_stats))
    app.add_handler(CommandHandler("earnings", cmd_earnings))
    app.add_handler(CommandHandler("help",     cmd_help))
    app.add_handler(CallbackQueryHandler(btn_handler))
    return app


# ──────────────────────────────────────────────
#  Main — Run all bots concurrently via polling
# ──────────────────────────────────────────────
async def main():
    log.info("🔄 Fetching bot tokens from backend...")
    bot_configs = fetch_bot_tokens()

    if not bot_configs:
        log.error("No bots to start. Exiting.")
        return

    apps = []
    seen_tokens = set()

    for cfg in bot_configs:
        token = cfg.get("token", "")
        name  = cfg.get("name",  "Unknown")
        if not token or token == "YOUR_TELEGRAM_BOT_TOKEN":
            log.warning("⏭  Skipping %s — placeholder token", name)
            continue
        if token in seen_tokens:
            continue
        seen_tokens.add(token)

        log.info("🤖 Starting bot: %s (%s...)", name, token[:10])
        application = build_app(token)
        apps.append(application)

    if not apps:
        log.error("No valid bots to start. Check your tokens in Superadmin Dashboard.")
        return

    # Start all bots
    for application in apps:
        try:
            await application.initialize()
            await application.start()
            await application.updater.start_polling(drop_pending_updates=True)
            log.info("✅ Polling active — Send /start to your bot now!")
        except Exception as e:
            if "Conflict" in str(e):
                log.error("❌ CONFLICT ERROR: Another script or terminal is ALREADY running this bot!")
                log.error("👉 Please CLOSE any other terminal windows running bot.py and try again.")
            else:
                log.error("❌ Failed to start polling: %s", getattr(e, "message", str(e)))

    # Wait forever
    try:
        await asyncio.Event().wait()
    except (KeyboardInterrupt, SystemExit):
        pass
    finally:
        for application in apps:
            try:
                if application.updater and application.updater.running:
                    await application.updater.stop()
                if application.running:
                    await application.stop()
                await application.shutdown()
            except Exception:
                pass


if __name__ == "__main__":
    asyncio.run(main())
