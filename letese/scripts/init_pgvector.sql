-- LETESE● pgvector + extensions init script
-- Runs after 01-schema.sql in Docker Compose init sequence
-- Safe to re-run — all statements are IF NOT EXISTS

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Grant to application user
GRANT ALL ON SCHEMA public TO letese_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO letese_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO letese_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO letese_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO letese_user;
