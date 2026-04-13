"""
Telegram Router — Per-user Telegram alerts
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer
from pydantic import BaseModel
from app.database import get_db
from app.admin.utils import get_current_user
import httpx

router = APIRouter()
security = HTTPBearer()

# The master bot that sends all alerts
MASTER_BOT_TOKEN = "8055991685:AAExK3SLcnb-xzZj0g3efypFMk8bSW94Ifo"
TELEGRAM_API = "https://api.telegram.org/bot"


class TelegramConnectRequest(BaseModel):
    chat_id: int


class TelegramTestRequest(BaseModel):
    chat_id: int


@router.post("/connect")
async def connect_telegram(data: TelegramConnectRequest, user=Depends(get_current_user)):
    """
    Save user's Telegram chat_id and send a test message.
    User needs to send /start to @NSE_BSE_TRADE_BOT first to get their chat_id.
    """
    user_id = user.get("sub")
    
    # Verify the chat_id by sending a test message
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            # First verify the bot is accessible
            bot_info = await client.get(f"{TELEGRAM_API}{MASTER_BOT_TOKEN}/getMe")
            if not bot_info.json().get("ok"):
                raise HTTPException(status_code=500, detail="Telegram bot not accessible")
            
            # Send test message to verify chat_id
            test_msg = await client.post(
                f"{TELEGRAM_API}{MASTER_BOT_TOKEN}/sendMessage",
                json={
                    "chat_id": data.chat_id,
                    "text": f"✅ *Connected to NSE-BSE Trading Bot!*\n\nWelcome, {user.get('email', 'Trader')}!\n\nYou'll receive trade alerts here.\n\nTo disconnect: Update settings in your dashboard.",
                    "parse_mode": "Markdown"
                }
            )
            
            if not test_msg.json().get("ok"):
                error = test_msg.json().get("description", "Failed to send message")
                # Common error: chat not found means user hasn't started the bot
                if "chat not found" in error.lower():
                    raise HTTPException(
                        status_code=400,
                        detail="Chat not found. Please first open @NSE_BSE_TRADE_BOT on Telegram and send /start, then try again."
                    )
                raise HTTPException(status_code=400, detail=error)
    
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Telegram error: {str(e)}")

    # Save chat_id to database
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "UPDATE trading_users SET telegram_chat_id = %s, updated_at = NOW() WHERE id = %s",
            (data.chat_id, user_id)
        )
        conn.commit()
    
    return {
        "success": True,
        "message": f"Telegram connected! You'll receive alerts at this chat."
    }


@router.post("/disconnect")
async def disconnect_telegram(user=Depends(get_current_user)):
    """Disconnect Telegram alerts."""
    user_id = user.get("sub")
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "UPDATE trading_users SET telegram_chat_id = NULL, updated_at = NOW() WHERE id = %s",
            (user_id,)
        )
        conn.commit()
    return {"success": True, "message": "Telegram disconnected"}


@router.get("/status")
async def telegram_status(user=Depends(get_current_user)):
    """Check if Telegram is connected."""
    user_id = user.get("sub")
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT telegram_chat_id FROM trading_users WHERE id = %s", (user_id,))
        row = cur.fetchone()
    
    return {
        "connected": row and row['telegram_chat_id'] is not None,
        "chat_id": row['telegram_chat_id'] if row else None
    }


# ── Internal: Send alert to user (called by bot) ────────────────────

async def send_user_alert(user_id: str, message: str, alert_type: str = "ALERT"):
    """Send Telegram alert to a specific user. Called by the trading bot."""
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "SELECT telegram_chat_id FROM trading_users WHERE id = %s AND telegram_chat_id IS NOT NULL",
            (user_id,)
        )
        row = cur.fetchone()
    
    if not row or not row['telegram_chat_id']:
        return  # User hasn't connected Telegram
    
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            emoji = {"TRADE": "📈", "SIGNAL": "🎯", "ALERT": "🔔", "ERROR": "⚠️"}.get(alert_type, "📊")
            await client.post(
                f"{TELEGRAM_API}{MASTER_BOT_TOKEN}/sendMessage",
                json={
                    "chat_id": row['telegram_chat_id'],
                    "text": f"{emoji} *NSE-BSE Bot*\n\n{message}",
                    "parse_mode": "Markdown"
                }
            )
    except Exception:
        pass  # Don't crash if Telegram fails
