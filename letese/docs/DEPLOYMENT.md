# LETESE● Production Deployment Guide

## Prerequisites
- Ubuntu 24.04 LTS (recommended) or macOS (dev)
- Docker 25+ with docker compose plugin
- kubectl 1.30+
- AWS CLI configured
- Domain: letese.xyz + *.letese.xyz pointing to EKS

## Infrastructure Setup (AWS)

### 1. Create EKS Cluster
```bash
eksctl create cluster \
  --name letese-prod \
  --region ap-south-1 \
  --nodes 3 \
  --node-type t3.large \
  --managed
```

### 2. Install ArgoCD
```bash
kubectl apply -n argocd -f https://raw.githubusercontent.com/argocd/argocd/stable/notifications.yaml
```

### 3. Setup Secrets
```bash
kubectl create secret generic letese-secrets \
  --from-literal=DATABASE_URL="postgresql+asyncpg://..." \
  --from-file=jwt_private.pem=secrets/jwt_private.pem \
  --from-literal=OPENAI_API_KEY="sk-..." \
  ...
```

## Build & Deploy

```bash
# 1. Generate JWT keys
./scripts/generate_jwt_keys.sh

# 2. Build images
./backend/scripts/docker_build.sh v1.0.0

# 3. Apply Kubernetes manifests
./scripts/deploy_k8s.sh

# 4. Deploy with ArgoCD
./scripts/deploy.sh production v1.0.0
```

## Post-Deploy Checklist
- [ ] Health endpoint: `GET /health` → 200
- [ ] Prometheus metrics: `GET /metrics`
- [ ] Grafana dashboard accessible
- [ ] Kafka topics created
- [ ] Alembic migrations run
- [ ] Seed data loaded
- [ ] TLS certificate issued (Let's Encrypt)
- [ ] WhatsApp webhook verified
- [ ] Razorpay webhook verified
