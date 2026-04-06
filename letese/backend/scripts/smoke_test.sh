#!/bin/bash
set -e

API_URL=${1:-http://localhost:8000}

echo "🔍 Running smoke tests against $API_URL"

# Health
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/health)
if [ "$HTTP_CODE" = "200" ]; then echo "✅ Health check"; else echo "❌ Health check failed ($HTTP_CODE)"; fi

# Auth endpoint
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/api/v1/auth/send-otp)
if [ "$HTTP_CODE" = "422" ]; then echo "✅ Auth endpoint reachable"; else echo "⚠️ Auth endpoint: $HTTP_CODE"; fi

# Prometheus metrics
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/metrics)
if [ "$HTTP_CODE" = "200" ]; then echo "✅ Metrics endpoint"; else echo "⚠️ Metrics: $HTTP_CODE"; fi

echo "🏁 Smoke tests complete"
