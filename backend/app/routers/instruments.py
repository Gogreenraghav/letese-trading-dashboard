"""
Instruments Router - NSE/BSE Instrument Data
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Instrument, User, Subscription
from app.auth import get_current_user
from app.utils.zerodha_auth import get_kite
from app.config import ZERODHA_API_KEY
from datetime import datetime
import uuid

router = APIRouter(prefix="/instruments", tags=["Instruments"])

@router.get("/all")
def get_all_instruments(db: Session = Depends(get_db)):
    """Get all instruments from local DB"""
    instruments = db.query(Instrument).all()
    return {
        "count": len(instruments),
        "instruments": [
            {
                "instrument_token": i.instrument_token,
                "exchange_token": i.exchange_token,
                "tradingsymbol": i.tradingsymbol,
                "name": i.name,
                "expiry": i.expiry,
                "instrument_type": i.instrument_type,
                "segment": i.segment,
                "exchange": i.exchange,
            }
            for i in instruments
        ]
    }

@router.get("/search/{query}")
def search_instruments(query: str, db: Session = Depends(get_db)):
    """Search instruments by name or symbol"""
    instruments = db.query(Instrument).filter(
        (Instrument.tradingsymbol.ilike(f"%{query}%")) |
        (Instrument.name.ilike(f"%{query}%"))
    ).limit(20).all()
    return {"results": [{"symbol": i.tradingsymbol, "name": i.name, "token": i.instrument_token, "exchange": i.exchange} for i in instruments]}

@router.get("/option-chain/{underlying_symbol}")
def get_option_chain(underlying_symbol: str, expiry: str = None, db: Session = Depends(get_db)):
    """Get option chain for an underlying (NIFTY/BANKNIFTY/etc)"""
    base_instrument = db.query(Instrument).filter(
        Instrument.tradingsymbol == underlying_symbol
    ).first()
    if not base_instrument:
        return {"error": "Underlying not found"}

    expiry_filter = Instrument.underlying_symbol == underlying_symbol
    if expiry:
        expiry_filter = expiry_filter & (Instrument.expiry == expiry)
    else:
        expiry_filter = expiry_filter & (Instrument.expiry != None)

    instruments = db.query(Instrument).filter(expiry_filter).all()
    return {
        "underlying": underlying_symbol,
        "expiry": expiry or (instruments[0].expiry if instruments else None),
        "instruments": [
            {
                "tradingsymbol": i.tradingsymbol,
                "strike": i.strike,
                "instrument_type": i.instrument_type,
                "exchange": i.exchange,
                "token": i.instrument_token,
            }
            for i in sorted(instruments, key=lambda x: x.strike or 0)
        ]
    }

@router.get("/quotes/{symbol}")
def get_quote(symbol: str, db: Session = Depends(get_db)):
    """Get live quote from Kite Connect"""
    try:
        instrument = db.query(Instrument).filter(
            Instrument.tradingsymbol == symbol
        ).first()
        if not instrument:
            return {"error": "Instrument not found"}

        kite = get_kite()
        ltp = kite.ltp([f"{instrument.exchange}:{symbol}"])
        return ltp
    except Exception as e:
        return {"error": str(e)}

@router.get("/margins")
def get_margins(current_user: User = Depends(get_current_user)):
    """Get user margins from Zerodha"""
    try:
        kite = get_kite()
        margins = kite.margins()
        return margins
    except Exception as e:
        return {"error": str(e)}

@router.get("/positions")
def get_positions(current_user: User = Depends(get_current_user)):
    """Get live positions"""
    try:
        kite = get_kite()
        positions = {
            "day": kite.positions()["day"],
            "net": kite.positions()["net"]
        }
        return positions
    except Exception as e:
        return {"error": str(e)}

@router.get("/holdings")
def get_holdings(current_user: User = Depends(get_current_user)):
    """Get holdings"""
    try:
        kite = get_kite()
        holdings = kite.holdings()
        return {"holdings": holdings}
    except Exception as e:
        return {"error": str(e)}

@router.post("/order/place")
def place_order(order_data: dict, current_user: User = Depends(get_current_user)):
    """Place a new order"""
    try:
        kite = get_kite()
        order_id = kite.place_order(
            variety=order_data.get("variety", "NORMAL"),
            exchange=order_data.get("exchange", "NSE"),
            tradingsymbol=order_data["tradingsymbol"],
            transaction_type=order_data["transaction_type"],
            quantity=order_data["quantity"],
            product=order_data.get("product", "CNC"),
            order_type=order_data.get("order_type", "LIMIT"),
            price=order_data.get("price"),
            trigger_price=order_data.get("trigger_price"),
        )
        return {"success": True, "order_id": order_id}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.get("/orders")
def get_orders(current_user: User = Depends(get_current_user)):
    """Get order history"""
    try:
        kite = get_kite()
        orders = kite.orders()
        return {"orders": orders}
    except Exception as e:
        return {"error": str(e)}

@router.get("/orders/{order_id}")
def get_order(order_id: str, current_user: User = Depends(get_current_user)):
    """Get specific order info"""
    try:
        kite = get_kite()
        order = kite.order_history(order_id)
        return {"order": order[0] if order else None}
    except Exception as e:
        return {"error": str(e)}

@router.get("/trades")
def get_trades(current_user: User = Depends(get_current_user)):
    """Get trade book"""
    try:
        kite = get_kite()
        trades = kite.trades()
        return {"trades": trades}
    except Exception as e:
        return {"error": str(e)}

@router.post("/order/modify/{order_id}")
def modify_order(order_id: str, order_data: dict, current_user: User = Depends(get_current_user)):
    """Modify an existing order"""
    try:
        kite = get_kite()
        result = kite.modify_order(
            variety=order_data.get("variety", "NORMAL"),
            order_id=order_id,
            quantity=order_data.get("quantity"),
            price=order_data.get("price"),
            trigger_price=order_data.get("trigger_price"),
            order_type=order_data.get("order_type"),
        )
        return {"success": True, "result": result}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.delete("/order/cancel/{order_id}")
def cancel_order(order_id: str, variety: str = "NORMAL", current_user: User = Depends(get_current_user)):
    """Cancel an order"""
    try:
        kite = get_kite()
        result = kite.cancel_order(order_id, variety=variety)
        return {"success": True, "result": result}
    except Exception as e:
        return {"success": False, "error": str(e)}