"""
Trading Router — User-specific trading endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from app.database import get_db
from app.admin.utils import get_current_user
from datetime import datetime, timedelta

router = APIRouter()

# ── Portfolio ────────────────────────────────────────────────────────

@router.get("/portfolio")
async def get_portfolio(user = Depends(get_current_user)):
    """Get user's current portfolio."""
    user_id = user.get("sub")
    with get_db() as conn:
        cur = conn.cursor()
        
        # Get positions
        cur.execute("""
            SELECT symbol, quantity, entry_price, current_price, strategy,
                   stop_loss, target_price, entry_time
            FROM trading_positions
            WHERE user_id = %s AND status = 'open'
            ORDER BY entry_time DESC
        """, (user_id,))
        positions = cur.fetchall()
        
        # Calculate total invested
        invested = sum(p['quantity'] * float(p['entry_price']) for p in positions)
        
        # Get user cash from config
        cur.execute("SELECT initial_capital FROM trading_users WHERE id = %s", (user_id,))
        user_row = cur.fetchone()
        capital = user_row['initial_capital'] if user_row else 1000000
        
        return {
            "capital": capital,
            "cash": capital - invested,  # simplified
            "invested": invested,
            "total_value": capital,  # simplified — current prices needed
            "positions": [dict(p) for p in positions],
            "positions_count": len(positions)
        }


@router.get("/trades")
async def get_trades(
    limit: int = Query(20, ge=1, le=100),
    user = Depends(get_current_user)
):
    """Get user's trade history."""
    user_id = user.get("sub")
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("""
            SELECT symbol, action, quantity, price, pnl, pnl_percent,
                   strategy, signal_confidence, executed_at
            FROM trading_trades
            WHERE user_id = %s
            ORDER BY executed_at DESC
            LIMIT %s
        """, (user_id, limit))
        trades = cur.fetchall()
        return [dict(t) for t in trades]


@router.get("/signals")
async def get_signals(
    limit: int = Query(20, ge=1, le=100),
    user = Depends(get_current_user)
):
    """Get user's signals history."""
    user_id = user.get("sub")
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("""
            SELECT symbol, action, confidence, strategy, price, 
                   stop_loss, target, reason, executed, created_at
            FROM trading_signals
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT %s
        """, (user_id, limit))
        signals = cur.fetchall()
        return [dict(s) for s in signals]


@router.get("/stats")
async def get_user_stats(user = Depends(get_current_user)):
    """Get user's trading statistics."""
    user_id = user.get("sub")
    with get_db() as conn:
        cur = conn.cursor()
        
        cur.execute("""
            SELECT 
                COUNT(*) as total_trades,
                COUNT(*) FILTER (WHERE pnl > 0) as wins,
                COUNT(*) FILTER (WHERE pnl < 0) as losses,
                COALESCE(SUM(pnl), 0) as total_pnl,
                AVG(pnl_percent) FILTER (WHERE pnl_percent IS NOT NULL) as avg_pnl_percent,
                MAX(pnl) as best_trade,
                MIN(pnl) as worst_trade
            FROM trading_trades WHERE user_id = %s
        """, (user_id,))
        stats = cur.fetchone()
        
        return {
            "total_trades": stats['total_trades'] or 0,
            "wins": stats['wins'] or 0,
            "losses": stats['losses'] or 0,
            "win_rate": round((stats['wins'] or 0) / max(stats['total_trades'] or 1, 1) * 100, 1),
            "total_pnl": float(stats['total_pnl'] or 0),
            "avg_pnl_percent": float(stats['avg_pnl_percent'] or 0),
            "best_trade": float(stats['best_trade'] or 0),
            "worst_trade": float(stats['worst_trade'] or 0)
        }


@router.post("/signals/log")
async def log_signal(
    symbol: str,
    action: str,
    confidence: float,
    strategy: str,
    price: float,
    stop_loss: float = None,
    target: float = None,
    reason: str = None,
    user = Depends(get_current_user)
):
    """Log a trading signal (called by bot)."""
    user_id = user.get("sub")
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO trading_signals
            (user_id, symbol, action, confidence, strategy, price, stop_loss, target, reason)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (user_id, symbol, action, confidence, strategy, price, stop_loss, target, reason))
        conn.commit()
        return {"message": "Signal logged"}


@router.post("/trades/execute")
async def execute_trade(
    symbol: str,
    action: str,
    quantity: int,
    price: float,
    pnl: float = None,
    pnl_percent: float = None,
    strategy: str = None,
    confidence: float = None,
    user = Depends(get_current_user)
):
    """Log an executed trade."""
    user_id = user.get("sub")
    with get_db() as conn:
        cur = conn.cursor()
        
        if action == "BUY":
            # Add position
            cur.execute("""
                INSERT INTO trading_positions
                (user_id, symbol, quantity, entry_price, strategy)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (user_id, symbol, status) DO UPDATE
                SET quantity = trading_positions.quantity + EXCLUDED.quantity,
                    entry_price = (trading_positions.entry_price * trading_positions.quantity + EXCLUDED.entry_price * EXCLUDED.quantity) / (trading_positions.quantity + EXCLUDED.quantity),
                    last_updated = NOW()
                WHERE trading_positions.status = 'open'
            """, (user_id, symbol, quantity, price, strategy))
        
        elif action == "SELL":
            # Close position
            cur.execute("""
                UPDATE trading_positions
                SET status = 'closed'
                WHERE user_id = %s AND symbol = %s AND status = 'open'
            """, (user_id, symbol))
        
        # Log trade
        cur.execute("""
            INSERT INTO trading_trades
            (user_id, symbol, action, quantity, price, pnl, pnl_percent, strategy, signal_confidence)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (user_id, symbol, action, quantity, price, pnl, pnl_percent, strategy, confidence))
        
        conn.commit()
        return {"message": f"Trade executed: {action} {quantity} {symbol}"}
