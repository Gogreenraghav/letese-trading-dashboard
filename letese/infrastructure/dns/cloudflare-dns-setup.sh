#!/bin/bash
# Cloudflare DNS setup for letese.xyz
# Run: ./cloudflare-dns-setup.sh

set -e

CF_API_TOKEN="${CF_API_TOKEN}"
ZONE_ID="${CF_ZONE_ID}"
LB_IP="${1:-<LOAD_BALANCER_IP>}"

if [[ "$CF_API_TOKEN" == "" || "$ZONE_ID" == "" ]]; then
  echo "ERROR: CF_API_TOKEN and ZONE_ID environment variables must be set."
  exit 1
fi

echo "Creating DNS records for letese.xyz (LB: $LB_IP)..."

# Root domain — proxied through Cloudflare
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{\"type\":\"A\",\"name\":\"letese.xyz\",\"content\":\"$LB_IP\",\"ttl\":300,\"proxied\":true}" \
  | jq -r '.result.id // .errors[0] | tostring' | xargs -I{} echo "  letese.xyz A -> {}"

# www — proxied
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{\"type\":\"A\",\"name\":\"www.letese.xyz\",\"content\":\"$LB_IP\",\"ttl\":300,\"proxied\":true}" \
  | jq -r '.result.id // .errors[0] | tostring' | xargs -I{} echo "  www.letese.xyz A -> {}"

# app — proxied
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{\"type\":\"A\",\"name\":\"app.letese.xyz\",\"content\":\"$LB_IP\",\"ttl\":300,\"proxied\":true}" \
  | jq -r '.result.id // .errors[0] | tostring' | xargs -I{} echo "  app.letese.xyz A -> {}"

# api — NOT proxied (direct to LB for SSL cert validation)
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{\"type\":\"A\",\"name\":\"api.letese.xyz\",\"content\":\"$LB_IP\",\"ttl\":300,\"proxied\":false}" \
  | jq -r '.result.id // .errors[0] | tostring' | xargs -I{} echo "  api.letese.xyz A -> {}"

echo ""
echo "✅ DNS records created for letese.xyz"
echo "   Verify at: https://dash.cloudflare.com/$ZONE_ID/dns"
