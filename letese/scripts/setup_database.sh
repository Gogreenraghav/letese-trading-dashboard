#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# LETESE● Database Setup Script
# MODULE A: Database — Day 1
# Sets up PostgreSQL 16 + pgvector, creates user/db, runs migrations,
# and seeds demo data.
# Works on Ubuntu 24.04 LTS.
# ═══════════════════════════════════════════════════════════════════
set -euo pipefail

# ── Colours ────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

log_info()  { echo -e "${CYAN}[INFO]${RESET}  $*"; }
log_ok()    { echo -e "${GREEN}[ OK ]${RESET}  $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${RESET}  $*"; }
log_error() { echo -e "${RED}[ERR ]${RESET}  $*" >&2; }
section()   { echo -e "\n${BOLD}── $*
${RESET}"; }

# ── Config (override via env) ──────────────────────────────────────
DB_USER="${DB_USER:-letese_user}"
DB_PASS="${DB_PASS:-letese_pass}"
DB_NAME="${DB_NAME:-letese_prod}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
PG_VERSION="${PG_VERSION:-16}"
Alembic_DIR="${Alembic_DIR:-$PWD/backend/app/db}"
BACKEND_DIR="${BACKEND_DIR:-$PWD/backend}"

# ── Detect environment ─────────────────────────────────────────────
if command -v docker &>/dev/null && docker info &>/dev/null; then
  RUN_VIA_DOCKER=1
  log_info "Docker detected — will run PostgreSQL via docker-compose"
elif systemctl list-units --type=service | grep -q "postgresql"; then
  RUN_VIA_SYSTEMD=1
  log_info "PostgreSQL service detected via systemd"
else
  log_warn "Neither Docker nor systemd PostgreSQL found — assuming external Postgres"
fi

# ── 1. Bootstrap PostgreSQL (if using Docker) ──────────────────────
bootstrap_docker() {
  section "Bootstrapping PostgreSQL via Docker"

  # Stop any existing container with this name
  docker compose -f "$PWD/docker-compose.yml" down --remove-orphans 2>/dev/null || true

  log_info "Starting PostgreSQL 16 + pgvector container..."
  docker compose -f "$PWD/docker-compose.yml" up -d postgres

  # Wait for postgres to be ready
  local retries=30
  while ! docker exec letese-postgres-1 \
    pg_isready -U "$DB_USER" -h localhost &>/dev/null; do
    ((retries--))
    if ((retries <= 0)); then
      log_error "PostgreSQL failed to start after 30 retries"
      exit 1
    fi
    sleep 2
  done
  log_ok "PostgreSQL is ready"
}

# ── 2. Install PostgreSQL via apt (system install) ─────────────────
install_postgres_apt() {
  section "Installing PostgreSQL $PG_VERSION via APT"

  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get install -y -qq \
    postgresql-"$PG_VERSION" \
    postgresql-client-"$PG_VERSION" \
    postgresql-contrib-"$PG_VERSION" \
    curl \
    gnupg2 \
    ca-certificates \
    python3 python3-pip python3-venv \
    2>&1 | tail -3

  # Start service
  systemctl enable postgresql --quiet 2>/dev/null || true
  systemctl start postgresql || true
  sleep 3
  log_ok "PostgreSQL installed and started"
}

# ── 3. Create user + database ───────────────────────────────────────
create_user_and_db() {
  section "Creating PostgreSQL user and database"

  if [[ "$DB_HOST" == "localhost" || "$DB_HOST" == "127.0.0.1" ]]; then
    # System Postgres (socket auth)
    PG_CMD="sudo -u postgres psql"
  else
    PG_CMD="psql -h '$DB_HOST' -p '$DB_PORT' -U postgres"
  fi

  # Create user
  $PG_CMD -c "DO \$\$
  BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER') THEN
      CREATE USER $DB_USER WITH PASSWORD '$DB_PASS' SUPERUSER CREATEDB;
      RAISE NOTICE 'User $DB_USER created';
    ELSE
      RAISE NOTICE 'User $DB_USER already exists — skipping';
    END IF;
  END
  \$\$;" 2>/dev/null || true

  # Create database owned by user
  $PG_CMD -c "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | \
    grep -q 1 || \
    $PG_CMD -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || true

  log_ok "Database '$DB_NAME' ready for user '$DB_USER'"
}

# ── 4. Enable pgvector extension ───────────────────────────────────
enable_pgvector() {
  section "Enabling pgvector extension"
  if [[ "$DB_HOST" == "localhost" || "$DB_HOST" == "127.0.0.1" ]]; then
    PG_CMD="sudo -u postgres psql -d '$DB_NAME'"
  else
    PG_CMD="psql -h '$DB_HOST' -p '$DB_PORT' -U '$DB_USER' -d '$DB_NAME'"
  fi

  $PG_CMD <<'EOF'
    -- Extensions (ignore errors if already exist)
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";
    CREATE EXTENSION IF NOT EXISTS "vector";
    CREATE EXTENSION IF NOT EXISTS "btree_gin";
    -- Verify pgvector
    SELECT extversion FROM pg_extension WHERE extname = 'vector';
EOF
  log_ok "pgvector and extensions enabled"
}

# ── 5. Run Alembic migrations ──────────────────────────────────────
run_migrations() {
  section "Running Alembic migrations"

  cd "$BACKEND_DIR"

  # Setup Python venv if needed
  if [[ ! -d .venv ]]; then
    log_info "Creating Python venv..."
    python3 -m venv .venv
  fi
  source .venv/bin/activate

  # Install alembic + asyncpg
  pip install --quiet alembic asyncpg sqlalchemy[asyncio] 2>&1 | tail -1

  # Set DATABASE_URL
  export DATABASE_URL="postgresql+asyncpg://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

  # Run initial migration
  if [[ -f "app/db/alembic.ini" ]]; then
    alembic upgrade head 2>&1 | sed 's/^/  /'
    log_ok "Alembic migrations complete"
  else
    log_warn "alembic.ini not found — skipping Alembic (schema may already exist)"
  fi
}

# ── 6. Seed demo data ──────────────────────────────────────────────
seed_data() {
  section "Seeding demo data"

  cd "$BACKEND_DIR"

  if [[ -f .venv/bin/activate ]]; then
    source .venv/bin/activate
  fi

  export DATABASE_URL="postgresql+asyncpg://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

  python3 -c "
import asyncio
from app.db.database import seed_database, engine
import app.db.seed_data  # ensure loaded

async def main():
    result = await seed_database()
    print()
    print('=== Seed Summary ===')
    print(f\"  Tenant  : {result['tenant_name']} ({result['tenant_id']})\")
    print(f\"  Users   : {len(result['users'])}\")
    for u in result['users']:
        print(f\"           - {u['email']} [{u['role']}]\")
    print(f\"  Cases   : {len(result['cases'])}\")
    for c in result['cases']:
        print(f\"           - {c['case_number']} ({c['case_id']})\")
    print(f\"  Checklists: {result['checklists_inserted']}\")
    await engine.dispose()

asyncio.run(main())
" 2>&1 | sed 's/^/  /'

  log_ok "Seed data inserted"
}

# ── 7. Quick sanity check ──────────────────────────────────────────
sanity_check() {
  section "Sanity check"
  if [[ "$DB_HOST" == "localhost" || "$DB_HOST" == "127.0.0.1" ]]; then
    PG_CMD="sudo -u postgres psql -d '$DB_NAME'"
  else
    PG_CMD="psql -h '$DB_HOST' -p '$DB_PORT' -U '$DB_USER' -d '$DB_NAME'"
  fi

  TABLES=$($PG_CMD -t -c "
    SELECT COUNT(*) FROM pg_tables
    WHERE schemaname = 'public' AND tablename NOT LIKE 'pg_%'
          AND tablename NOT LIKE 'sql_%';
  " 2>/dev/null | tr -d ' ')
  log_ok "Database has $TABLES public tables"

  echo -e "\n${BOLD}Demo credentials:${RESET}"
  echo -e "  Tenant  : ${GREEN}demo@sharma-associates.in${RESET}"
  echo -e "  Admin   : ${GREEN}rajesh@sharma-associates.in${RESET}  (role=admin)"
  echo -e "  Advocate: ${GREEN}priya@sharma-associates.in${RESET} (role=advocate)"
}

# ─────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────
section "LETESE● Database Setup — Day 1"

if [[ "${RUN_VIA_DOCKER:-0}" == "1" ]]; then
  bootstrap_docker
elif [[ "${RUN_VIA_SYSTEMD:-0}" == "1" ]]; then
  install_postgres_apt
else
  log_info "Skipping Postgres bootstrap — assuming external instance"
fi

create_user_and_db
enable_pgvector
run_migrations
seed_data
sanity_check

section "✅ LETESE● Database Setup Complete"
echo -e "Next steps:"
echo -e "  ${CYAN}cd backend && source .venv/bin/activate && uvicorn app.main:app --reload${RESET}"
echo -e "  ${CYAN}cd backend && alembic upgrade head${RESET}   # future migrations"
