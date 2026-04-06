# LETESE Mobile App — Master Design Prompt
## Sky Blue Theme | All Screens Detailed

---

## 📌 IMPORTANT INSTRUCTIONS FOR DESIGNER/AI TOOL

> **Logo Attachment:** Designer ko ek PNG format mein LETESE ka logo alag se attach karna hai. Yeh logo har screen ke header mein lagana hai. Logo ka style: Blue color ke letters "LETESE" ke saath — last letter "E" ke niche ek chhoti green dot hogi.
>
> **Background:** Har screen ka background SKY BLUE gradient hoga — light blue (top) se darker blue (bottom). Yeh fixed hai, change mat karna.
>
> **Koi bhi hard border lines nahi honi chahiyein.** Cards sirf color contrast aur shadow se alag dikhegi.

---

## 🎨 GLOBAL DESIGN RULES (Har Screen Mein Same)

### Colors
| Element | Color Code | Notes |
|---------|-----------|-------|
| Background Top | #819bff | Light sky blue |
| Background Bottom | #2b51c7 | Darker blue |
| Primary Blue | #2b51c7 | Logo, buttons, highlights |
| Green (dot/success) | #52f9a9 | Logo ki green dot, success states |
| Card Background | #ffffff | White glass cards |
| Card Shadow | rgba(43,81,199,0.08) | Subtle blue tint |
| Text Primary | #2c2f33 | Dark navy |
| Text Secondary | #585c60 | Medium grey |
| Text White | #ffffff | White text jab background dark ho |
| Red (live badge) | #b41340 | LIVE badge, urgent items |
| Border Radius Cards | 24px | Rounded corners |
| Border Radius Buttons | full (pill) | Round buttons |
| Border Radius Inputs | full (pill) | Round input fields |

### Typography
| Element | Font | Weight | Size |
|---------|------|--------|------|
| App Logo | Use attached logo PNG | - | header size |
| Page Title | Manrope | Extra Bold (800) | 24-28px |
| Card Heading | Manrope | Bold (700) | 18-20px |
| Body Text | Inter | Regular (400) | 14-15px |
| Labels | Inter | SemiBold (600) | 12px |
| Captions | Inter | Regular (400) | 11-12px |
| Button Text | Manrope | Bold (700) | 14px, ALL CAPS |

### Logo Placement (IMPORTANT)
- **Logo:** Har screen ke top-left corner mein lagana hai
- **Size:** Header mein 80-100px width
- **Logo File:** Designer ko "letese_logo.png" naam ki PNG file attach karni hai
- **Note:** Attached logo already LETESE name ke saath hai — sirf use karna hai

### Components
- **Cards:** White background, rounded corners (24px), subtle shadow with blue tint
- **Buttons:** Pill shape (full rounded), blue background (#2b51c7), white text
- **Input Fields:** White background, pill shape, blue border on focus
- **Chips/Badges:** Pill shape with colored background and text
- **Icons:** Material Symbols Outlined style
- **Bottom Nav:** White glass bar with 5 icons

---

## 📱 SCREEN 1 — LOGIN / ONBOARDING

### Background
Sky blue gradient from top (#819bff) to bottom (#2b51c7).

### Header Area
- Top navigation bar: white glass background with blur
- Left side: **LETESE LOGO** (attached PNG, approximately 80px width)
- Right side: Bell notification icon (white)
- Header background: white/70% opacity with blur effect

### Center Content
**Logo Section (Center, Upper-Middle):**
- LETESE logo PNG — centered, approximately 200-240px width
- "LETESE" name with green dot below last "E" (already in logo)
- "Advocate Suite" — white text below logo, Manrope Bold, 24px
- "वकीलों के लिए AI" — Hindi tagline, white text with slight transparency, 16px

**Form (Center, Below Logo):**
Email Input Field:
- White pill-shaped field
- Left icon: mail icon (blue #2b51c7)
- Placeholder: "advocate@letese.com" in grey
- Border: light blue on focus

Password Input Field:
- White pill-shaped field
- Left icon: lock icon (blue #2b51c7)
- Right icon: eye toggle icon
- Placeholder: "••••••••" in grey
- Border: light blue on focus

**LOGIN Button:**
- Full width blue button (#2b51c7)
- Pill shape, white text "LOGIN" in bold caps
- Shadow: blue glow effect below button
- Margin: 16px left and right

**Divider:**
- "or continue with" text in white/70% opacity
- Horizontal lines on both sides

**Google Login Button:**
- White/10% glass button with border
- Google logo icon
- "Continue with Google" text in white
- Pill shape

**Register Link:**
- "Don't have an account?" in white/70% opacity
- "Register" in blue (#2b51c7) text, bold

### Bottom
- Bottom navigation bar: white glass with 5 icons
- Icons: Home, Cases, AI, Chat, Profile
- Active: blue (#2b51c7), Inactive: grey

---

## 📱 SCREEN 2 — DASHBOARD / HOME

### Background
Sky blue gradient (#819bff → #2b51c7).

### Header App Bar
- White glass background with blur, fixed at top
- Left: **LETESE LOGO PNG** (80px width)
- Right: Notification bell icon with red dot badge

### Greeting Section
- "Namaste, Advocate 👋" — Manrope ExtraBold, 22px, dark navy
- Subtitle: "Supreme Court of India" in small caps, blue

### Status Chips Row
Three horizontal chips:
1. **🔴 Live: 12** — Red background tint, red text
2. **🟡 Pending: 7** — Blue background tint, blue text  
3. **🟢 Done: 43** — Green background tint, green text

Each chip: pill shape, icon + text, white background with colored tint

### Today's Hearing Card (HERO CARD)
White glass card, large, rounded corners (24px), blue left border (6px):
- **"Next Up • Court 4"** — caption in blue, small caps
- **"State of Maharashtra vs. K. Deshmukh"** — case title, Manrope Bold, 20px
- **"11:30 AM"** — time badge, blue pill shape, top right
- **Progress bar:** Blue fill 68%, grey track, rounded
- **"Preparation Progress"** label + "68%" value
- **"Briefing Docs"** button — blue pill
- **"View Details →"** text link in blue

### Quick Actions Section
Label: "Quick Intelligence" in small caps, grey
2x2 Grid of icon cards:
- **📝 New Case** — blue tinted circle icon
- **🤖 AI Draft** — green tinted circle icon
- **🔍 Search** — teal tinted circle icon
- **📋 Tasks** — purple tinted circle icon

Each card: white glass, icon above label, rounded corners

### AIPOT Live Feed Section
- **"⚡ AIPOT Live Feed"** — header with bolt icon, blue
- **"● LIVE"** badge — red pill, pulsing animation feel

Three mini judgment cards (stacked):
Each card: white glass, court icon, judgment title, court name, time
1. "Landmark Ruling on Digital Privacy Rights 2024" — High Court Judgement
2. "Amendment to Corporate Insolvency Code" — Supreme Court Alert
3. "Revision of Tenant Protection Act Clauses" — Civil Law Update

### Stats Graphic (Optional)
Blue gradient card with mini bar chart showing performance

### Bottom Navigation
White glass bar, 5 icons:
🏠 Home (active, blue) | 📁 Cases | 🤖 AI | 💬 Chat | 👤 Profile

---

## 📱 SCREEN 3 — MY CASES / CASE LIST

### Header
- **LETESE LOGO PNG** left
- "My Cases" title center-right, Manrope Bold
- Search icon + Menu icon right

### Search Bar
White pill-shaped search field:
- Search icon left (blue)
- Placeholder: "Search case, party or number..."
- Full width, below header

### Filter Chips
Horizontal scrollable chips:
- [All ✓] — blue active chip
- [Supreme Court]
- [High Court]
- [Tribunal]
- [District]

### Case Cards (List)

**Card 1 — ACTIVE (Blue left border)**
- 🔴 "ACTIVE" badge (red pill)
- "State of Maharashtra vs. K. Deshmukh"
- Case number: SC-2024-00412
- Court: ⚖️ P&H High Court | IPC 420
- Hearing: 📅 30 Jul 2024 · 10:30 AM
- Progress bar: Blue fill 68%
- Chevron right icon

**Card 2 — PENDING (Yellow left border)**
- 🟡 "PENDING" badge (yellow pill)
- "Mehta Properties vs Union of India"
- Case number: WP-2024-1182
- Court: ⚖️ Delhi High Court | Article 226
- Hearing: 📅 02 Aug 2024
- Progress bar: Yellow fill 35%
- Chevron right icon

**Card 3 — RESOLVED (Green left border)**
- 🟢 "RESOLVED" badge (green pill)
- "Advocate R.Singh vs Steel Corp"
- Case number: CA-2023-8891
- Court: 🏛️ Supreme Court | Civil Appeal
- Status: "✓ Order Reserved"
- Progress bar: Green fill 100%

### FAB Button
- Blue circle with "+" icon
- Fixed bottom right
- Shadow with blue glow

### Bottom Navigation
🏠 | 📁 Cases (active, blue) | 🤖 | 💬 | 👤

---

## 📱 SCREEN 4 — CASE DETAIL + AI CHAT

### Header
- Back arrow ← left
- Case number "SC-2024-00412" in Manrope Bold
- Case title below in grey
- Menu ⋮ icon right

### Info Strip (Below Header)
Horizontal pills/chips:
📂 IPC 420 | ⚖️ P&H HC | 📅 Jul 2024 | 💰 ₹50K

### Case Timeline (Left Side)
Vertical timeline with dots and lines:
- 15 Jun — Case Filed ✓ (blue filled dot, blue line)
- 28 Jun — First Hearing ✓ (blue filled dot, blue line)
- 10 Jul — Arguments ● (yellow filled dot, current)
- 30 Jul — Next Hearing ○ (grey outline dot, future)

### Chat Area (Right of Timeline)

**User Message Bubble (Blue, Right Aligned):**
- Blue background (#2b51c7)
- White text
- Rounded corners (left side more rounded)
- Message: "Draft a reply to the opposite party's application filed on 15th July under Section 5 of the Limitation Act..."

**AI Response Bubble (White Glass, Left Aligned):**
- White glass card with shadow
- 🤖 "Letese AI" label in blue
- Divider line
- Legal draft content in structured format:
  ```
  IN THE HIGH COURT OF PUNJAB & HARYANA
  Case No: SC-2024-00412
  
  I, Advocate Rajesh Sharma, appearing for
  the applicant, most respectfully state:
  
  1. That the application filed by the
  respondent under Section 5 of the
  Limitation Act deserves to be dismissed...
  ```
- 3 animated blue dots below (typing indicator)

### Input Area (Bottom)
- Dark/glass input bar at bottom
- Pill-shaped text input: "Ask or draft something..."
- 🎤 mic icon left
- ➤ send button right (blue circle)

### Bottom Navigation
🏠 | 📁 | 🤖 | 💬 Chat (active, blue) | 👤

---

## 📱 SCREEN 5 — AIPOT LIVE FEED

### Header
- **"⚡ AIPOT Live Feed"** — large Manrope Bold, white or dark
- Subtitle: "Auto-scraped judgments from Indian courts"
- **"● LIVE"** badge — red pill, pulsing effect, top right

### Stats Row (3 Cards)
Each card: white glass, large blue number, grey label
- **1,24,680** Judgments
- **847** Today
- **42** This Hour

### Filter Chips
[All ✓] [Supreme Court] [High Court] [Tribunal]

### Judgment Cards (5 Cards Stacked)

**Card 1 — 🏛️ SUPREME COURT**
- Blue left border accent
- "🏛️ SUPREME COURT" badge (blue)
- "CA 2345/2024" — case number in bold
- "M/s XYZ Ltd vs ABC Corp" — parties
- "Constitutional validity of..." — subject line
- "IPC + Arbitration" and "30 Jul" — metadata
- 🔖 bookmark icon top right

**Card 2 — ⚖️ P&H HIGH COURT**
- Blue left border accent
- "⚖️ P&H HIGH COURT" badge
- "CR 4891/2024"
- "Kishore Lal vs State"
- "IPC 420, 467, 471"
- "30 Jul"
- 🔖 bookmark

**Card 3 — ⚖️ DELHI HIGH COURT**
- "⚖️ DELHI HIGH COURT" badge
- "WP(C) 1842/2024"
- "Advocate Ram Singh vs Union of India"
- "Article 226, Service Law"
- "29 Jul"
- 🔖 bookmark

**Card 4 — 🏛️ SUPREME COURT**
- Similar structure
- "SLP 11880/2024"
- "State of UP vs Federation"
- "Land Acquisition Act"
- "29 Jul"

**Card 5 — ⚖️ BOMBAY HIGH COURT**
- "ARB.A. 203/2024"
- "Smith Realty vs Metro Corp"
- "Arbitration Act s.11"
- "28 Jul"

### Bottom Navigation
🏠 | 📁 | 🤖 | 💬 | 👤

---

## 📱 SCREEN 6 — PROFILE & SETTINGS

### Profile Header Section
- Elevated/gradient background area (slightly different shade)
- Large circular avatar circle
  - Initials "AS" inside in blue
  - Blue ring/glow around avatar
  - Small green dot near avatar (edit indicator)
- **"Arjun Singh"** — large name, Manrope Bold
- **"Advocate • Enrolled 2018"** — grey subtitle
- **"PB-2018-49271"** — enrollment number, small

### Stats Row (4 Cards)
White glass cards in a row:
- **247** — Cases
- **1,200** — Hearings
- **98%** — Win Rate (green text)
- **₹48L** — Revenue (green text)

### Settings Menu (8 Items)
White glass card list, stacked vertically:

| Icon | Label | Subtitle | Arrow |
|------|-------|---------|-------|
| ⚙️ | Settings | App preferences, notifications | → |
| 🔒 | Security | Password, 2FA, PIN | → |
| 💳 | Billing | Plan: Pro • Renewal: Dec 2024 | → |
| 👥 | Team | 3 members • Manage RBAC | → |
| 📱 | Linked Accounts | Google, WhatsApp Business | → |
| 📊 | Analytics | Usage & performance | → |
| 🆘 | Help & Support | FAQ, Chat with us | → |
| 📤 | Logout | (red text, no arrow) | — |

### Bottom Navigation
🏠 | 📁 | 🤖 | 💬 | 👤 Profile (active, blue)

---

## 📱 SCREEN 7 — APP INTRO / HERO VIDEO SCREEN

### Layout
Mobile phone floating in space, phone screen shows app content

### Phone Frame
- Dark bezel modern smartphone (iPhone style)
- Screen: sky blue gradient background
- Phone: subtle 3D rotation, floating effect
- Blue particle effects in background

### Screen Content (On Phone)
Everything from Dashboard screen (Screen 2) but with:
- LETESE LOGO PNG centered at top
- "Advocate Suite" tagline
- "वकीलों के लिए AI" Hindi tagline
- Case information visible
- Quick action cards visible
- Bottom nav visible
- Everything premium and polished

### Background (Around Phone)
- Dark space with subtle blue glow
- Floating particles
- Ambient light effects

### Animation (for video)
- Phone slowly zooms in
- Cards fade in one by one
- Logo pulses subtly
- Duration: 10-15 seconds loop

---

## 🔑 LOGO REFERENCE

The designer will attach this logo file: **letese_logo.png**

Logo appearance:
- Word "LETESE" in blue color (#2b51c7)
- Bold, modern sans-serif font
- Last letter "E" ke niche ek chhoti green dot (#52f9a9)
- Green dot has subtle glow
- This is the LETESE brand mark

---

## ✅ FINAL CHECKLIST FOR DESIGNER

Before delivering, confirm:
- [ ] Sky blue gradient background on ALL screens
- [ ] LETESE logo PNG placed on every screen header
- [ ] No hard black/white border lines
- [ ] White glass cards with subtle shadows
- [ ] Bottom navigation bar on ALL screens
- [ ] Consistent color palette used throughout
- [ ] Mobile phone proportions (9:16 ratio)
- [ ] All fonts: Manrope for headings, Inter for body
- [ ] All border radius: 24px for cards, pill for buttons
- [ ] Premium, clean, professional look
- [ ] All 7 screens delivered

---

## 📋 FILE DELIVERY FORMAT

Designer should deliver:
- PNG images for each screen (high resolution, 2x)
- Optional: Figma file with all screens
- Optional: HTML/CSS code (if generated)
- Original logo file (letese_logo.png) clearly labeled
