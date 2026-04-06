# LETESE — Short Summary for Designers & Developers

## एक लाइन में
> **LETESE** = भारतीय वकीलों के लिए AI-powered Legal SaaS — एक app जो case management, AI drafting, court judgment tracking, और team collaboration एक jagah करता है।

---

## 🎯 LETESE क्या करती है?

### 1. Case Diary (केस डायरी)
- वकील अपने सारे केस एक app में manage करते हैं
- हर case में hearing dates, documents, notes, parties
- Timeline bana ke rakhta hai — case कहाँ stuck है

### 2. AI Drafting (AI से Draft तैयार करना)
- वकील chat mein likh sakta hai — "Application draft karo"
- AI legal reply, application,.arguments automatically likh deta hai
- Hindi + English both mein kaam karta hai (Gurmukhi script bhi)
- 3 users ek saath collaborate kar sakte hain (Tiptap editor)

### 3. AIPOT — Auto Judgment Tracker
- P&H High Court, Delhi High Court, Supreme Court — 24/7 auto scrape
- Naya judgment mile, sofort relevant cases ke saath match kare
- Advocates ko alert bhejega — "Aapke topic ka judgment aaya hai"

### 4. WhatsApp / SMS / Email Alerts
- Client ko WhatsApp pe updates bheje
- Hearing reminder 24h pehle SMS/Email se
- AI-generated messages — translated bhi

### 5. Team RBAC (Role-Based Access)
- Admin — Team manage kar sakta hai, billing dekh sakta hai
- Advocate — Apne cases, drafts
- Paralegal — Research kar sakta hai, drafting nahi kar sakta
- Intern — Sirf observe kar sakta hai

### 6. Billing + Payments
- Razorpay integration — Online payment
- Invoice PDF generate
- Monthly/yearly subscription plans

---

## 👥 LETESE Ke Users

| User | Kya karega |
|------|-----------|
| **Individual Advocate** | Apni practice manage kare — cases, drafts, clients |
| **Law Firm** | Team ko collaborate kare, billing ek jagah se ho |
| **In-House Legal Team** | Company ke legal cases track kare |

---

## 📱 App Screens Jo Bane Hain (Mobile App)

### Screen 1 — Login / Register
- Email + Password ya Google se login
- Hindi + English language option
- OTP-based verification

### Screen 2 — Dashboard (Home)
- "Namaste, Advocate" greeting
- Aaj ki hearing ka card dikhe
- Case status chips: 🔴 Live / 🟡 Pending / 🟢 Resolved
- Quick Actions: New Case, AI Draft, Search, Tasks
- AIPOT Live Feed ka preview

### Screen 3 — Case List
- Saare cases ki list with filter (High Court, SC, Tribunal)
- Search bar — case name ya number se khoje
- Each case: case no., court, opposite party, next hearing date

### Screen 4 — Case Detail + AI Chat
- Case ki poori history — hearing timeline
- Documents ki list
- Chat box — AI se baat karein: "Draft karo reply"
- AI response format: formal legal language, section-wise

### Screen 5 — AIPOT Feed
- Live judgments feed — sab courts se
- Filter: Supreme Court / High Court / Tribunal
- Stats: Total judgments, aaj ke, is ghante ke
- Bookmark karo interesting judgments ko

### Screen 6 — New Case / Task
- Case add karne ka form
- Opposite party, court, case type
- Hearing date set karo
- Document upload

### Screen 7 — Profile + Settings
- Avatar, name, bar enrollment no.
- Stats: Total cases, hearings, win rate
- Plan details (Pro/Free)
- Team management (admin ke liye)
- Notifications settings
- Logout

---

## 🌐 Web Dashboards (Admin Panels)

| Dashboard | Kaam |
|-----------|------|
| **Super Admin** | Sab tenants dekh sakta hai, system health, API vendors |
| **Customer Admin** | Apni team, billing, Razorpay dashboard |
| **Marketing Landing Page** | letese.ai — pricing, features, sign-up |

---

## 🏗️ Technical Stack (Reference)

- **Backend:** Python FastAPI, PostgreSQL + pgvector (AI)
- **AI:** OpenAI GPT-4 + Anthropic Claude + local models
- **Mobile:** Flutter (iOS + Android)
- **Web:** Next.js dashboards + landing page
- **Editor:** Tiptap + Y.js (collaborative)
- **Communication:** WhatsApp (WhatsApp Business API), SMS (Twilio/Exotel), Email (SMTP)
- **Infrastructure:** Kubernetes, ArgoCD, Prometheus, Grafana
- **Hosting:** AWS EKS
- **SSL:** cert-manager + Let's Encrypt

---

## 🎨 Design Direction

### Theme
- **Primary Color:** Electric Blue (#5072E8)
- **Background:** Dark Navy (#0D0D14) — professional, premium feel
- **Accent:** Teal (#00BFA6) for success states
- **Text:** White + muted grey

### Typography
- Clean, modern — Google Fonts: Inter ya Poppins
- Legal feel — serif font for document drafts (Merriweather)

### Style
- Dark mode by default (advocates often work late)
- Rounded cards (16px radius)
- Subtle glow effects on important elements
- Bottom navigation bar (mobile)
- Chat-style AI interface

### Icon Style
- Emoji-based icons for quick recognition
- No heavy illustrations — clean, minimal

---

## 📋 Designer Ko Bolna Ka Summary

> "LETESE ek mobile app hai jo Indian lawyers ke liye hai.
> Isme 3 cheezein important hain —
> (1) Case diary with timeline,
> (2) AI chat jisme lawyer bolta hai 'draft karo' aur AI legal reply likh deta hai,
> (3) Live court judgment feed.
> Design chahiye dark theme mein — professional, premium feel, legal industry ke hisaab se.
> Main screens hain: Login, Dashboard, Case List, Case Detail+AI Chat, AIPOT Feed, New Case, Profile.
> Color scheme: Dark navy background + electric blue accent."

---

**Yahan tak kaam ho gaya. Ab aap is summary ko Canva/Figma designer ya kisi IT firm ko bhej sakte ho.**
