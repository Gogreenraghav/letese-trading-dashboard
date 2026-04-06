#!/bin/bash
# Apply Kubernetes manifests for LETESE

set -e

echo "Applying LETESE Kubernetes manifests..."

# Apply namespace
kubectl apply -f infrastructure/k8s/namespace.yaml

# Apply all manifests recursively
kubectl apply -f infrastructure/k8s/ --recursive

echo "✓ K8s manifests applied"
echo ""
echo "Namespaces created:"
kubectl get namespaces | grep letese || true
echo ""
echo "Pods status:"
kubectl get pods -n letese 2>/dev/null || echo "  (run 'kubectl get pods -n letese' for status)"
