# Design System Specification: High-End Legal Tech Editorial

## 1. Overview & Creative North Star
**The Creative North Star: "The Digital Jurist"**

This design system moves beyond the cold, static nature of traditional legal software. We are creating an experience that feels like an elite, high-tech law firm’s digital headquarters—think iPhone 16 Pro hardware meets premium editorial typography. 

The aesthetic is driven by **Luminous Clarity**. We break the "template" look by utilizing intentional asymmetry in our layouts, expansive white space, and overlapping glass layers. By prioritizing tonal depth over rigid borders, the interface feels fluid, energetic, and authoritative. Every element should feel as though it is floating on a bed of soft light, providing a sense of "technological breathability."

---

## 2. Colors & Surface Philosophy

### Color Palette
*   **Primary (Electric Blue):** `#2b51c7` (Derived from `#5072E8`). This is the anchor of trust and authority.
*   **Secondary (Sky Gradient):** A transition from `primary` to `primary_container` (`#819bff`) to provide visual "soul."
*   **Tertiary (Bright Green):** `tertiary` (`#006940`) and `tertiary_fixed` (`#52f9a8`). Used for success states and "Go" actions.
*   **Error (High-Vis Red):** `error` (`#b41340`) for critical alerts.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section off the UI. 
Boundaries must be defined through:
1.  **Background Shifts:** Placing a `surface_container_low` card on a `surface` background.
2.  **Tonal Transitions:** Using the gradient secondary colors to bleed into the background.
3.  **Negative Space:** Using large, intentional gaps to imply containment.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of frosted sapphire glass.
*   **Base:** `surface` (`#f4f6fb`)
*   **Secondary Sections:** `surface_container_low` (`#eef1f6`)
*   **Primary Cards:** `surface_container_lowest` (`#ffffff`) - This provides the highest contrast for readability.
*   **Interaction/Active Elements:** `surface_container_high` (`#dfe3e9`)

### The "Glass & Gradient" Rule
Floating elements (Modals, Hover Menus, Navigation Bars) must utilize **Glassmorphism**.
*   **Recipe:** Use `surface_container_lowest` at 70% opacity with a `backdrop-filter: blur(20px)`.
*   **Signature Texture:** Use a subtle linear gradient (Top-Left to Bottom-Right) of `primary` to `primary_container` at 10% opacity as a background overlay on large cards to give them a premium, metallic sheen.

---

## 3. Typography
We utilize a dual-font strategy to balance the precision of legal work with the energy of a modern tech brand.

*   **Display & Headlines (Manrope):** Chosen for its geometric precision and modern "tech-forward" feel.
    *   *Headline-LG (2rem):* Use for page titles to establish a confident, editorial presence.
*   **Body & Labels (Inter):** The workhorse for legibility.
    *   *Body-MD (0.875rem):* The standard for legal documents and data entry.
    *   *Label-MD (0.75rem):* Used for high-visibility status chips and metadata.

**Editorial Hierarchy Tip:** Never use "Pure Black." Always use `on_surface` (#2c2f33) for body text and `on_surface_variant` (#585c60) for secondary details to maintain the "High-End" softness.

---

## 4. Elevation & Depth

### The Layering Principle
Forget shadows; use **Tonal Stacking**. 
*   **Level 0 (Background):** `surface`
*   **Level 1 (Sectioning):** `surface_container`
*   **Level 2 (Active Content):** `surface_container_lowest` (White)

### Ambient Shadows
When a floating effect is required (e.g., a "Send" button or a Modal), use an **Ambient Glow**:
*   **Blur:** 32px to 48px.
*   **Opacity:** 4% - 8%.
*   **Color:** Use a tinted version of `primary` (`#2b51c7`) rather than grey. This mimics light passing through a blue lens.

### The "Ghost Border" Fallback
If a container lacks contrast (e.g., white card on a light grey background for accessibility), use a **Ghost Border**:
*   `outline_variant` (#aaadb2) at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### Buttons
*   **Primary:** Linear gradient (`primary` to `primary_dim`). Roundedness: `full` (Pill-shaped). No border.
*   **Secondary:** Glassmorphic. Background `surface_container_highest` at 50% with a 1px "Ghost Border."
*   **Interaction:** On hover, primary buttons should expand slightly (scale 1.02) with an increased ambient glow.

### Status Chips (High-Visibility)
To satisfy the "iPhone 16 Pro aesthetic," status chips must be vibrant and saturated:
*   **Success:** `tertiary_container` background with `on_tertiary_container` text.
*   **Warning:** Yellow (custom accent) background with high-contrast dark text.
*   **Error:** `error_container` background with `on_error_container` text.
*   **Styling:** Pill-shaped (`full`), 700 font weight, and uppercase `label-sm`.

### Input Fields
*   **State:** Default fields should be `surface_container_low` with no border.
*   **Focus State:** A 2px "Glow" using `primary_fixed` and a background shift to `surface_container_lowest`.
*   **Labels:** Always use `title-sm` floating above the input, never placeholder-only.

### Cards & Lists
*   **Rule:** **Zero Dividers.** Separate list items using 8px of vertical whitespace or a subtle background hover state using `surface_container_low`.
*   **Radius:** Cards must use `xl` (1.5rem) or `lg` (1rem) corner radius to match modern hardware aesthetics.

---

## 6. Do's and Don'ts

### Do:
*   **Embrace Asymmetry:** Place hero text on the left with 15% more right-side padding than left-side padding to create an editorial feel.
*   **Use Large Radius:** Use the `xl` (1.5rem) tokens for main containers to mimic the iPhone 16 Pro's screen corners.
*   **Prioritize Breathing Room:** If you think there is enough margin, add 16px more. High-end design thrives on "wasteful" space.

### Don't:
*   **Don't Use 1px Dividers:** It makes the UI look like a spreadsheet. Use tonal shifts instead.
*   **Don't Use Pure Grey:** Every neutral color in this system is slightly "temped" with blue to maintain the sky-blue atmosphere.
*   **Don't Crowd the Glass:** When using glassmorphism, ensure the background behind the blur isn't too busy, or the "premium" feel will turn into visual noise.