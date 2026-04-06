# LETESE — Admin Dashboards Master Design Prompt
## Sky Blue Theme | Same as Mobile App

---

## 📌 IMPORTANT INSTRUCTIONS FOR DESIGNER/AI TOOL

> **Logo Attachment:** Designer ko LETESE ka logo PNG format mein attach karna hai — **letese_logo.png**. Yeh logo har screen ke sidebar mein lagana hai. Logo style: Blue color "LETESE" ke letters ke saath — last "E" ke niche ek chhoti green dot.
>
> **Theme Match:** Yeh dashboard ka theme exactly SAME hai jo mobile app mein use hua hai. Same sky blue gradient, same colors, same cards, same style. Mobile app aur web dashboard ek jaisa look denge.
>
> **No Hard Borders:** Koi solid border lines nahi honi. Sirf color contrast aur shadow se separation dikhegi.
>
> **Browser Window:** Screens ko browser chrome mein dikhana hai — Google Chrome style URL bar ke saath.

---

## 🎨 SAME GLOBAL DESIGN RULES (Mobile App ke Jaisa)

### Colors (Exactly Same as Mobile App)
| Element | Color Code | Notes |
|---------|-----------|-------|
| Background Top | #819bff | Light sky blue |
| Background Bottom | #2b51c7 | Darker blue |
| Primary Blue | #2b51c7 | Logo, buttons, highlights |
| Green (dot/success) | #52f9a9 | Logo ki green dot, success |
| Card Background | #ffffff | White glass cards |
| Card Shadow | rgba(43,81,199,0.08) | Subtle blue tint |
| Text Primary | #2c2f33 | Dark navy |
| Text Secondary | #585c60 | Medium grey |
| Sidebar BG | #ffffff | White sidebar |
| Active Nav Item | #2b51c7 | Blue highlight |
| Red (live badge) | #b41340 | LIVE badge |

### Typography
| Element | Font | Weight | Size |
|---------|------|--------|------|
| Logo | Attached PNG | - | sidebar size |
| Page Title | Manrope | Extra Bold (800) | 28-32px |
| Section Heading | Manrope | Bold (700) | 20-22px |
| Card Title | Manrope | Bold (600) | 16-18px |
| Body Text | Inter | Regular (400) | 14px |
| Labels | Inter | SemiBold (600) | 12px |
| Table Text | Inter | Regular (400) | 13-14px |
| Caption | Inter | Regular (400) | 11-12px |

### Components (Same as Mobile App)
- **Cards:** White background, rounded corners (16-20px), subtle shadow with blue tint
- **Buttons:** Pill shape (full rounded), blue background (#2b51c7), white text
- **Chips/Badges:** Pill shape, colored background with text
- **Tables:** Clean rows, alternating subtle backgrounds, rounded
- **Sidebar:** White background, logo at top, navigation items
- **Top Bar:** White glass with blur

### Layout
- **Left Sidebar:** Fixed 240px width, white background
- **Main Content:** Sky blue gradient background
- **Content Area:** White cards on sky blue background
- **Browser Chrome:** Google Chrome style top bar with URL

---

## 🖥️ DASHBOARD 1 — SUPER ADMIN

### Browser Window
- Google Chrome style top bar
- URL bar showing: `admin.letese.ai`
- Three dots (Chrome menu) left
- Navigation arrows + refresh right
- Window controls: minimize, maximize, close

### Sidebar (Left, 240px, White)
**Top Section:**
- LETESE LOGO PNG (centered, 160px width)
- Below logo: small green dot indicator (subtle)
- Divider line below logo

**Navigation Items:**
| Icon | Label | Active? |
|------|-------|---------|
| 📊 | Dashboard | ✅ Active (blue bg) |
| 🏢 | Tenants / Companies | |
| 🔑 | API Vendors | |
| 👥 | All Users | |
| 📈 | System Health | |
| 🛡️ | Security & Logs | |
| 📧 | Notifications | |
| ⚙️ | Settings | |

**Bottom:**
- User avatar circle (small) with crown icon
- "Super Admin" label
- Online status green dot

### Top Bar
- "Super Admin Dashboard" — Manrope Bold, dark
- Right side: "All Systems Operational ✓" green badge
- Date/time rightmost
- White glass background with blur

### Main Content Area (Sky Blue Gradient Background)

#### ROW 1 — Stats Cards (4 Cards)
Each card: White glass, rounded, shadow
| Card | Number | Label | Icon |
|------|--------|-------|------|
| 🏢 | **247** | Active Tenants | Blue icon |
| 👥 | **12,480** | Total Users | Blue icon |
| ⚡ | **8.4M** | API Calls Today | Blue icon |
| 💰 | **₹4.2L** | Revenue Today | Green icon |

#### ROW 2 — Two Panels Side by Side

**LEFT PANEL — System Health (White Card, 60% width)**
- "System Health" header + refresh icon
- Status indicators (green/red dots):
  - API Server: 🟢 Online (98ms)
  - Database: 🟢 Online (12ms)
  - Kafka: 🟢 Running
  - AI Models: 🟢 Active
  - CDN: 🟢 Healthy
- Progress bars:
  - CPU: 34% (blue fill)
  - RAM: 58% (blue fill)
  - Disk: 42% (blue fill)
- "Last checked: 2 min ago" caption

**RIGHT PANEL — Recent Activity (White Card, 40% width)**
- "Recent Activity" header
- Live feed items:
  - "New tenant: Sharma Law Firm" — 2 min ago
  - "Payment received: ₹12,000" — 5 min ago
  - "New user: Priya Mehta" — 8 min ago
  - "API limit warning: Acme Corp" — 12 min ago
  - "System backup completed" — 15 min ago
- Blue scroll indicator

#### ROW 3 — Tenants Table (Full Width White Card)
- "All Tenants" header + "View All" link right
- Table columns:
  | Tenant | Plan | Users | Cases | Status | Revenue | Actions |
  |--------|------|-------|-------|--------|---------|---------|
  | Sharma Law Partners | Pro | 24 | 847 | 🟢 Active | ₹24K/mo | ⋮ |
  | Advocate Associates | Pro | 12 | 423 | 🟢 Active | ₹12K/mo | ⋮ |
  | Legal Eagles | Free | 5 | 89 | 🟡 Trial | ₹0 | ⋮ |
  | Justice First | Pro | 18 | 612 | 🟢 Active | ₹18K/mo | ⋮ |
- Blue gradient header row
- Pagination: < 1 2 3 ... 24 >
- "Export CSV" button top right

#### ROW 4 — Two Panels

**LEFT — API Vendors (White Card)**
- "API Vendors" header + "Add Vendor +" blue button
- Vendor cards:
  - **OpenAI** — 🟢 Status — 2.4M calls — ₹1.2L spent
  - **Anthropic** — 🟢 Status — 890K calls — ₹89K spent
  - **Razorpay** — 🟢 Status — Payment active
  - **WhatsApp** — 🟢 Status — Business API active

**RIGHT — Alerts (White Card)**
- "System Alerts" header + red badge "3"
- Alert items:
  - 🔴 "Storage at 78% — consider upgrade" — 1h ago
  - 🟡 "OpenAI rate limit approaching" — 2h ago
  - 🔴 "Failed login attempts: 12 in 1h" — 3h ago
- "View All Alerts →" link

---

## 🖥️ DASHBOARD 2 — CUSTOMER ADMIN (Law Firm)

### Browser Window
- Google Chrome style
- URL: `app.letese.ai`

### Sidebar (Left, 240px, White)
**Top Section:**
- LETESE LOGO PNG (centered)
- Below logo: "Sharma Law Partners" in small grey text
- Divider line

**Navigation Items:**
| Icon | Label | Active? |
|------|-------|---------|
| 📊 | Dashboard | ✅ Active |
| ⚖️ | Cases | |
| 👥 | Team Members | |
| 🤖 | AI & Drafts | |
| 💬 | Communications | |
| 📊 | Analytics | |
| 💳 | Billing & Payments | |
| 📱 | WhatsApp Hub | |
| 📋 | Reports | |
| ⚙️ | Settings | |

**Bottom:**
- User avatar with "Rajesh Sharma • Admin"
- ✏️ edit profile icon

### Top Bar
- "Welcome back, Rajesh" — Manrope Bold
- Notification bell 🔔 with red badge "5"
- "Quick Add +" blue button
- Current date right

### Main Content Area (Sky Blue Gradient)

#### ROW 1 — Stats Overview (4 Cards)
| ⚖️ | 👥 | 📅 | 💰 |
|---|---|---|---|
| **47** | **8** | **12** | **₹2.4L** |
| Active Cases | Team Members | Hearings This Week | Revenue This Month |
| Blue | Blue | Blue | Green |

#### ROW 2 — Two Panels

**LEFT (60%) — Cases Panel (White Card)**
- "Active Cases" header + "View All Cases →" link
- Mini case cards (4 items):
  | Status | Case | Court | Hearing |
  |-------|------|-------|---------|
  | 🔴 | S.C.Jain vs State | P&H HC | 30 Jul • 10:30 AM |
  | 🟡 | Mehta vs Union | Delhi HC | 02 Aug • 11:00 AM |
  | 🟢 | R.Singh vs Steel | SC | Order Reserved |
  | 🔴 | State vs Kumar | Dist. Court | 15 Aug • 2:00 PM |
- "+ Add New Case" blue button bottom

**RIGHT (40%) — Team Panel (White Card)**
- "Team Members" header + "Manage →" link
- Member list:
  - 🟢 Rajesh Sharma — Admin — Online
  - 🟢 Priya Mehta — Advocate — Online
  - 🟡 Amit Kumar — Paralegal — Away
  - ⚫ Sneha R — Intern — Offline
- Avatar circles with initials
- "Invite Member +" blue text button

#### ROW 3 — Two Panels

**LEFT — AI Drafts Panel (White Card)**
- "Recent AI Drafts" header
- Draft items:
  - "Reply to Section 5 Application" — SC-2024-00412 — AI ✓ — 10 min ago
  - "Viva Voce Arguments Draft" — WP-2024-1182 — AI ✓ — 1h ago
  - "Counter Affidavit" — CA-2023-8891 — Pending review — 2h ago
  - "LOC Reply Draft" — CRLP-2024-224 — AI ✓ — 3h ago
- "Open AI Assistant →" blue button

**RIGHT — Communications Hub (White Card)**
- "Communications" header + badge "5"
- Channel tabs: [WhatsApp] [Email] [SMS] [Voice]
- Message items:
  - "Rakesh Client" — "Case hearing confirmed" — Sent ✓ — 5m ago
  - "Mehta Properties" — "Documents received" — Delivered ✓ — 15m ago
  - "Advocate Singh" — "Invoice attached" — Read ✓ — 30m ago
- "Open WhatsApp Hub →" blue button

#### ROW 4 — Two Panels

**LEFT — Billing Summary (White Card)**
- "This Month Billing" header
- "Pro Plan — ₹2,000/month"
- Usage: "847 / 1000 cases used"
- Blue progress bar
- "₹2,000 due on 1st Aug" in red
- [Upgrade Plan →] blue button
- [View Invoice History →] text link

**RIGHT — Quick Analytics (White Card)**
- "Performance This Month" header
- Mini stats:
  - Cases Won: 12
  - Cases Lost: 3
  - Hearings Attended: 28
  - AI Drafts Generated: 47
  - Client Messages Sent: 156
- Mini bar chart
- "View Full Analytics →" link

#### ROW 5 — AIPOT Alerts (Full Width White Card)
- "⚡ AIPOT — Relevant Judgments Found" header + "View All →" link
- Alert cards inline:
  - 🏛️ SC | "Similar precedent for SC-2024-00412" — 20m ago
  - ⚖️ P&H HC | "New judgment: Kishore vs State — IPC 420" — 1h ago
  - 🏛️ SC | "Constitutional bench ruling relevant" — 3h ago
- "Open AIPOT Feed →" blue button

---

## 🖥️ DASHBOARD 3 — MARKETING LANDING PAGE (Optional)

### Browser Window
- Google Chrome
- URL: `letese.ai`

### Top Navigation (White Glass, Sticky)
- Left: LETESE LOGO PNG
- Center: Features | Pricing | Docs | Login
- Right: "Get Started Free" blue pill button

### Hero Section
- Sky blue gradient background
- Badge: "🚀 India's #1 Legal AI Platform"
- Headline: "LETESE — Advocate Suite"
- "वकीलों के लिए AI powered legal management"
- English: "AI-powered case management, drafting & court monitoring for Indian advocates"
- Two buttons: [Start Free Trial] blue | [Watch Demo] white outline
- Phone mockup showing app dashboard on right

### Features Section
4 cards in a row:
- ⚖️ Case Management — Manage all cases in one place
- 🤖 AI Drafting — Generate legal drafts in seconds
- ⚡ AIPOT Feed — Auto-tracked court judgments 24/7
- 💬 WhatsApp Alerts — Instant client communication

### Pricing Section
3 plan cards:
- Free — ₹0 — 50 cases, 1 user, basic AI
- Pro — ₹2,000/mo — Unlimited cases, 10 users, full AI (highlighted)
- Enterprise — Custom — Unlimited everything, dedicated support

### Testimonials
- Avatar circles with names
- "Best app for advocates" — Advocate Priya S., Delhi HC
- "Saved me 4 hours daily" — Advocate Rajesh M., P&H HC

### Footer
- LETESE logo
- "Powered by Lattice"
- Links and copyright

---

## 🔑 LOGO REFERENCE

**Logo file:** letese_logo.png (attach karna hai)

Appearance:
- "LETESE" blue color (#2b51c7) bold letters
- Last "E" ke niche green dot (#52f9a9) with glow
- Modern sans-serif font

Placement:
- Web dashboard sidebar: 160px width, centered
- Landing page: 120px width, left aligned

---

## ✅ FINAL DELIVERY CHECKLIST

- [ ] Super Admin Dashboard — web browser view, full screen
- [ ] Customer Admin Dashboard — web browser view, full screen
- [ ] (Optional) Marketing Landing Page
- [ ] All with SAME sky blue gradient background as mobile app
- [ ] LETESE logo PNG in sidebar of both dashboards
- [ ] White glass cards matching mobile app style
- [ ] No hard black borders
- [ ] Google Chrome browser chrome visible
- [ ] Consistent color palette throughout
- [ ] Premium, clean, professional look

---

## 📋 FILE DELIVERY FORMAT

Designer should deliver:
- PNG images for each dashboard (high resolution, 1920px wide)
- Optional: Figma file with all screens
- Original logo file: letese_logo.png (clearly labeled)
- Each dashboard as separate PNG file
