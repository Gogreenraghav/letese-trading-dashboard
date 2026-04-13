"""
Backtest Router — Pure Python backtest engine
"""
import yfinance as yf
import numpy as np
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.database import get_db
from app.admin.utils import get_current_user

router = APIRouter()

STRATEGY_PARAMS = {
    "momentum": {
        "fast_ma": 9,
        "slow_ma": 21,
        "rsi_period": 14,
        "rsi_buy": 55,
        "rsi_sell": 45,
    },
    "mean_reversion": {
        "bb_period": 20,
        "bb_std": 2,
        "rsi_period": 14,
        "rsi_buy": 30,
        "rsi_sell": 70,
    },
    "breakout": {
        "lookback": 20,
        "volume_factor": 1.5,
    },
}

TOP_NSE_STOCKS = [
    "RELIANCE.NS","TCS.NS","INFY.NS","HDFCBANK.NS","ICICIBANK.NS",
    "SBIN.NS","BAJFINANCE.NS","HINDUNILVR.NS","ITC.NS","KOTAKBANK.NS",
    "LT.NS","SUNPHARMA.NS","ADANIENT.NS","COALINDIA.NS","NESTLEIND.NS",
    "TATAMOTORS.NS","SBILIFE.NS","BAJAJFINSV.NS","M&M.NS","EICHERMOT.NS",
]

def fetch_data(symbol, days):
    try:
        ticker = yf.Ticker(symbol)
        end = datetime.now()
        start = end - timedelta(days=days + 30)
        df = ticker.history(start=start, end=end, interval="1d")
        if df is None or len(df) == 0:
            return None
        return {
            "symbol": symbol,
            "closes": df["Close"].tolist(),
            "highs": df["High"].tolist(),
            "lows": df["Low"].tolist(),
            "opens": df["Open"].tolist(),
            "volumes": df["Volume"].tolist(),
            "dates": [str(d.date()) for d in df.index],
        }
    except Exception as e:
        return None

def calc_rsi(closes, period=14):
    if len(closes) < period + 1:
        return [50.0] * len(closes)
    changes = np.diff(closes, prepend=closes[0])
    gains = np.maximum(changes, 0)
    losses = np.maximum(-changes, 0)
    avg_gain = np.mean(gains[:period])
    avg_loss = np.mean(losses[:period])
    rsi = [50.0] * period
    for i in range(period, len(closes)):
        avg_gain = (avg_gain * (period - 1) + gains[i]) / period
        avg_loss = (avg_loss * (period - 1) + losses[i]) / period
        if avg_loss == 0:
            rsi.append(100)
        else:
            rs = avg_gain / avg_loss
            rsi.append(100 - (100 / (1 + rs)))
    return rsi

def calc_ma(values, period):
    result = []
    for i in range(len(values)):
        if i < period - 1:
            result.append(values[i])
        else:
            result.append(sum(values[i - period + 1:i + 1]) / period)
    return result

def momentum_signals(closes, params):
    fast = calc_ma(closes, params["fast_ma"])
    slow = calc_ma(closes, params["slow_ma"])
    rsi_vals = calc_rsi(closes, params["rsi_period"])
    signals = []
    for i in range(1, len(closes)):
        if fast[i] > slow[i] and fast[i-1] <= slow[i-1] and rsi_vals[i] > params["rsi_buy"]:
            signals.append({"i": i, "action": "BUY", "price": closes[i]})
        elif fast[i] < slow[i] and fast[i-1] >= slow[i-1] and rsi_vals[i] < params["rsi_sell"]:
            signals.append({"i": i, "action": "SELL", "price": closes[i]})
    return signals

def mean_reversion_signals(closes, highs, lows, params):
    bb_period = params["bb_period"]
    bb_std = params["bb_std"]
    rsi_vals = calc_rsi(closes, params["rsi_period"])
    signals = []
    for i in range(bb_period, len(closes)):
        window = closes[i - bb_period:i]
        ma = sum(window) / len(window)
        std = (sum((x - ma) ** 2 for x in window) / len(window)) ** 0.5
        upper = ma + bb_std * std
        lower = ma - bb_std * std
        price = closes[i]
        if price < lower and rsi_vals[i] < params["rsi_buy"]:
            signals.append({"i": i, "action": "BUY", "price": price})
        elif price > upper and rsi_vals[i] > params["rsi_sell"]:
            signals.append({"i": i, "action": "SELL", "price": price})
    return signals

def breakout_signals(closes, highs, lows, volumes, params):
    lookback = params["lookback"]
    vol_factor = params["volume_factor"]
    avg_vol = sum(volumes[:lookback]) / lookback
    signals = []
    for i in range(lookback + 1, len(closes)):
        prev_high = max(highs[i - lookback:i])
        prev_low = min(lows[i - lookback:i])
        vol = volumes[i]
        price = closes[i]
        if price > prev_high and vol > avg_vol * vol_factor:
            signals.append({"i": i, "action": "BUY", "price": price})
        elif price < prev_low:
            signals.append({"i": i, "action": "SELL", "price": price})
        avg_vol = (avg_vol * (lookback - 1) + vol) / lookback
    return signals

def run_backtest(symbol, strategy_name, days, capital):
    data = fetch_data(symbol, days)
    if not data:
        raise HTTPException(status_code=500, detail=f"Failed to fetch data for {symbol}")

    params = STRATEGY_PARAMS.get(strategy_name, STRATEGY_PARAMS["momentum"])
    closes = data["closes"]
    highs = data["highs"]
    lows = data["lows"]
    volumes = data.get("volumes") or [0] * len(closes)
    dates = data["dates"]

    if strategy_name == "momentum":
        sigs = momentum_signals(closes, params)
    elif strategy_name == "mean_reversion":
        sigs = mean_reversion_signals(closes, highs, lows, params)
    else:  # breakout
        sigs = breakout_signals(closes, highs, lows, volumes, params)

    position = None
    trades = []
    cash = capital
    shares = 0
    peak = capital
    max_dd = 0

    for sig in sigs:
        i = sig["i"]
        price = sig["price"]
        date = dates[i] if i < len(dates) else ""

        if sig["action"] == "BUY" and position is None:
            qty = int(cash / price)
            if qty > 0:
                position = {"qty": qty, "entry": price, "entry_date": date}
                cash -= qty * price
        elif sig["action"] == "SELL" and position is not None:
            pnl = (price - position["entry"]) * position["qty"]
            pnl_pct = (price - position["entry"]) / position["entry"] * 100
            holding = (datetime.strptime(date, "%Y-%m-%d") - datetime.strptime(position["entry_date"], "%Y-%m-%d")).days if date and position["entry_date"] else 0
            trades.append({
                "entryDate": position["entry_date"],
                "exitDate": date,
                "action": "BUY",
                "entryPrice": position["entry"],
                "exitPrice": price,
                "quantity": position["qty"],
                "pnl": round(pnl, 2),
                "pnlPct": round(pnl_pct, 2),
                "holdingDays": holding,
            })
            cash += position["qty"] * price
            position = None

    # Close any open position
    if position and len(closes) > 0:
        last_price = closes[-1]
        last_date = dates[-1] if dates else ""
        pnl = (last_price - position["entry"]) * position["qty"]
        pnl_pct = (price - position["entry"]) / position["entry"] * 100
        holding = (datetime.strptime(last_date, "%Y-%m-%d") - datetime.strptime(position["entry_date"], "%Y-%m-%d")).days if last_date and position["entry_date"] else 0
        trades.append({
            "entryDate": position["entry_date"],
            "exitDate": last_date,
            "action": "BUY",
            "entryPrice": position["entry"],
            "exitPrice": last_price,
            "quantity": position["qty"],
            "pnl": round(pnl, 2),
            "pnlPct": round(pnl_pct, 2),
            "holdingDays": holding,
        })
        cash += position["qty"] * last_price

    wins = [t for t in trades if t["pnl"] > 0]
    losses = [t for t in trades if t["pnl"] <= 0]
    total_pnl = cash - capital
    total_return = (total_pnl / capital) * 100
    final_value = capital + total_pnl
    peak = max(peak, final_value)
    dd = (peak - final_value) / peak * 100 if peak > 0 else 0
    max_dd = max(max_dd, dd)

    win_rate = (len(wins) / len(trades) * 100) if trades else 0
    avg_win = (sum(t["pnl"] for t in wins) / len(wins)) if wins else 0
    avg_loss = (sum(t["pnl"] for t in losses) / len(losses)) if losses else 0
    total_win = sum(t["pnl"] for t in wins)
    total_loss = sum(abs(t["pnl"]) for t in losses)
    profit_factor = (total_win / total_loss) if total_loss > 0 else 999

    # Simple Sharpe (daily returns)
    if len(closes) > 30:
        returns = np.diff(closes) / closes[:-1]
        sharpe = round((returns.mean() / returns.std()) * (252 ** 0.5), 2) if returns.std() > 0 else 0
    else:
        sharpe = 0

    return {
        "symbol": symbol,
        "strategy": strategy_name,
        "period": {"days": days, "start": dates[0] if dates else "", "end": dates[-1] if dates else ""},
        "capital": capital,
        "finalValue": round(final_value),
        "totalReturn": f"{total_return:.1f}%",
        "totalPnl": round(total_pnl),
        "totalTrades": len(trades),
        "wins": len(wins),
        "losses": len(losses),
        "winRate": f"{win_rate:.0f}%",
        "avgWin": round(avg_win),
        "avgLoss": round(avg_loss),
        "profitFactor": f"{profit_factor:.2f}x",
        "maxDrawdown": f"{max_dd:.1f}%",
        "sharpeRatio": f"{sharpe:.2f}",
        "bestTrade": round(max((t["pnl"] for t in trades), default=0), 2),
        "worstTrade": round(min((t["pnl"] for t in trades), default=0), 2),
        "avgHoldingDays": round(sum(t["holdingDays"] for t in trades) / len(trades)) if trades else 0,
        "trades": trades[-10:],  # last 10 trades
    }


# ── API Endpoints ──────────────────────────────────────────────────

class BacktestRequest(BaseModel):
    symbol: str
    strategy: str = "momentum"
    days: int = 180
    capital: int = 1000000

@router.post("/run")
async def run_backtest_api(data: BacktestRequest, user = Depends(get_current_user)):
    try:
        return run_backtest(data.symbol, data.strategy, data.days, data.capital)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/top-stocks")
async def top_stocks(
    days: int = Query(180, ge=30, le=730),
    strategy: str = Query("momentum"),
    user = Depends(get_current_user)
):
    results = []
    for symbol in TOP_NSE_STOCKS[:16]:
        try:
            r = run_backtest(symbol, strategy, days, 1_000_000)
            results.append({
                "symbol": symbol,
                "return": r["totalReturn"],
                "win_rate": r["winRate"],
                "trades": r["totalTrades"],
                "sharpe": r["sharpeRatio"],
                "max_drawdown": r["maxDrawdown"],
                "total_pnl": r["totalPnl"],
            })
        except Exception:
            pass

    results.sort(key=lambda x: float(x["return"].replace("%","")), reverse=True)
    return {"days": days, "strategy": strategy, "results": results}

@router.get("/strategies")
async def compare_strategies(
    symbol: str = Query("RELIANCE.NS"),
    days: int = Query(365, ge=30, le=730),
    user = Depends(get_current_user)
):
    results = {}
    for strat in ["momentum", "mean_reversion", "breakout"]:
        try:
            r = run_backtest(symbol, strat, days, 1_000_000)
            results[strat] = {
                "totalReturn": r["totalReturn"],
                "winRate": r["winRate"],
                "sharpeRatio": r["sharpeRatio"],
                "maxDrawdown": r["maxDrawdown"],
                "totalTrades": r["totalTrades"],
                "totalPnl": r["totalPnl"],
            }
        except Exception as e:
            results[strat] = {"error": str(e)}

    return {"symbol": symbol, "days": days, "strategies": results}
