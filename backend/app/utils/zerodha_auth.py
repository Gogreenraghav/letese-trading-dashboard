"""
Zerodha Kite Connect Utilities
"""
import os

# Lazy import kiteconnect
try:
    from kiteconnect import KiteConnect
except ImportError:
    KiteConnect = None

ZERODHA_API_KEY = os.getenv("ZERODHA_API_KEY", "your_api_key")
ZERODHA_API_SECRET = os.getenv("ZERODHA_API_SECRET", "your_api_secret")

# Simulated Kite instance for demo
class MockKite:
    def __init__(self):
        self._instruments = []
    
    def ltp(self, symbols):
        """Return mock LTP data"""
        result = {}
        for sym in symbols:
            parts = sym.split(":")
            exchange = parts[0] if len(parts) > 0 else "NSE"
            symbol = parts[1] if len(parts) > 1 else sym
            base_prices = {"RELIANCE": 2800, "TCS": 3850, "INFY": 1480, "SBIN": 780, "HDFCBANK": 1680, "NIFTY50": 22350}
            base = base_prices.get(symbol, 1500)
            import random
            last = base + (random.random() - 0.5) * 20
            result[sym] = {
                "instrument_token": 12345,
                "exchange_token": 12345,
                "last_price": round(last, 2),
                "change": round((random.random() - 0.5) * 20, 2),
                "change_percent": round(((random.random() - 0.5) * 20 / base) * 100, 2),
            }
        return result
    
    def margins(self):
        return {
            "equity": {
                "net": {
                    "available": {
                        "cash": 50000,
                        "margins": {"equity": 50000},
                        "collateral": 0,
                        "enabled_ncdp": True,
                        "open_balance": 50000
                    }
                }
            },
            "commodity": {
                "net": {
                    "available": {
                        "cash": 25000,
                        "margins": {"commodity": 25000},
                        "collateral": 0,
                        "enabled_ncdp": True,
                        "open_balance": 25000
                    }
                }
            }
        }
    
    def positions(self):
        return {"day": [], "net": []}
    
    def holdings(self):
        return []
    
    def orders(self):
        return []
    
    def trades(self):
        return []
    
    def place_order(self, **kwargs):
        return f"demo_order_{hash(str(kwargs)) % 1000000}"
    
    def modify_order(self, **kwargs):
        return {"success": True}
    
    def cancel_order(self, order_id, variety):
        return {"success": True}
    
    def order_history(self, order_id):
        return []

_kite_instance = None

def get_kite():
    """Get Kite Connect instance"""
    global _kite_instance
    if _kite_instance is None:
        if KiteConnect and ZERODHA_API_KEY != "your_api_key":
            _kite_instance = KiteConnect(api_key=ZERODHA_API_KEY)
        else:
            _kite_instance = MockKite()
    return _kite_instance

def get_login_url():
    """Get Zerodha login URL for kite connect"""
    if KiteConnect:
        kite = KiteConnect(api_key=ZERODHA_API_KEY)
        return kite.login_url()
    return "#"

def set_access_token(token: str):
    """Set access token after login"""
    global _kite_instance
    if KiteConnect:
        kite = KiteConnect(api_key=ZERODHA_API_KEY)
        kite.set_access_token(token)
        _kite_instance = kite
    else:
        _kite_instance = MockKite()