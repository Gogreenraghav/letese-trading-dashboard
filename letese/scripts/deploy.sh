#!/bin/bash
# Production deployment script for LETESE
# Deploys to AWS EKS with ArgoCD

set -e

ENV=${1:-staging}
TAG=${2:-latest}

echo "========================================="
echo "  LETESE Deployment — $ENV (tag: $TAG)"
echo "========================================="

# Validate inputs
if [[ ! "$ENV" =~ ^(staging|production)$ ]]; then
  echo "ERROR: ENV must be 'staging' or 'production'"
  exit 1
fi

echo "[1/6] Building Docker images..."

# Build Docker images
docker build -t letese/api:$TAG -f backend/Dockerfile backend/
docker build -t letese/aipot:$TAG -f backend/Dockerfile.aipot backend/
docker build -t letese/landing:$TAG -f frontend/landing/Dockerfile frontend/landing/

echo "[2/6] Tagging images for registry..."
# Push to registry
docker tag letese/api:$TAG $REGISTRY/letese/api:$TAG
docker tag letese/aipot:$TAG $REGISTRY/letese/aipot:$TAG
docker tag letese/landing:$TAG $REGISTRY/letese/landing:$TAG

echo "[3/6] Pushing images to registry..."
docker push $REGISTRY/letese/api:$TAG
docker push $REGISTRY/letese/aipot:$TAG
docker push $REGISTRY/letese/landing:$TAG

echo "[4/6] Updating ArgoCD app manifests..."
# Update image tag in kustomization files
sed -i "s|letese/api:.*|letese/api:${TAG}|" infrastructure/k8s/overlays/$ENV/kustomization.yaml
sed -i "s|letese/aipot:.*|letese/aipot:${TAG}|" infrastructure/k8s/overlays/$ENV/kustomization.yaml
sed -i "s|letese/landing:.*|letese/landing:${TAG}|" infrastructure/k8s/overlays/$ENV/kustomization.yaml

echo "[5/6] Syncing ArgoCD app..."
# Deploy with ArgoCD
argocd app sync letese-$ENV --revision $TAG
argocd app wait letese-$ENV --timeout 300

echo "[6/6] Running smoke tests..."
# Basic smoke test
sleep 5
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://letese.xyz/health || echo "000")
if [[ "$HTTP_CODE" == "200" ]]; then
  echo "✓ Landing page health check passed"
else
  echo "⚠ Landing page returned HTTP $HTTP_CODE — manual check recommended"
fi

echo ""
echo "========================================="
echo "✓ Deployment complete: $ENV (tag: $TAG)"
echo "  App: https://letese.xyz"
echo "  API: https://api.letese.xyz"
echo "========================================="
