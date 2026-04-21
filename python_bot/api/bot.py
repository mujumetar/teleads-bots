"""
TeleAds Bot — Webhook Mode (Vercel Serverless)
Each invocation handles exactly ONE Telegram update via webhook.
"""
import os
import json
import asyncio
import logging
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from telegram import (
    Update, InlineKeyboardButton, InlineKeyboardMarkup, constants, Bot
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

BOT_TOKEN    = os.getenv("BOT_TOKEN", "")
BACKEND_URL  = os.getenv("BACKEND_URL", "http://localhost:5000/api")
FRONT_URL    = os.getenv("FRONT_URL",   "https://teleads.vercel.app")
ADMIN_SECRET = os.getenv("ADMIN_SECRET", "")

# ──────────────────────────────────────────────
#  FastAPI app (Vercel entrypoint)
# ──────────────────────────────────────────────
app = FastAPI()

# Build the PTB Application once (reused across warm invocations)
_ptb_app: Application | None = None

def get_ptb_app() -> Application:
    global _ptb_app
    if _ptb_app is None:
        _ptb_app = ApplicationBuilder().token(BOT_TOKEN).build()
        _ptb_app.add_handler(CommandHandler("start",    cmd_start))
        _ptb_app.add_handler(CommandHandler("register", cmd_register))
        _ptb_app.add_handler(CommandHandler("link",     cmd_link))
        _ptb_app.add_handler(CommandHandler("refer",    cmd_refer))
        _ptb_app.add_handler(CommandHandler("stats",    cmd_stats))
        _ptb_app.add_handler(CommandHandler("earnings", cmd_earnings))
        _ptb_app.add_handler(CommandHandler("help",     cmd_help))
        _ptb_app.add_handler(CallbackQueryHandler(btn_handler))
    return _ptb_app


# ──────────────────────────────────────────────
#  Async HTTP helper (replaces sync requests)
# ──────────────────────────────────────────────
async def backend_get(path: str) -> dict:
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(
            f"{BACKEND_URL}{path}",
            headers={"x-admin-secret": ADMIN_SECRET}
        )
        r.raise_for_status()
        return r.json()

async def backend_post(path: str, payload: dict) -> dict:
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.post(
            f"{BACKEND_URL}{path}",
            json=payload,
            headers={"x-admin-secret": ADMIN_SECRET}
        )
        r.raise_for_status()
        return r.json()


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
            InlineKeyboardButton("💰 Earnings",    callback_data="menu_earnings"),
            InlineKeyboardButton("🔗 Refer & Earn", callback_data="menu_refer"),
        ],
        [
            InlineKeyboardButton("📈 Analytics",   callback_data="menu_analytics"),
            InlineKeyboardButton("💸 Withdraw",    callback_data="menu_withdraw"),
        ],
        [
            InlineKeyboardButton("🔗 Link Account", callback_data="menu_link"),
            InlineKeyboardButton("🌐 Dashboard",    url=FRONT_URL)
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
            await backend_post("/groups/bot-referral", {
                "telegramId": str(user.id),
                "referralCode": ref_code
            })
        except Exception:
            pass

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

    min_members = 100
    is_superadmin = False
    try:
        settings = await backend_get("/admin/bot-settings")
        min_setting = next((s for s in settings if s.get("key") == "min_group_members"), None)
        if min_setting:
            min_members = int(min_setting["value"])

        user_data = await backend_get(f"/groups/bot-user-stats/{user.id}")
        if user_data.get("role") == "superadmin":
            is_superadmin = True
    except Exception as e:
        log.warning("Settings fetch error: %s", e)

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
        resp = await backend_post("/groups/bot-register", payload)
        await context.bot.send_message(
            user.id,
            f"✅ <b>Group Registered!</b>\n"
            f"🆔 <code>{chat.id}</code>\n"
            f"⏳ Pending Superadmin approval.\n\n"
            f"<i>Make sure to use /link email@example.com to see it in your dashboard!</i>",
            parse_mode=constants.ParseMode.HTML
        )
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 409:
            await context.bot.send_message(
                user.id,
                "⚠️ <b>This group is already registered!</b>",
                parse_mode=constants.ParseMode.HTML
            )
        else:
            await update.message.reply_html(f"❌ Registration failed: <code>{e}</code>")
    except Exception as e:
        await update.message.reply_html(f"❌ Registration failed: <code>{e}</code>")


async def cmd_refer(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    try:
        data = await backend_get(f"/groups/bot-user-stats/{user.id}")
        ref_code = data.get("referralCode", "ERROR")
        bot_info = await context.bot.get_me()
        ref_link = f"https://t.me/{bot_info.username}?start={ref_code}"

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

    if data == "menu_back":
        await cmd_start(update, context)
        return

    replies = {
        "menu_register": "📡 <b>Register your group</b>\n\nAdd the bot to your group as an Admin, then send <code>/register</code> inside that group.",
        "menu_mygroups": "📊 <b>My Groups</b>\n\nOpen your dashboard to view your registered groups.",
        "menu_earnings": "💰 <b>Earnings</b>\n\nOpen your dashboard to view your earnings breakdown.",
        "menu_analytics": "📈 <b>Analytics</b>\n\nVisit the dashboard for detailed performance metrics.",
        "menu_withdraw": "💸 <b>Withdraw</b>\n\nMinimum withdrawal is ₹1,000. Visit dashboard to submit a request.",
        "menu_link": "🔗 <b>Link your account</b>\n\nSend <code>/link your-email@example.com</code> to link your Telegram account.",
        "menu_refer": "🔗 <b>Refer & Earn</b>\n\nInvite your friends and earn commissions!\n\n• 10% of their ad deposits\n• 5% of their publisher earnings\n\nUse /refer to get your link."
    }
    text = replies.get(data, "⚙️ Coming soon.")
    keyboard = [[
        InlineKeyboardButton("🔙 Back", callback_data="menu_back"),
        InlineKeyboardButton("🌐 Dashboard", url=FRONT_URL)
    ]]

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
        await backend_post("/groups/bot-link-account", {
            "email": email,
            "telegramId": str(user.id),
            "telegramUsername": user.username
        })
        await update.message.reply_html(
            f"✅ <b>Account Linked!</b>\n\n"
            f"Your Telegram ID is now connected to <b>{email}</b>.\n"
            f"You can now use /stats and /earnings."
        )
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            await update.message.reply_html(
                f"❌ <b>Email not found</b>\n\n"
                f"Could not find <b>{email}</b> in our system. "
                f"Please check your spelling or register on the dashboard first."
            )
        else:
            await update.message.reply_html("❌ Could not link account right now. Try again later.")
    except Exception:
        await update.message.reply_html("❌ Could not link account right now. Try again later.")


async def cmd_stats(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    try:
        data = await backend_get(f"/groups/bot-user-stats/{user_id}")
        text = (
            f"📊 <b>Publisher Statistics</b>\n"
            f"👤 Account: <code>{data.get('email')}</code>\n"
            f"──────────────────\n\n"
        )
        groups = data.get("groups", [])
        if not groups:
            text += "<i>No groups registered yet. Use /register inside your group to start!</i>\n"
        else:
            for g in groups:
                status_emoji = "✅" if g["status"] == "approved" else "⏳" if g["status"] == "pending" else "❌"
                text += (
                    f"<b>{status_emoji} {g['name']}</b>\n"
                    f"👥 Members: <code>{g['memberCount']}</code>\n"
                    f"📢 Ads Posted: <code>{g['totalAds']}</code>\n"
                    f"👁 Impressions: <code>{g['impressions']}</code>\n"
                    f"──────────────────\n"
                )
        text += f"\n🔗 <a href='{FRONT_URL}'>Open Web Dashboard</a>"
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            text = "⚠️ <b>Account Not Linked</b>\n\nPlease use <code>/link your-email@example.com</code> first."
        else:
            text = "❌ Could not fetch stats right now. Try again later."
    except Exception:
        text = "❌ Could not fetch stats right now. Try again later."

    await update.message.reply_html(text)


async def cmd_earnings(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    try:
        data = await backend_get(f"/groups/bot-user-stats/{user_id}")
        wallet = float(data.get("walletBalance", 0))
        earned = float(data.get("totalEarned", 0))
        text = (
            f"💰 <b>Earnings Overview</b>\n"
            f"👤 Account: <code>{data.get('email')}</code>\n"
            f"──────────────────\n\n"
            f"💳 <b>Wallet Balance:</b> ₹{wallet:.2f}\n"
            f"💵 <b>Lifetime Earned:</b> ₹{earned:.2f}\n"
            f"──────────────────\n\n"
        )
        groups = data.get("groups", [])
        if groups:
            text += "<b>Individual Group Revenue:</b>\n"
            for g in groups:
                text += f"▪️ {g['name']}: ₹{g['revenue']:.2f}\n"
            text += "──────────────────\n"
        text += f"\n🏦 <a href='{FRONT_URL}'>Withdraw Funds on Dashboard</a>"
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            text = "⚠️ <b>Account Not Linked</b>\n\nPlease use <code>/link your-email@example.com</code> first."
        else:
            text = "❌ Could not fetch earnings right now. Try again later."
    except Exception:
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


# ──────────────────────────────────────────────
#  Vercel Serverless Routes
# ──────────────────────────────────────────────

@app.post("/api/bot")
async def webhook(request: Request):
    """Main webhook — called by Telegram on every update."""
    if not BOT_TOKEN:
        return JSONResponse({"error": "BOT_TOKEN not configured"}, status_code=500)

    try:
        body = await request.json()
    except Exception:
        return Response(status_code=400)

    ptb = get_ptb_app()

    # Initialize once if not yet done
    if not ptb.running:
        await ptb.initialize()

    update = Update.de_json(body, ptb.bot)
    await ptb.process_update(update)

    return Response(status_code=200)


@app.get("/api/bot")
async def health():
    """Health check endpoint."""
    return JSONResponse({"status": "ok", "bot": "TeleAds Pro"})


@app.get("/setup")
async def setup_webhook(request: Request):
    """
    Visit this URL once after deployment to register the webhook with Telegram.
    e.g. https://your-bot.vercel.app/setup
    """
    if not BOT_TOKEN:
        return JSONResponse({"error": "BOT_TOKEN not configured"}, status_code=500)

    # Determine the public URL automatically
    host = request.headers.get("x-forwarded-host") or request.headers.get("host", "")
    scheme = request.headers.get("x-forwarded-proto", "https")
    webhook_url = f"{scheme}://{host}/api/bot"

    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"https://api.telegram.org/bot{BOT_TOKEN}/setWebhook",
            json={"url": webhook_url, "drop_pending_updates": True}
        )
        data = r.json()

    if data.get("ok"):
        return JSONResponse({"status": "✅ Webhook registered", "url": webhook_url})
    else:
        return JSONResponse({"status": "❌ Failed", "detail": data}, status_code=500)
