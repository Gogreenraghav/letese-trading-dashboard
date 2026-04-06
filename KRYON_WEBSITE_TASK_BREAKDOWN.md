# KRYON TECHNOLOGY WEBSITE - 15-MINUTE TASK BREAKDOWN
## Complete Step-by-Step Development Guide for Coding Agent

**Project:** Kryon Technology Website Rebuild  
**Tech Stack:** Next.js 14, Tailwind CSS, TypeScript, Docker  
**Target:** Deploy to kryon.ai24x7.cloud  
**Working Dir:** `/tmp/kryon-website/`

---

## 📋 HOW TO USE THIS DOCUMENT

1. **Each section = 15 minutes of work** (estimated)
2. **Complete one section at a time** and report progress
3. **Follow exact file paths and instructions**
4. **Use placeholders where data is missing**
5. **Report completion after each section**

---

## 🚀 PHASE 1: PROJECT SETUP (45 minutes) - DETAILED 15-MINUTE CHUNKS

### Section 1.1: Directory Creation & Next.js Setup (15 min)
**Time:** 00:00 - 00:15

```bash
# Step 1: Create project directory
mkdir -p /tmp/kryon-website
cd /tmp/kryon-website

# Step 2: Initialize Next.js with TypeScript and Tailwind
npx create-next-app@latest . --typescript --tailwind --app --no-eslint --import-alias "@/*" --src-dir --no-git

# Step 3: Verify installation
ls -la
```

**Files to verify:**
- ✅ `package.json` (should have Next.js 14)
- ✅ `tsconfig.json`
- ✅ `tailwind.config.js`
- ✅ `app/` directory exists

**15-Minute Update Format:**
```
=== SECTION 1.1 COMPLETION REPORT ===
Time: 00:15
Section: 1.1 - Directory Creation & Next.js Setup
Status: ✅ COMPLETED

What was done:
- ✅ Created /tmp/kryon-website directory
- ✅ Initialized Next.js 14 with TypeScript + Tailwind
- ✅ Verified all base files created

Files created:
- package.json
- tsconfig.json  
- tailwind.config.js
- app/layout.tsx (default)
- app/page.tsx (default)
- app/globals.css

Next: Section 1.2 - Dependencies & File Structure
```

---

### Section 1.2: Dependencies & File Structure (15 min)
**Time:** 00:15 - 00:30

```bash
# Step 1: Install additional dependencies
npm install framer-motion
npm install -D @types/node

# Step 2: Create required directories
mkdir -p app/products app/components app/styles public/images

# Step 3: Check package.json
cat package.json | grep -A5 "dependencies"
```

**Files to create/verify:**
- ✅ `node_modules/` updated with new dependencies
- ✅ Directory structure:
  ```
  /tmp/kryon-website/
  ├── app/
  │   ├── products/
  │   ├── components/
  │   └── styles/
  └── public/
      └── images/
  ```

**15-Minute Update Format:**
```
=== SECTION 1.2 COMPLETION REPORT ===
Time: 00:30
Section: 1.2 - Dependencies & File Structure
Status: ✅ COMPLETED

What was done:
- ✅ Installed framer-motion for animations
- ✅ Installed @types/node for TypeScript
- ✅ Created all required directories
- ✅ Verified package.json dependencies

Files modified:
- package.json (updated dependencies)
- Directory structure created

Dependencies installed:
- framer-motion: ^11.0.0
- @types/node: ^20.0.0

Next: Section 1.3 - Design System Configuration
```

---

### Section 1.3: Design System Configuration (15 min)
**Time:** 00:30 - 00:45

```bash
# Step 1: Update Tailwind config
```

**Files to update:**
1. `tailwind.config.js` - Update with brand colors:
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#00A4F0',
        dark: '#0A0E1A', 
        light: '#F0F4FF',
        accent: '#00D4FF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui'],
        heading: ['Space Grotesk', 'system-ui'],
      },
    },
  },
  plugins: [],
}
```

2. `app/globals.css` - Update with base styles:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 230, 237, 245;
  --background-start-rgb: 10, 14, 26;
  --background-end-rgb: 15, 20, 35;
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
  min-height: 100vh;
}

@layer components {
  .glow-effect {
    box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
  }
}
```

**15-Minute Update Format:**
```
=== SECTION 1.3 COMPLETION REPORT ===
Time: 00:45
Section: 1.3 - Design System Configuration
Status: ✅ COMPLETED

What was done:
- ✅ Updated tailwind.config.js with brand colors
- ✅ Updated app/globals.css with base styles
- ✅ Added Google Fonts imports
- ✅ Added custom CSS variables
- ✅ Added glow-effect component class

Brand Colors Configured:
- Primary: #00A4F0 (Electric Blue)
- Dark: #0A0E1A (Deep Space)
- Light: #F0F4FF (Off-white)
- Accent: #00D4FF (Cyan)

Fonts Configured:
- Headings: Space Grotesk
- Body: Inter

Next: Phase 2 - Basic Components Creation
```

---

## 🏠 PHASE 2: BASIC COMPONENTS CREATION (60 minutes) - DETAILED 15-MINUTE CHUNKS

### Section 2.1: Navbar Component (15 min)
**Time:** 00:45 - 01:00

**File:** `app/components/Navbar.tsx`

**Tasks:**
1. Create responsive navbar with:
   - Logo placeholder (text "KRYON" for now)
   - Navigation links: Home, About, Products, Technology, Contact
   - CTA button "Get Quote"
   - Mobile hamburger menu
2. Make it sticky on scroll
3. Add transparent → solid background on scroll

**15-Minute Update Format:**
```
=== SECTION 2.1 COMPLETION REPORT ===
Time: 01:00
Section: 2.1 - Navbar Component
Status: ✅ COMPLETED

What was done:
- ✅ Created app/components/Navbar.tsx
- ✅ Added logo placeholder "KRYON"
- ✅ Added 5 navigation links
- ✅ Added Get Quote CTA button
- ✅ Implemented mobile hamburger menu
- ✅ Added scroll effect (transparent → solid)

Features:
- Responsive design (mobile/tablet/desktop)
- Sticky navigation
- Smooth scroll behavior
- Mobile menu toggle

Files created:
- app/components/Navbar.tsx

Next: Section 2.2 - Footer Component
```

---

### Section 2.2: Footer Component (15 min)
**Time:** 01:00 - 01:15

**File:** `app/components/Footer.tsx`

**Tasks:**
1. Create footer with:
   - Company info section
   - Quick links (same as navbar)
   - Contact info placeholder
   - Social media icons placeholder
   - Newsletter signup placeholder
   - Copyright notice
2. Add responsive grid layout
3. Add subtle background gradient

**15-Minute Update Format:**
```
=== SECTION 2.2 COMPLETION REPORT ===
Time: 01:15
Section: 2.2 - Footer Component
Status: ✅ COMPLETED

What was done:
- ✅ Created app/components/Footer.tsx
- ✅ Added company info section
- ✅ Added quick links column
- ✅ Added contact info placeholder
- ✅ Added social media icons placeholder
- ✅ Added newsletter signup placeholder
- ✅ Added copyright notice

Layout:
- 4-column grid on desktop
- 2-column grid on tablet
- 1-column on mobile

Files created:
- app/components/Footer.tsx

Next: Section 2.3 - GlowButton Component
```

---

### Section 2.3: GlowButton Component (15 min)
**Time:** 01:15 - 01:30

**File:** `app/components/GlowButton.tsx`

**Tasks:**
1. Create reusable button component with:
   - Primary and secondary variants
   - Glow effect on hover
   - Size variants (sm, md, lg)
   - Loading state
   - Icon support
2. Add proper TypeScript types
3. Add CSS animations for glow effect

**15-Minute Update Format:**
```
=== SECTION 2.3 COMPLETION REPORT ===
Time: 01:30
Section: 2.3 - GlowButton Component
Status: ✅ COMPLETED

What was done:
- ✅ Created app/components/GlowButton.tsx
- ✅ Implemented primary/secondary variants
- ✅ Added glow effect with CSS animations
- ✅ Added size variants (sm, md, lg)
- ✅ Added loading state with spinner
- ✅ Added icon support
- ✅ Added proper TypeScript interfaces

Button Variants:
- Primary: Blue gradient with glow
- Secondary: Transparent with border
- Sizes: sm (small), md (medium), lg (large)

Files created:
- app/components/GlowButton.tsx

Next: Section 2.4 - SectionWrapper Component
```

---

### Section 2.4: SectionWrapper Component (15 min)
**Time:** 01:30 - 01:45

**File:** `app/components/SectionWrapper.tsx`

**Tasks:**
1. Create wrapper component for consistent sections:
   - Consistent padding and margins
   - Max width constraint
   - Background variants (dark, light, gradient)
   - Animation on scroll into view
   - Child content alignment options
2. Make it reusable across all pages

**15-Minute Update Format:**
```
=== SECTION 2.4 COMPLETION REPORT ===
Time: 01:45
Section: 2.4 - SectionWrapper Component
Status: ✅ COMPLETED

What was done:
- ✅ Created app/components/SectionWrapper.tsx
- ✅ Added consistent padding/margin system
- ✅ Added max width constraint (1280px)
- ✅ Implemented 3 background variants
- ✅ Added scroll animation with Framer Motion
- ✅ Added alignment options (left, center, right)

Features:
- Responsive padding (mobile: 1rem, desktop: 2rem)
- Smooth scroll animations
- Consistent spacing across site
- Easy to use interface

Files created:
- app/components/SectionWrapper.tsx

Next: Phase 3 - Home Page Development
```

---

### Section 2.3: Products Overview (15 min)
**File:** `app/components/ProductCard.tsx` and `app/page.tsx`

**Tasks:**
1. Create ProductCard component with:
   - Icon placeholder
   - Title
   - Brief description
   - CTA link
   - Hover effects (scale + glow)
2. Create ProductsOverview section with 6 product categories:
   - BLDC Motors
   - AC Controllers
   - AC Remotes
   - STB & ONT Devices
   - AC Compressors
   - Custom Solutions
3. Add to home page

**Report:** Products overview section with 6 interactive product cards

---

### Section 2.4: Why Kryon + CTA (15 min)
**File:** `app/page.tsx`

**Tasks:**
1. Create "Why Kryon" section with 5 USPs:
   - Innovation
   - Quality
   - Reliability
   - Support
   - Global Reach
2. Create final CTA section: "Partner with us"
3. Add client logos/certifications placeholder strip
4. Complete home page structure

**Report:** Home page completed with all sections

---

## 📄 PHASE 3: PAGES CREATION (120 minutes)

### Section 3.1: About Page (15 min)
**File:** `app/about/page.tsx`

**Tasks:**
1. Create About page with:
   - Company story/vision/mission
   - Timeline placeholder (2008 → present)
   - Manufacturing facility placeholder
   - Quality certifications section
   - Team placeholder section
2. Use consistent styling with home page

**Report:** About page created with all required sections

---

### Section 3.2: Products Pages Structure (15 min)
```bash
# Create products pages structure
```

**Files to create:**
1. `app/products/bldc-motors/page.tsx`
2. `app/products/ac-controllers/page.tsx`
3. `app/products/ac-remotes/page.tsx`
4. `app/products/stb-ont/page.tsx`
5. `app/products/compressors/page.tsx`

**Each page should have:**
- Basic layout with title
- Placeholder for product description
- Placeholder for specs table
- Placeholder for 3D model/image
- Download datasheet button

**Report:** 5 product pages created with basic structure

---

### Section 3.3: Technology Page (15 min)
**File:** `app/technology/page.tsx`

**Tasks:**
1. Create Technology page with:
   - Manufacturing process overview
   - R&D capabilities
   - Quality testing procedures
   - Industry standards compliance
2. Use technical icons and diagrams placeholders

**Report:** Technology page created

---

### Section 3.4: Leadership Page (15 min)
**File:** `app/leadership/page.tsx`

**Tasks:**
1. Create Leadership page with:
   - "Meet Our Team" heading
   - 3-4 team member placeholder cards
   - Professional bio format
   - Placeholder avatar images
2. Add hover effects to team cards

**Report:** Leadership page with team placeholder cards

---

### Section 3.5: Careers Page (15 min)
**File:** `app/careers/page.tsx`

**CRITICAL:** Use `info@kryontechnology.com` NOT `careers@...`

**Tasks:**
1. Create Careers page with:
   - 3-4 placeholder job positions
   - Application form with fields:
     - Name, Email, Phone, Position, Resume upload
   - Form submits to `info@kryontechnology.com`
2. Add form validation

**Report:** Careers page with working application form

---

### Section 3.6: Contact Page (15 min)
**File:** `app/contact/page.tsx`

**Tasks:**
1. Create Contact page with:
   - Contact form (sends to `info@kryontechnology.com`)
   - Office address placeholder
   - Phone number placeholder
   - Google Maps embed placeholder
   - Social media links placeholder
2. Make form functional

**Report:** Contact page with working contact form

---

### Section 3.7: Downloads Page (15 min)
**File:** `app/downloads/page.tsx`

**Tasks:**
1. Create Downloads page with:
   - Table of downloadable items
   - Categories: Product datasheets, Certificates, User manuals
   - Search/filter functionality placeholder
   - Download buttons with placeholder PDF links
2. Use clean table design

**Report:** Downloads page with categorized download items

---

### Section 3.8: Certifications Page (15 min)
**File:** `app/certifications/page.tsx`

**Tasks:**
1. Create Certifications page with:
   - ISO certification display
   - BIS, RoHS, TRAI certifications
   - Placeholder certificate images
   - Grid layout for certificates
2. Add certificate preview on hover

**Report:** Certifications page with certificate grid

---

## 🔧 PHASE 4: ENHANCEMENTS & POLISH (60 minutes)

### Section 4.1: Responsive Design (15 min)
**Tasks:**
1. Test all pages on mobile (375px), tablet (768px), desktop (1440px)
2. Fix any responsive issues
3. Ensure navbar is mobile-friendly with hamburger menu
4. Adjust font sizes and spacing for mobile

**Report:** All pages fully responsive across devices

---

### Section 4.2: Animations & Interactions (15 min)
**Tasks:**
1. Add page transition animations
2. Add hover effects to all interactive elements
3. Add scroll-triggered animations for sections
4. Add loading states
5. Use Framer Motion for smooth animations

**Report:** Animations and interactions added

---

### Section 4.3: SEO & Metadata (15 min)
**Tasks:**
1. Add metadata to each page (`app/layout.tsx` and individual pages)
2. Create `app/sitemap.ts` for sitemap generation
3. Create `app/robots.ts` for robots.txt
4. Add Open Graph tags
5. Add favicon and manifest

**Report:** SEO optimization completed with metadata and sitemap

---

### Section 4.4: Performance Optimization (15 min)
**Tasks:**
1. Optimize images (use next/image)
2. Implement lazy loading for below-fold content
3. Check bundle size with `npm run build`
4. Add loading states for images
5. Optimize font loading

**Report:** Performance optimizations implemented

---

## 🐳 PHASE 5: DEPLOYMENT SETUP (45 minutes)

### Section 5.1: Docker Configuration (15 min)
**Files to create:**
1. `Dockerfile` - Use provided template
2. `docker-compose.yml` - Use provided template
3. `.dockerignore` - Exclude node_modules, .next, etc.
4. `.env.example` - Environment variables template

**Report:** Docker configuration files created

---

### Section 5.2: Nginx & Deployment Config (15 min)
**Files to create:**
1. `nginx.conf` - Use provided template
2. `deploy.sh` - Deployment script
3. `README.md` - Deployment instructions

**Report:** Deployment configuration files created

---

### Section 5.3: GitHub Setup & Initial Push (15 min)
```bash
# Initialize git repository
git init
git add .
git commit -m "Initial commit: Kryon Technology Website"

# Connect to GitHub (use provided credentials)
git remote add origin https://github.com/Gogreenraghav/kryon-website.git
git branch -M main
git push -u origin main
```

**Report:** Code pushed to GitHub repository

---

## ✅ PHASE 6: TESTING & FINALIZATION (30 minutes)

### Section 6.1: Build Test (15 min)
```bash
# Test build process
npm run build

# Check for errors
# Test locally
npm start
```

**Tasks:**
1. Fix any build errors
2. Test all pages locally
3. Test contact form functionality
4. Check console for errors

**Report:** Build successful, no errors

---

### Section 6.2: Placeholders Documentation (15 min)
**File:** `PLACEHOLDERS.md`

**Tasks:**
1. List all placeholder content needed from client:
   - Product specifications
   - Team photos and bios
   - Certificate images
   - Product photos
   - Company address and phone
   - Social media links
   - Client logos
   - 3D model files
2. Create checklist for client

**Report:** Placeholders documented in PLACEHOLDERS.md

---

## 🚀 FINAL DEPLOYMENT INSTRUCTIONS

### VPS Deployment (Run these commands on 69.62.83.21):
```bash
# SSH to VPS
ssh root@69.62.83.21

# Navigate to project directory
cd /root/kryon-website

# Pull latest code
git pull origin main

# Build and start with Docker
docker-compose down
docker-compose up -d --build

# Check logs
docker-compose logs -f
```

### Nginx Setup (if not already done):
```bash
# Copy nginx config
cp nginx.conf /etc/nginx/sites-available/kryon.ai24x7.cloud
ln -s /etc/nginx/sites-available/kryon.ai24x7.cloud /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## 📊 PROGRESS TRACKING TEMPLATE

Copy and update this after each 15-minute section:

```
=== SECTION COMPLETION REPORT ===
Date: [Date]
Time: [Time]
Section: [Section Number and Name]
Status: ✅ COMPLETED / ⏳ IN PROGRESS / ❌ BLOCKED

What was done:
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

Files created/modified:
- file1.tsx
- file2.tsx

Issues/Blockers:
- None / [Describe issue]

Next section to work on: [Next Section]
Estimated time to complete: [Time]
```

---

## 🆘 TROUBLESHOOTING

### Common Issues:
1. **Build errors** - Check TypeScript types and imports
2. **Docker issues** - Check Dockerfile syntax and ports
3. **Deployment issues** - Check VPS firewall and nginx config
4. **Form issues** - Check email configuration

### Contact for Help:
- Report issues with section number and error details
- Include relevant code snippets
- Screenshots of errors if possible

---

## ✅ FINAL DELIVERABLES CHECKLIST

When complete, ensure these are delivered:

1. ✅ Complete file tree of project
2. ✅ GitHub repo URL: https://github.com/Gogreenraghav/kryon-website
3. ✅ Live URL: https://kryon.ai24x7.cloud
4. ✅ PLACEHOLDERS.md document
5. ✅ Docker configuration files
6. ✅ Deployment instructions
7. ✅ Testing report

---

*Document prepared by: Main AI Agent*
*Date: 2026-04-02*
*For: Arjun Singh — Letese AI24x7*

**Total Estimated Development Time:** ~6 hours (24 x 15-minute sections)
**Priority Order:** Follow sections sequentially from 1.1 to 6.2