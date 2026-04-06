#!/bin/bash
set -e
# LETESE Production Startup Sequence
# Run this on a fresh EKS cluster
#
# Usage: ./start_production.sh <LOAD_BALANCER_IP>
# Environment: KUBECONFIG, CF_API_TOKEN, CF_ZONE_ID, SLACK_WEBHOOK_URL

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LB_IP="${1:-}"

echo "🚀 LETESE Production Deployment"
echo "================================"

# 0. Validate prerequisites
echo "0. Validating prerequisites..."
command -v kubectl >/dev/null 2>&1 || { echo "ERROR: kubectl not found"; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "WARNING: jq not found — DNS output will be raw JSON"; }

if [[ -z "$LB_IP" ]]; then
  echo "ERROR: Usage: $0 <LOAD_BALANCER_IP>"
  exit 1
fi

# 1. Generate JWT keys
echo "1. Generating JWT keys..."
"$SCRIPT_DIR/generate_jwt_keys.sh"

# 2. Setup DNS
echo "2. Configuring Cloudflare DNS..."
if [[ -n "$CF_API_TOKEN" && -n "$CF_ZONE_ID" ]]; then
  "$PROJECT_ROOT/infrastructure/dns/cloudflare-dns-setup.sh" "$LB_IP"
else
  echo "   SKIPPED: CF_API_TOKEN or CF_ZONE_ID not set — run manually:"
  echo "   $PROJECT_ROOT/infrastructure/dns/cloudflare-dns-setup.sh $LB_IP"
fi

# 3. Setup namespace
echo "3. Creating Kubernetes namespace..."
kubectl apply -f "$PROJECT_ROOT/infrastructure/k8s/namespace.yaml"

# 4. Setup SSL — ClusterIssuer first (needed for Certificate + Ingress)
echo "4. Setting up SSL certificates (ClusterIssuer)..."
kubectl apply -f "$PROJECT_ROOT/infrastructure/ssl/cluster-issuer.yaml"
echo "   Waiting for ClusterIssuer to be ready..."
sleep 10
kubectl wait --for=condition=Ready \
  --timeout=60s \
  -n letese \
  issuer/letsencrypt-prod 2>/dev/null \
  || kubectl get clusterissuer letsencrypt-prod

# 5. Apply K8s manifests (includes Certificate + Ingress)
echo "5. Applying Kubernetes manifests..."
kubectl apply -f "$PROJECT_ROOT/infrastructure/k8s/ingress.yaml"

# 6. Wait for API to be ready
echo "6. Waiting for letese-api deployment..."
kubectl wait --for=condition=available \
  --timeout=180s \
  -n letese deployment/letese-api

# 7. Run database migrations
echo "7. Running Alembic migrations..."
kubectl exec -n letese deployment/letese-api -- \
  python -m alembic upgrade head

# 8. Seed demo data
echo "8. Seeding demo data..."
kubectl exec -n letese deployment/letese-api -- \
  python -c "from app.db.database import seed_database; import asyncio; asyncio.run(seed_database())" \
  || echo "   (seed_database not found — skipping)"

# 9. Verify health
echo "9. Running health check..."
kubectl exec -n letese deployment/letese-api -- \
  curl -s http://localhost:8000/health

echo ""
echo "✅ LETESE is live!"
echo "   API:      https://api.letese.xyz"
echo "   App:      https://app.letese.xyz"
echo "   Landing:  https://letese.xyz"
echo ""
echo "   ArgoCD:   https://argocd.letese.xyz"
echo "   Grafana:  https://grafana.letese.xyz"
