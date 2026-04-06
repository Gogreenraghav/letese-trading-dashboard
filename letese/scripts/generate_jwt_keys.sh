#!/bin/bash
# Generate JWT RS256 key pair for LETESE
# Run this once during initial setup

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SECRETS_DIR="$SCRIPT_DIR/../backend/secrets"

echo "Generating JWT RS256 key pair..."
echo ""

mkdir -p "$SECRETS_DIR"

# Generate private key
openssl genrsa -out "$SECRETS_DIR/jwt_private.pem" 2048

# Extract public key from private key
openssl rsa -in "$SECRETS_DIR/jwt_private.pem" -pubout -out "$SECRETS_DIR/jwt_public.pem"

# Set restrictive permissions
chmod 600 "$SECRETS_DIR/jwt_private.pem"
chmod 644 "$SECRETS_DIR/jwt_public.pem"

echo "✓ JWT keys generated successfully!"
echo ""
echo "Files created:"
echo "  $SECRETS_DIR/jwt_private.pem  (keep secret — used by backend)"
echo "  $SECRETS_DIR/jwt_public.pem    (public — for token verification)"
echo ""
echo "IMPORTANT: Add backend/secrets/ to .gitignore before committing!"
echo ""
echo "Add to .gitignore:"
echo "  backend/secrets/"
echo ""
echo "Then set in your environment:"
echo "  JWT_PRIVATE_KEY_PATH=/path/to/backend/secrets/jwt_private.pem"
echo "  JWT_PUBLIC_KEY_PATH=/path/to/backend/secrets/jwt_public.pem"
