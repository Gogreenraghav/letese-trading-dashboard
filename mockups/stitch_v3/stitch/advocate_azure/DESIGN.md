# Design System Strategy: The Elevated Advocate

## 1. Overview & Creative North Star
Legal software is traditionally rigid, claustrophobic, and utilitarian. This design system breaks that mold by adopting the **"Atmospheric Authority"** North Star. We are moving away from the "tax software" aesthetic toward a high-end, editorial experience that feels as sophisticated as a premium law firm’s corner office.

The system utilizes **Glassmorphism** and **Tonal Layering** to create a sense of infinite space. By rejecting hard dividers and embracing intentional asymmetry, we guide the advocate’s eye through complex data with ease. This isn't just an interface; it's a curated digital environment where clarity meets prestige.

---

## 2. Colors & Surface Philosophy
The palette is rooted in deep, authoritative blues contrasted against ethereal, translucent surfaces.

### Tonal Foundations
- **The Sky Gradient:** The primary canvas uses a vertical transition from `secondary_container` (#819bff) to `primary_container` (#2b51c7). This provides a sense of depth and "air" behind the UI.
- **Success/Accent:** The Tertiary Green (`tertiary_fixed`: #59feae) is our signature "pulse." Use it sparingly for status indicators (the green dot) and high-priority success states.

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders for sectioning or containment. 
- Boundaries must be defined through **Background Color Shifts** (e.g., a `surface_container_highest` header over a `surface` body).
- Depth is achieved through **Nesting**: An inner card should use `surface_container_lowest` (pure white glass) to pop against a `surface_container_low` background.

### The Glass & Gradient Rule
To achieve a premium "editorial" feel:
- **White Glass:** All primary cards must use `surface_container_lowest` at 70-80% opacity with a `24px` backdrop-blur. 
- **Signature Textures:** For Hero CTAs, use a subtle linear gradient shifting from `primary` (#0037ad) to `primary_container` (#2b51c7). This adds a "physicality" that flat hex codes lack.

---

## 3. Typography: Editorial Authority
We pair the geometric strength of **Manrope** with the high-utility legibility of **Inter**.

- **Display & Headlines (Manrope):** 
  - `display-lg` (800 weight) is reserved for page titles to establish instant authority.
  - `headline-sm` (700 weight) is used for card titles to create a clear "anchor" for the eye.
- **Body & Labels (Inter):** 
  - `body-lg` and `body-md` (400 weight) handle all legal copy and data. 
  - The contrast between the Extra Bold Manrope and the clean Inter creates a "magazine-style" hierarchy that feels curated, not automated.

---

## 4. Elevation & Depth
In this system, elevation is a feeling, not a drop shadow.

### The Layering Principle
Hierarchy is established by "stacking" transparency. 
1. **Base Layer:** The Sky Gradient.
2. **Intermediate Layer:** `surface_variant` overlays for sidebars or grouping.
3. **Primary Content:** Glass cards (`surface_container_lowest` @ 80% opacity).

### Ambient Shadows
Shadows must mimic natural light. Use `rgba(43,81,199,0.08)`—a tinted shadow. 
- **Large Blur (40px+)** and **Low Opacity** are required. 
- Never use pure black (#000) for shadows; it "muddies" the glass effect.

### The "Ghost Border" Fallback
If a visual separator is functionally required for accessibility, use a **Ghost Border**: `outline_variant` at 15% opacity. It should be felt, not seen.

---

## 5. Components

### Buttons & Inputs
- **Shape:** All buttons and inputs are **Pill-Shaped** (`roundness-full`). This softens the "legal" edge of the app.
- **Primary Button:** Gradient fill (`primary` to `primary_container`) with white text.
- **Input Fields:** Semi-transparent white glass with `title-sm` Inter text. The focus state should be a subtle glow, never a high-contrast stroke.

### Cards
- **Radius:** Fixed at `24px` (`md`).
- **Layout:** Forbid the use of divider lines within cards. Use **Vertical White Space** (32px or 48px) to separate the heading from the body content.

### The "Advocate Pulse" (Status Chip)
- Specifically for legal status (e.g., "Active Case"), use a small `tertiary_fixed` (#59feae) dot next to `label-md` text. No container box is needed; let the color and typography do the work.

### Legal Document Lists
- Replace traditional table rows with "Floating Rows." Each item is a very slim glass card with a subtle `rgba(43,81,199,0.08)` shadow. This makes a long list of case files feel light and manageable.

---

## 6. Do's and Don'ts

### Do:
- **Do** use asymmetrical layouts. Align a heading to the far left and a CTA to the far right with significant white space between them.
- **Do** use "Breathing Room." Increase margins by 20% more than you think is necessary.
- **Do** leverage the logo's signature green dot as a recurring visual motif for "Live" or "Verified" AI insights.

### Don't:
- **Don't** use 100% opaque, flat white backgrounds. It destroys the "Atmospheric" quality.
- **Don't** use hard 90-degree corners. Legal apps are often "pointy"; this system must be "smooth."
- **Don't** use standard grey shadows. Always tint shadows with the `primary` blue to maintain the color harmony of the sky background.