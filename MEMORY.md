# MEMORY.md — Tiwari's Long-Term Memory

## Who I Am
- **Name:** Tiwari
- **Agent ID (Paperclip):** `680d5f2c-ca4d-4465-9732-03c08cf4eeba`
- **Organization:** Tiwari_Letese_CEO (Paperclip account)
- **Company ID:** `2d2da725-4260-431a-9153-7acafe443f10`
- **Task assigned:** Build LETESE Legal Practice Management SaaS — Full MVP
- **Paperclip API:** `https://paperclip-acq8.srv1539931.hstgr.cloud` (reachable nahi hai from this server)

## User
- **Name:** Arjun Singh
- **Telegram:** 8566322083
- **Timezone:** India (UTC+5:30 based on message timestamps)

## Current Project: LETESE● Legal SaaS
- **Blueprint:** `/root/clawd/letese/SYSTEM_MASTER_BLUEPRINT.md`
- **Repo:** `/root/clawd/letese/`
- **Stack:** Flutter (mobile), FastAPI (Python), PostgreSQL + pgvector, Kafka, Redis
- **Status:** MODULE A+B+C+D+G+H built (see letese/README.md)

## Key Technical Details
- Court codes: PHAHC (Punjab & Haryana HC), DHC, SC, NCDRC, CHD_DC, TIS_HAZ, SAKET
- Plans: basic (30 cases), professional, elite (AI drafting), enterprise
- Roles: super_admin, admin, advocate, clerk, paralegal, intern
- AIPOT agents: SCRAPER, COMPLIANCE, COMMUNICATOR, POLICE
- Kafka topics: letese.scraper.jobs, letese.diary.updates, letese.orders.new, letese.communications.dispatch, letese.police.heartbeats, letese.police.errors, letese.police.metrics, letese.build.status

## Paperclip Issue
- Issue ID: `255e42d2-c067-458f-9dac-af3276af896c`
- Assigned task: Build LETESE Legal SaaS Full MVP
- VPS public IP: 139.59.65.82 | Paperclip cloud IP: 187.127.139.147
- Paperclip API blocked: TCP connections to 187.127.139.147:443 from this VPS **always time out** — confirmed network-level firewall block
- No PostgreSQL/Docker on this VPS — cannot run Paperclip locally
- Gateway is "local" mode — Paperclip cloud cannot reach this gateway directly
- wake events arrive with `PAPERCLIP_API_URL=http://localhost:3100` but nothing on 3100
- Root fix: either open outbound 443 to Paperclip cloud, or deploy Paperclip adapter on a reachable host

## Lessons Learned
- Paperclip API unreachable from this VPS (port 443 blocked outbound to paperclip-acq8.srv1539931.hstgr.cloud)
- Git needed identity configured before commit
- docker not available on this server
