# ZUMMP.com — Complete Technical Information Sheet

> Last Updated: 2026-04-12
> Compiled by: Tiwari (AI Agent)

---

## 1. DOMAIN DETAILS

| Field | Value |
|---|---|
| Domain Name | zummp.com |
| Registrar | Hostinger |
| Registration Date | (Check Hostinger account) |
| Expiry Date | (Check Hostinger account) |
| Auto-Renew | ✅ Recommended: ON |

---

## 2. DNS MANAGEMENT — CLOUDFLARE

**Cloudflare Account Email:** arjun.raghav93@gmail.com

### Nameservers (set at Hostinger Registrar)
- `ns1.cloudflare.com`
- `ns2.cloudflare.com`

> ⚠️ These must be set at **Hostinger** (not in Cloudflare dashboard).
> Old nameservers were: `ns1.dns-parking.com`, `ns2.dns-parking.com`

### Cloudflare DNS Records

| Type | Name | Content | Proxy Status | Notes |
|---|---|---|---|---|
| A | @ | 139.59.65.82 | Proxied ☁️ | Main site |
| CNAME | www | zummp.com | Proxied ☁️ | WWW redirect |
| MX | @ | (Google Workspace MX) | DNS Only | Email routing |
| TXT | @ | Google verification | DNS Only | SPF record |

> Cloudflare API Key: stored at `/root/.cloudflare_env` on VPS (139.59.65.82)

### Cloudflare SSL Mode
- **Mode: Flexible**
- How it works: Visitor → HTTPS → Cloudflare → HTTP → VPS (port 80)
- ✅ No SSL cert needed on VPS origin
- ⚠️ With Flexible mode, Cloudflare to origin is HTTP (not end-to-end encryption)

> **Note:** "Full SSL" mode does NOT work because VPS has self-signed SSL → causes `ERR_SSL_VERSION_OR_CIPHER_MISMATCH`.

---

## 3. HOSTING — VPS DETAILS

| Field | Value |
|---|---|
| VPS Provider | (DigitalOcean/UPDATE THIS) |
| VPS Public IP | 139.59.65.82 |
| VPS OS | Ubuntu (Linux 6.8.0) |
| SSH Port | 22 |
| Control Panel | (UPDATE THIS) |

### VPS SSH Access
- **Host:** 139.59.65.82
- **Port:** 22
- **User:** root (or as configured)
- **Note:** Outbound SSH from this VPS to other servers may be blocked by firewall

---

## 4. WEBSITE — ZUMMP VORTEQ

**Website Name:** ZUMMP VORTEQ — Global Corporate Services
**URL:** https://www.zummp.com (or https://zummp.com/zummp/)

### Tech Stack
| Component | Technology |
|---|---|
| Framework | Next.js (SPA — Static Export) |
| Output Mode | Standalone / Static hybrid |
| Hosting | VPS + nginx |
| Assets Location | `/var/www/zummp/assets/` |
| Main HTML | `/var/www/zummp/index.html` |

### Directory Structure on VPS
```
/var/www/zummp/
├── index.html          ← Main HTML entry point
├── assets/             ← JS, CSS bundles (Next.js output)
│   ├── index-*.js
│   ├── vendor-*.js
│   └── index-*.css
├── favicon.svg
├── opengraph.jpg
└── (other static files)

/var/www/zummp-final/   ← Screenshots/screens assets
```

### URL Structure
| URL | Destination |
|---|---|
| https://zummp.com/ | 301 → https://zummp.com/zummp/ |
| https://zummp.com/zummp/ | ✅ Main website (Next.js SPA) |
| https://zummp.com/zummp/assets/ | Static assets (7-day cache) |
| https://www.zummp.com | Same as above (Cloudflare CNAME) |

### Sub-applications on same VPS

| URL | Service | Port | Description |
|---|---|---|---|
| /admin/ | customer-admin | 3012 | Customer admin panel |
| /superadmin/ | super-admin | 3013 | Super admin panel |
| /trading/ | trading app | 3005 | Trading platform |
| /api/ | letese-backend | 8001 | LETESE backend API |

---

## 5. NGINX CONFIGURATION

**Config File:** `/etc/nginx/sites-enabled/zummp-ssl`
**HTTP Config (old):** `/etc/nginx/sites-available/zummp.conf` (not in use)

### Key nginx settings:
- **HTTP → HTTPS redirect:** Yes (301 permanent)
- **HTTPS → /zummp/ redirect:** Yes (301 permanent)
- **Gzip compression:** ON (level 6, multiple types)
- **Static asset caching:** 7 days (`expires 7d`)
- **Proxy for sub-apps:** Admin panels → localhost ports
- **Max body size:** 50MB (for /api/)

### nginx Gzip Types Enabled:
```
text/plain, text/css, text/xml, text/javascript,
application/javascript, application/json, application/xml,
application/rss+xml, application/atom+xml, image/svg+xml
```

---

## 6. SSL CERTIFICATE — LET'S ENCRYPT

| Field | Value |
|---|---|
| Certificate Name | zummp.com-0001 |
| Domains | zummp.com, www.zummp.com |
| Key Type | ECDSA |
| Expiry Date | 2026-07-10 |
| Days Remaining | ~89 days |
| Serial Number | 56df2877c81208ce57d39a1cd380a86e1d0 |
| Certificate Path | `/etc/letsencrypt/live/zummp.com-0001/fullchain.pem` |
| Private Key Path | `/etc/letsencrypt/live/zummp.com-0001/privkey.pem` |
| SSL Protocols | TLSv1.2, TLSv1.3 |

### ⚠️ Renewal Issue
```
/etc/letsencrypt/renewal/zummp.com.conf
```
This renewal config is **INVALID** and needs to be fixed before July 10, 2026.

**To fix renewal:**
```bash
certbot --nginx -d zummp.com -d www.zummp.com
# OR
certbot certificates  # check status
```

### SSL Renewal Command
```bash
certbot renew --dry-run   # Test renewal
certbot renew             # Actual renewal (do before July 10)
```

---

## 7. PM2 — PROCESS MANAGEMENT

> PM2 was used previously. Currently services may not be running via PM2.

```bash
pm2 list                   # Check all processes
pm2 start <config.json>    # Restart with config
pm2 logs                   # View logs
pm2 restart all            # Restart all
pm2 stop all               # Stop all
```

### Expected Services (from previous setup):
| Service | Port | Description |
|---|---|---|
| customer-admin | 3012 | Admin panel |
| super-admin | 3013 | Super admin |
| letese-backend | 8001 | LETESE API |

---

## 8. PAGE LOAD BEHAVIOUR

- **First load:** 2-3 sec white/gray screen → content appears (NORMAL for Next.js SPA)
- **Default scroll position:** Fixed to top (scroll-to-top script added)
- **Caching:** Assets cached 7 days by nginx

---

## 9. COMMON TASKS

### Restart nginx
```bash
sudo nginx -t          # Test config
sudo systemctl reload nginx
sudo systemctl restart nginx
```

### Check if site is live
```bash
curl -I https://www.zummp.com
# Expected: HTTP/2 200 or 301 redirect
```

### Update Cloudflare DNS
```bash
# Using Cloudflare API
curl -X GET "https://api.cloudflare.com/client/v4/zones/<ZONE_ID>/dns_records" \
  -H "X-Auth-Email: arjun.raghav93@gmail.com" \
  -H "X-Auth-Key: <API_KEY>"
```

### Rebuild/Deploy Next.js site
```bash
cd /path/to/zummp/source
npm run build          # Build Next.js
# Copy output to /var/www/zummp/
# OR rebuild standalone output and symlink assets
```

---

## 10. IMPORTANT CONTACTS & CREDENTIALS

> ⚠️ Store real credentials securely. Do NOT share this file publicly.

| Service | Username | Password/Key | Notes |
|---|---|---|---|
| Cloudflare | arjun.raghav93@gmail.com | (API Key in cloudflare_env) | DNS management |
| Hostinger | arjun.raghav93@gmail.com | (Check email) | Domain registrar |
| VPS (139.59.65.82) | root | (Ask Arjun) | Server access |
| Cloudflare API | arjun.raghav93@gmail.com | (Get from cloudflare.com/profile) | For DNS automation |

---

## 11. KNOWN ISSUES / TODO

- [ ] **SSL Renewal Config Invalid:** Fix `/etc/letsencrypt/renewal/zummp.com.conf`
- [ ] **SSL Expiry:** Renew before July 10, 2026
- [ ] **Cloudflare Flexible SSL:** Origin sees all traffic as HTTP (not end-to-end HTTPS)
- [ ] **PM2 services:** Verify if still running after reboot

---

## 12. QUICK REFERENCE

```
Site URL:         https://www.zummp.com
VPS IP:           139.59.65.82
SSL Expiry:       July 10, 2026
SSL Renewal Cmd:  certbot renew
Cloudflare DNS:   ON (ns1/ns2.cloudflare.com)
nginx Config:     /etc/nginx/sites-enabled/zummp-ssl
Site Files:       /var/www/zummp/
Cloudflare Email:  arjun.raghav93@gmail.com
```
