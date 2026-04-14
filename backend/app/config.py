import os
from datetime import timedelta

# Database
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./letese.db")

# JWT
SECRET_KEY = os.getenv("SECRET_KEY", "letese-super-secret-key-2026-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Razorpay
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_demo")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "demo_secret")
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET", "webhook_secret")

# Zerodha Kite Connect
ZERODHA_API_KEY = os.getenv("ZERODHA_API_KEY", "your_kite_api_key")
ZERODHA_API_SECRET = os.getenv("ZERODHA_API_SECRET", "your_kite_api_secret")
ZERODHA_REQUEST_TOKEN_URL = os.getenv("ZERODHA_REQUEST_TOKEN_URL", "https://api.kite.trade/token")
ZERODHA_SESSION_EXPIRY_HOURS = 24

# Admin
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "admin-secret-token-letese-2026")

# Paperclip
PAPERCLIP_API_URL = os.getenv("PAPERCLIP_API_URL", "https://paperclip-acq8.srv1539931.hstgr.cloud")
PAPERCLIP_ISSUE_ID = os.getenv("PAPERCLIP_ISSUE_ID", "255e42d2-c067-458f-9dac-af3276af896c")
PAPERCLIP_API_KEY = os.getenv("PAPERCLIP_API_KEY", "")

# App
APP_NAME = "LETESE Trading"
APP_VERSION = "1.0.0"