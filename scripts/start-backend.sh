#!/bin/bash
cd /root/clawd/trading-saas/backend
exec python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8002
