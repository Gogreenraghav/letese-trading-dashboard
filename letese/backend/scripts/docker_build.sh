#!/bin/bash
set -e
cd "$(dirname "$0")/.."

TAG=${1:-latest}
REGISTRY=${REGISTRY:-ghcr.io/$(git config user.name | tr '[:upper:]' '[:lower:]')}

echo "🔨 Building LETESE Docker images (tag: $TAG)"

echo "Building API image..."
docker build -t letese/api:$TAG -f backend/Dockerfile backend/
echo "✅ API image built"

echo "Building AIPOT image..."
docker build -t letese/aipot:$TAG -f backend/Dockerfile.aipot backend/
echo "✅ AIPOT image built"

echo "Building Landing page..."
docker build -t letese/landing:$TAG -f frontend/landing/Dockerfile frontend/landing/
echo "✅ Landing page built"

echo "🏷️ Tagging for registry..."
docker tag letese/api:$TAG $REGISTRY/letese/api:$TAG
docker tag letese/aipot:$TAG $REGISTRY/letese/aipot:$TAG
docker tag letese/landing:$TAG $REGISTRY/letese/landing:$TAG

echo "📤 Pushing to registry..."
docker push $REGISTRY/letese/api:$TAG || echo "⚠️ Registry push skipped (not logged in)"
docker push $REGISTRY/letese/aipot:$TAG || echo "⚠️ Registry push skipped"
docker push $REGISTRY/letese/landing:$TAG || echo "⚠️ Registry push skipped"

echo "✅ All images built and tagged"
docker images | grep letese
