# LETESE Mobile App — Designer Prompts
## (AI Image Generation Prompts for Each Screen)

---

## 🎨 Global Design Rules (Sab Screens Mein Same)

### Logo
- Brand name: **"LETESE"**
- Font: Bold, modern, sans-serif (like Poppins ya Inter Black)
- Color: Electric Blue (#5072E8)
- Special: Letter "A" ke niche ek chhoti green dot — yeh Lattice ka logo hai
- Green dot = (#00D084) — LETESE ka brand mark

### Background Theme
- Har screen ka background: Indian court atmosphere
- **Option A:** Supreme Court of India building — grand marble columns, golden dome
- **Option B:** High Court — high ceiling, wooden benches, legal atmosphere
- **Option C:** Modern law chamber — books, table lamp, legal files
- Background should be dark tinted (40% dark overlay) so UI elements pop

### Color Palette
| Element | Color |
|---------|-------|
| Background overlay | #0D0D14 (deep navy) |
| Primary accent | #5072E8 (electric blue) |
| Logo letter | #5072E8 |
| Logo A ki dot | #00D084 (green) |
| Cards | #16161F with 80% opacity |
| Text primary | #FFFFFF |
| Text secondary | #8B92A8 |
| Success/Active | #00D084 |
| Live badge | #FF4444 |

### UI Style
- Dark glass-morphism cards (blur effect, dark fill)
- Rounded corners: 16px
- Bottom navigation bar
- Chat bubble style for AI interactions
- Status chips: Live 🔴 Pending 🟡 Done 🟢

---

## 📱 SCREEN WISE PROMPTS

---

### SCREEN 1 — LOGIN / ONBOARDING
**Image Prompt:**
```
Dark premium mobile app login screen for Indian legal tech app.
Background: Supreme Court of India exterior at night, golden lights
on marble dome, pillars illuminated, deep blue night sky, subtle fog.
Dark overlay 50% on background.

Center of screen: LETESE logo — word "LETESE" in bold electric blue
color (#5072E8), modern sans-serif font. Below letter 'A' in LETESE,
a small bright green dot (#00D084). The word 'LETESE' has subtle glow.

Below logo in white: "Advocate Suite"
Below in smaller Hindi text: "वकीलों के लिए AI"

Login form below:
- Dark glass card with blur effect
- Email input field with placeholder text
- Password input field with dots
- Blue rounded "Login" button
- "or continue with Google" white text button
- Bottom: "Don't have account? Register" in muted text

Dark navy background, premium legal tech aesthetic.
Mobile phone frame mockup style. 4K, ultra premium.
```

**UI Elements Required:**
- [ ] LETESE logo with green dot
- [ ] "Advocate Suite" tagline
- [ ] Hindi tagline "वकीलों के लिए AI"
- [ ] Email input field
- [ ] Password input field
- [ ] Blue Login button
- [ ] Google login option
- [ ] Register link
- [ ] Supreme Court background

---

### SCREEN 2 — DASHBOARD / HOME
**Image Prompt:**
```
Dark mobile app dashboard for Indian legal tech app.
Background: Grand Indian High Court interior — tall marble pillars,
golden light fixtures, wooden benches, legal atmosphere.
Dark overlay 60% so UI is clearly readable.

Top of screen (dark bar):
- Left: "Namaste, Advocate 👋" in white
- Right: Notification bell icon

Below: Status chips row (dark glass pills):
  [🔴 Live: 12] [🟡 Pending: 7] [🟢 Done: 43]

Today's Hearing Card (glass card with blue left border):
  - "📅 Today's Hearing" header in white bold
  - Case: "S.C.Jain vs State of Punjab"
  - Case No: SC-2024-00412
  - Time: 10:30 AM — P&H High Court
  - Progress bar: blue fill 68%
  - "Case Progress: 68%" in muted text

Quick Actions Grid (2x2 dark glass cards):
  - 📝 New Case — blue circle icon
  - 🤖 AI Draft — purple circle icon
  - 🔍 Search — teal circle icon
  - 📋 Tasks — orange circle icon

AIPOT Live Feed section:
  - "⚡ AIPOT Live Feed" header + RED "● LIVE" badge
  - 3 mini judgment cards:
    - P&H HC | Rakesh Kumar vs State | IPC 420 | 10:22 AM
    - Delhi HC | Mehta vs Union | Article 226 | 10:05 AM
    - SC | State vs Confederation | Civil Appeal | 09:48 AM

Bottom Navigation (dark bar):
  🏠 Home | 📁 Cases | 🤖 AI | 💬 Chat | 👤 Profile

LETESE logo top-left watermark, small, blue.
Dark premium legal tech aesthetic.
```

**UI Elements Required:**
- [ ] Greeting bar
- [ ] Notification bell
- [ ] Status chips (3)
- [ ] Today's hearing card
- [ ] Case progress bar
- [ ] Quick actions 2x2 grid
- [ ] AIPOT live feed section
- [ ] Bottom navigation bar
- [ ] Court background

---

### SCREEN 3 — CASE LIST / CASES TAB
**Image Prompt:**
```
Dark mobile app case list screen for Indian legal tech app.
Background: Indian law library — tall shelves with law books,
leather-bound volumes, warm lamp light, dark overlay 55%.
Premium legal atmosphere.

Top bar (dark glass):
  - Back arrow ←
  - Title: "My Cases" in white bold
  - Search icon 🔍
  - Filter icon ≡

Search bar below: dark glass pill with search icon

Filter chips (horizontal scroll):
  [All] [Supreme Court] [High Court] [Tribunal] [District]

Case Cards List (dark glass cards, each with colored left border):

Card 1 (blue border — Active):
  - 🔴 ACTIVE badge
  - Case: "S.C.Jain vs State of Punjab"
  - No: SC-2024-00412
  - Court: ⚖️ P&H High Court | IPC 420
  - Next Hearing: 📅 30 Jul 2024 — 10:30 AM
  - Opposite Party: State of Punjab
  - Progress: 68%

Card 2 (yellow border — Pending):
  - 🟡 PENDING badge
  - Case: "Mehta Properties vs Union of India"
  - No: WP-2024-1182
  - Court: ⚖️ Delhi HC | Article 226
  - Next Hearing: 📅 02 Aug 2024
  - Progress: 35%

Card 3 (green border — Resolved):
  - 🟢 RESOLVED badge
  - Case: "Advocate R. Singh vs Steel Corp"
  - No: CA-2023-8891
  - Court: 🏛️ Supreme Court
  - Status: Order reserved
  - Progress: 100%

Floating Action Button (bottom right, blue circle with + icon)

Bottom Navigation: 🏠 | 📁 | 🤖 | 💬 | 👤

LETESE logo small watermark top-right.
```

**UI Elements Required:**
- [ ] Top bar with title + search + filter
- [ ] Search bar
- [ ] Filter chips (scrollable)
- [ ] 3 case cards with different status colors
- [ ] FAB (add new case button)
- [ ] Bottom navigation
- [ ] Library/court background

---

### SCREEN 4 — CASE DETAIL + AI CHAT
**Image Prompt:**
```
Dark mobile app: case detail with AI chat for Indian legal tech app.
Background: Supreme Court of India — night view, golden dome glowing,
marble lit up, dramatic sky, dark overlay 50%.

Top bar (dark glass):
  - ← back button
  - Case number: "SC-2024-00412" bold white
  - Case title below: "Rakesh Kumar vs State of Punjab"
  - ⋮ more menu icon top right

Info strip (dark glass, horizontal):
  📂 IPC 420 | ⚖️ P&H HC | 📅 Jul 2024 | 💰 ₹50K

Case Timeline (vertical):
  - Date circles connected by blue line
  - 15 Jun: Case Filed — blue dot
  - 28 Jun: First Hearing — blue dot
  - 10 Jul: Arguments — yellow dot (current)
  - 30 Jul: Next Hearing — gray dot (future)

Chat Area:

User message bubble (blue, right side):
  "Draft a reply to the opposite party's
  application filed on 15th July under
  Section 5 of the Limitation Act..."

AI response bubble (dark glass, left side, larger):
  "🤖 Letese AI" label in blue
  "IN THE HIGH COURT OF PUNJAB AND HARYANA"
  "Case No: SC-2024-00412"
  "I, Advocate Rajesh Sharma, appearing for
  the applicant, most respectfully state:"
  "1. That the application filed by the
  respondent deserves to be dismissed..."
  [Typing indicator: 3 blue dots animated]

Input area (bottom, dark bar):
  - Dark glass text input: "Ask or draft something..."
  - 🎤 mic button (left)
  - ➤ send button (right, blue filled circle)

Bottom Navigation: 🏠 | 📁 | 🤖 | 💬 | 👤

LETESE logo watermark.
Dark premium aesthetic, chat UI.
```

**UI Elements Required:**
- [ ] Top bar with back + case info
- [ ] Info strip (IPC, Court, Date, Fee)
- [ ] Case timeline (visual)
- [ ] User chat bubble
- [ ] AI response bubble with legal draft
- [ ] Typing indicator
- [ ] Input field + mic + send
- [ ] Bottom nav
- [ ] SC background

---

### SCREEN 5 — AIPOT LIVE FEED
**Image Prompt:**
```
Dark mobile app: AIPOT live court judgment feed for Indian legal tech.
Background: Supreme Court of India building at night,
illuminated white marble, dramatic angle, stars visible,
golden dome glowing, deep blue night, dark overlay 45%.

Top section with glow effect at center.

Header (dark glass bar):
  - "⚡ AIPOT Live Feed" in white bold, large
  - Subtitle: "Auto-scraped judgments from Indian courts"
  - RED "● LIVE" badge (pulsing animation)

Stats row (3 dark glass cards):
  [1,24,680 Judgments] [847 Today] [42 This Hour]
  Numbers in large blue bold font.

Filter chips (horizontal scrollable):
  [All] [Supreme Court] [High Court] [Tribunal]

Judgment Cards List:

Card 1 (blue left border — Supreme Court):
  🏛️ SUPREME COURT badge
  CA 2345/2024
  M/s XYZ Ltd vs ABC Corp
  "Constitutional validity of..."
  IPC + Arbitration | 30 Jul

Card 2 (blue left border — P&H HC):
  ⚖️ P&H HIGH COURT badge
  CR 4891/2024
  Kishore Lal vs State
  IPC 420, 467, 471 | 30 Jul
  🔖 bookmark icon

Card 3 (blue left border — Delhi HC):
  ⚖️ DELHI HIGH COURT badge
  WP(C) 1842/2024
  Advocate Ram Singh vs Union of India
  Article 226, Service Law | 29 Jul

Card 4 (Supreme Court card):
  🏛️ SUPREME COURT badge
  SLP 11880/2024
  State of UP vs Federation
  Land Acquisition Act | 29 Jul

Each card has subtle glow on left border.
Bookmark icon on each card.
Dark glass card design.

LETESE logo watermark.
Dark premium aesthetic.
```

**UI Elements Required:**
- [ ] Header with "AIPOT Live Feed"
- [ ] RED LIVE badge
- [ ] Stats cards (3 numbers)
- [ ] Filter chips
- [ ] 4 judgment cards with court type badge
- [ ] Bookmark icons
- [ ] SC building background with glow
- [ ] Bottom nav

---

### SCREEN 6 — NEW CASE / ADD CASE FORM
**Image Prompt:**
```
Dark mobile app: new case registration form for Indian legal tech app.
Background: Indian law firm office at night — wooden desk,
law books on shelf, table lamp with warm light,
legal files and gavel on table, dark overlay 55%.

Top bar:
  - ← back button
  - "Add New Case" title in white bold
  - Cancel text link

Form card (large dark glass card, centered):

"Case Details" section header in blue

Form fields (dark input fields with blue focus border):
  - Case Type: dropdown [Civil | Criminal | Corporate | Family]
  - Case Number: text input (placeholder: "SC-2024-XXXXX")
  - Court: dropdown [Supreme Court | High Court | District | Tribunal]
  - High Court Selection: (conditional dropdown)

"Parties" section header in blue
  - Client Name: text input
  - Opposite Party: text input

"Details" section header in blue
  - Case Description: large text area, multiline
  - Estimated Fee: ₹ input field
  - Priority: chips [Low | Medium | High]

"Next Hearing" section header in blue
  - Date picker: calendar icon + date
  - Time picker: clock icon + time

Submit button: Full width blue rounded button
  "📝 Create Case" in white bold

Bottom text: "AI will auto-generate case summary" in muted text

Background: warm law office aesthetic.
Dark premium.
```

**UI Elements Required:**
- [ ] Back button + title
- [ ] Form with sections (Case Details, Parties, Details, Next Hearing)
- [ ] Dropdowns and text inputs
- [ ] Priority chips
- [ ] Date/Time pickers
- [ ] Blue submit button
- [ ] Background hint text
- [ ] Law office background

---

### SCREEN 7 — PROFILE & SETTINGS
**Image Prompt:**
```
Dark mobile app: advocate profile and settings for Indian legal tech.
Background: Indian advocate in law chamber — wearing advocate's
black coat (bandi), sitting at mahogany desk, law books behind,
window showing High Court building in background,
warm study lamp light, premium professional portrait style,
dark overlay 50%.

Avatar section (top center):
  - Large circle avatar with advocate photo
  - Avatar border: blue glow ring
  - "✏️" edit icon button overlapping avatar
  - Name below: "Arjun Singh" in white bold large
  - Subtitle: "Advocate • Enrolled 2018"
  - Bar Enrollment: "PB-2018-49271"

Stats row (4 glass cards):
  [247 Cases] [1,200 Hearings] [98% Win Rate] [₹48L Revenue]
  Numbers in blue bold, labels in muted white.

Settings Menu List (dark glass cards):

  ⚙️ Settings → "App preferences, notifications" muted text
  🔒 Security → "Password, 2FA, PIN" muted text
  💳 Billing → "Plan: Pro • Renewal: Dec 2024" muted text
  👥 Team → "3 members • Manage RBAC" muted text
  📱 Linked Accounts → "Google, WhatsApp Business" muted text
  📊 Analytics → "Usage & performance" muted text
  🆘 Help & Support → "FAQ, Chat with us" muted text
  📤 Logout → (no subtitle, red text option)

Each menu item: icon (emoji) | label + subtitle | → arrow
Dark glass cards, rounded, stacked vertically.

Bottom Navigation: 🏠 | 📁 | 🤖 | 💬 | 👤 (active on Profile)

LETESE logo small watermark.
Dark premium professional.
```

**UI Elements Required:**
- [ ] Advocate photo/avatar in circle
- [ ] Blue glow ring around avatar
- [ ] Name + enrollment info
- [ ] 4 stats cards
- [ ] 8 settings menu items
- [ ] Bottom navigation (Profile active)
- [ ] Law chamber background

---

## 🔑 LOGO REFERENCE (Sab Screens Mein)

```
    LETESE
         ·  ← Green dot (#00D084) below 'A'
```

- Word "LETESE": Bold sans-serif, Electric Blue (#5072E8)
- Below letter 'A': one small green dot (#00D084)
- This is the LETESE brand mark

---

## 📐 Technical Specs for Designer

| Property | Value |
|----------|-------|
| Screen size | 400px × 866px (iPhone 14 Pro ratio) |
| Safe area top | 56px (notch handling) |
| Safe area bottom | 90px (home indicator + nav) |
| Card border-radius | 16px |
| Button border-radius | 12px |
| Font family | Inter / Poppins |
| Primary color | #5072E8 |
| Green dot | #00D084 |
| Background | #0D0D14 |
| Card color | #16161F (80% opacity) |
| Text primary | #FFFFFF |
| Text secondary | #8B92A8 |

---

## 🖼️ Background Image Sources (For Designer)

| Screen | Recommended Image |
|--------|-------------------|
| Login | Supreme Court of India exterior, night, golden lights |
| Dashboard | High Court interior, marble pillars, warm light |
| Case List | Indian law library, tall shelves, dark warm |
| Case Chat | Supreme Court dome, dramatic night, glowing |
| AIPOT Feed | SC exterior, dramatic angle, stars, blue night |
| New Case | Law firm office, desk, books, warm lamp |
| Profile | Advocate in chamber, black coat, mahogany desk |

---

## ✅ Checklist for Designer

- [ ] All 7 screens created
- [ ] Each screen with court/legal background image
- [ ] LETESE logo with green dot on every screen
- [ ] Dark glass-morphism UI cards
- [ ] Bottom navigation bar on all screens
- [ ] Consistent color palette used
- [ ] Mobile phone frame style mockups
- [ ] High resolution (2x scale)
- [ ] Light + Dark versions of each screen (optional)
