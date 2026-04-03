"""
Vercel Python entry: mounts the Telegram FastAPI app at /api/bot and /bot so
ASGI paths match how Vercel forwards requests (subpaths become inner routes).
"""
from __future__ import annotations

import importlib.util
from pathlib import Path

from fastapi import FastAPI

_ROOT = Path(__file__).resolve().parent.parent
_BOT_FILE = _ROOT / "python_bot" / "api" / "bot.py"

spec = importlib.util.spec_from_file_location("teleads_telegram_bot", _BOT_FILE)
_mod = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(_mod)

inner = _mod.app

app = FastAPI(title="TeleAds Bot gateway", version="1.0")
app.mount("/api/bot", inner)


@app.get("/")
def gateway_health():
    return {
        "status": "ok",
        "gateway": "teleads-bot",
        "telegram_webhook": "/api/bot",
    }
