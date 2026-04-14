"""
User CRUD & API Routes
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, date, timedelta
from sqlalchemy import func, desc

from ..database import get_db
from ..models import User, Portfolio, Trade, Signal, Watchlist
from ..auth.utils import get_current_user, get_admin_user
from .schemas import (
    PortfolioSchema, TradeSchema, SignalSchema, WatchlistSchema,
    PortfolioStats, DashboardStats
)

router = APIRouter(prefix="/users", tags=["Users"])


# ─── PORTFOLIO ────────────────────────────────────────────────

@router.get("/me/portfolio", response_model=List[PortfolioSchema])
def get_portfolio(
    status: Optional[str] = Query(None),  # open | closed | all
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Portfolio).filter(Portfolio.user_id == current_user.id)
    if status and status != "all":
        q = q.filter(Portfolio.status == status)
    return q.order_by(desc(Portfolio.created_at)).all()


@router.post("/me/portfolio")
def add_portfolio_item(
    symbol: str,
    exchange: str = "NSE",
    quantity: int = 0,
    avg_price: float = 0,
    strategy: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = Portfolio(
        user_id=current_user.id,
        symbol=symbol.upper(),
        exchange=exchange,
        quantity=quantity,
        avg_price=avg_price,
        strategy=strategy,
        status="open",
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/me/portfolio/{item_id}")
def update_portfolio_item(
    item_id: str,
    quantity: Optional[int] = None,
    avg_price: Optional[float] = None,
    current_price: Optional[float] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(Portfolio).filter(
        Portfolio.id == item_id,
        Portfolio.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Portfolio item not found")

    if quantity is not None: item.quantity = quantity
    if avg_price is not None: item.avg_price = avg_price
    if current_price is not None: item.current_price = current_price
    if status is not None: item.status = status

    # Recalculate P&L
    if item.current_price and item.avg_price:
        item.market_value = item.current_price * item.quantity
        item.pnl = (item.current_price - item.avg_price) * item.quantity
        item.pnl_pct = ((item.current_price - item.avg_price) / item.avg_price) * 100

    db.commit()
    db.refresh(item)
    return item


@router.delete("/me/portfolio/{item_id}")
def delete_portfolio_item(
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(Portfolio).filter(
        Portfolio.id == item_id,
        Portfolio.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return {"message": "Deleted"}


# ─── TRADES ────────────────────────────────────────────────────

@router.get("/me/trades", response_model=List[TradeSchema])
def get_trades(
    symbol: Optional[str] = None,
    limit: int = Query(50, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Trade).filter(Trade.user_id == current_user.id)
    if symbol:
        q = q.filter(Trade.symbol == symbol.upper())
    return q.order_by(desc(Trade.created_at)).limit(limit).all()


@router.post("/me/trades")
def add_trade(
    symbol: str,
    action: str,
    quantity: int,
    price: float,
    order_value: float = 0,
    order_type: str = "market",
    strategy: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trade = Trade(
        user_id=current_user.id,
        symbol=symbol.upper(),
        action=action.upper(),
        quantity=quantity,
        price=price,
        order_value=order_value or (price * quantity),
        order_type=order_type,
        strategy=strategy,
        status="executed",
        executed_at=datetime.utcnow(),
    )
    db.add(trade)
    db.commit()
    db.refresh(trade)
    return trade


# ─── SIGNALS ────────────────────────────────────────────────────

@router.get("/me/signals", response_model=List[SignalSchema])
def get_signals(
    symbol: Optional[str] = None,
    status: Optional[str] = "active",
    limit: int = Query(50, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Signal).filter(
        (Signal.user_id == current_user.id) | (Signal.user_id == None)
    )
    if symbol:
        q = q.filter(Signal.symbol == symbol.upper())
    if status:
        q = q.filter(Signal.status == status)
    return q.order_by(desc(Signal.created_at)).limit(limit).all()


# ─── WATCHLIST ──────────────────────────────────────────────────

@router.get("/me/watchlist", response_model=List[WatchlistSchema])
def get_watchlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Watchlist).filter(Watchlist.user_id == current_user.id).all()


@router.post("/me/watchlist")
def add_to_watchlist(
    symbol: str,
    name: str = "My Watchlist",
    exchange: str = "NSE",
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = Watchlist(
        user_id=current_user.id,
        name=name,
        symbol=symbol.upper(),
        exchange=exchange,
        notes=notes,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/me/watchlist/{item_id}")
def remove_from_watchlist(
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(Watchlist).filter(
        Watchlist.id == item_id,
        Watchlist.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    return {"message": "Removed"}


# ─── DASHBOARD STATS ────────────────────────────────────────────

@router.get("/me/dashboard", response_model=DashboardStats)
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Portfolio stats
    positions = db.query(Portfolio).filter(
        Portfolio.user_id == current_user.id,
        Portfolio.status == "open"
    ).all()

    total_value = sum(float(p.market_value or 0) for p in positions)
    total_pnl = sum(float(p.pnl or 0) for p in positions)
    open_pos = len(positions)
    total_invested = sum(float(p.avg_price or 0) * p.quantity for p in positions)
    total_pnl_pct = (total_pnl / total_invested * 100) if total_invested else 0

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    closed_today = db.query(Portfolio).filter(
        Portfolio.user_id == current_user.id,
        Portfolio.status == "closed",
        Portfolio.updated_at >= today_start
    ).count()

    # Signal counts
    today_signals = db.query(Signal).filter(
        Signal.created_at >= today_start
    ).count()
    active_signals = db.query(Signal).filter(Signal.status == "active").count()

    today_trades = db.query(Trade).filter(
        Trade.user_id == current_user.id,
        Trade.created_at >= today_start
    ).count()

    return DashboardStats(
        portfolio=PortfolioStats(
            total_value=total_value,
            total_pnl=total_pnl,
            total_pnl_pct=round(total_pnl_pct, 2),
            day_pnl=0,
            open_positions=open_pos,
            closed_today=closed_today,
        ),
        today_signals=today_signals,
        active_signals=active_signals,
        today_trades=today_trades,
    )