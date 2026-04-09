# Design System Document: The Luminescent Litigator

## 1. Overview & Creative North Star

### Creative North Star: "The Digital Curator"
In the traditional legal world, authority is often conveyed through heavy mahogany and rigid structures. This design system reimagines legal tech as "The Digital Curator"—an environment that feels sophisticated, airy, and hyper-organized. We are moving away from the "cluttered spreadsheet" aesthetic toward a high-end editorial experience. 

By leveraging intentional asymmetry, expansive white space, and a glass-on-gradient depth model, we create a workspace that reduces cognitive load while maintaining the authoritative presence required for high-stakes legal work. This is not a "template"; it is a bespoke digital environment where information breathes.

---

## 2. Colors & Surface Logic

### The Palette
The color strategy uses a deep oceanic primary base contrasted against a vibrant, tech-forward green. 

*   **Primary (`primary` #0037ad / `primary_container` #2b51c7):** The anchor of trust. Used for core navigation and high-level branding.
*   **Tertiary/Accent (`tertiary_fixed` #59feae):** The "Success" signal. Used sparingly for high-priority status indicators and specific call-to-actions to ensure they "pop" against the blue canvas.
*   **Neutral/Text:** `on_surface` (#191c20) for primary legibility and `on_surface_variant` (#444654) for metadata.

### The "No-Line" Rule
**Borders are prohibited for sectioning.** To create a high-end feel, boundaries must be defined solely through background shifts or tonal transitions. 
*   Use `surface_container_low` for the main workspace area.
*   Use `surface_container_lowest` (#ffffff) for floating cards.
*   The transition between the Sidebar (`surface_container_lowest`) and the Canvas should be defined by the shift to the Sky Blue Gradient, not a stroke.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers.
1.  **Level 0 (Canvas):** The Sky Blue Gradient (#819bff to #2b51c7). This provides the "soul" of the application.
2.  **Level 1 (Panels):** Solid white (`surface_container_lowest`) sidebars or large content areas.
3.  **Level 2 (Objects):** Glassmorphic cards. Use white at 80% opacity with a `backdrop-blur` of 12px–20px. This allows the background gradient to bleed through softly, grounding the card in the environment.

---

## 3. Typography

The typographic system relies on a high-contrast pairing: the structural authority of **Manrope** and the technical precision of **Inter**.

*   **Display & Headlines (Manrope):** Use `display-lg` (3.5rem) and `headline-lg` (2rem) with Extra Bold (800) or Bold (700) weights. These should feel like editorial mastheads, commanding attention.
*   **Body & Utility (Inter):** Use `body-lg` (1rem) for standard text and `label-md` (0.75rem) for technical data. Inter's tall x-height ensures legal documents remain legible even at smaller scales.
*   **Intentional Scale:** Do not be afraid of "wasted" space. A `headline-lg` title should have significant padding-bottom (using the `xl` spacing scale) to separate it from the content below, creating a "premium" feel.

---

## 4. Elevation & Depth

### The Layering Principle
Depth is achieved through **Tonal Layering**. Instead of using shadows to indicate every interactive element, use the Material surface tiers:
*   Place a `surface_container_highest` element inside a `surface_container_low` area to indicate a "pressed" or "nested" functional zone.

### Ambient Shadows
When a card must float, use the "Subtle Blue Shadow":
*   **Value:** `0px 8px 24px rgba(43, 81, 199, 0.08)`
*   This shadow is tinted with the primary blue color, mimicking how light would naturally refract through glass onto a blue surface. Avoid neutral grey shadows; they feel "dirty" in this vibrant environment.

### The "Ghost Border" Fallback
If a containment line is legally or functionally required, use a **Ghost Border**:
*   `outline_variant` at 15% opacity. It should be felt, not seen.

---

## 5. Components

### Buttons
*   **Primary:** Pill-shaped (`rounded-full`), using the `primary` fill with `on_primary` text.
*   **Secondary:** Pill-shaped, `surface_container_highest` fill. No border.
*   **States:** On hover, primary buttons should transition to `primary_container` with a subtle increase in the ambient blue shadow.

### Glass Cards
The signature component of this design system.
*   **Corner Radius:** `md` (1.5rem/24px) or `lg` (2rem/32px).
*   **Material:** White glass (#ffffff at 85% opacity) + `backdrop-blur: 16px`.
*   **Constraint:** Never use dividers inside a card. Use `body-md` spacing to separate header, body, and footer.

### Input Fields
*   **Style:** Subtle `surface_container_highest` background. 
*   **Focus State:** A 2px `primary` "Ghost Border" (at 40% opacity) that glows slightly.
*   **Shape:** `md` (1.5rem) corner radius to match the cards.

### Sidebar
*   **Structure:** Solid White (#ffffff). 
*   **Logo:** The logo {{DATA:IMAGE:IMAGE_1}} must be placed in the top-left with a padding of at least 32px (`lg` scale) to act as the anchor of the layout.
*   **Active State:** Use a vertical "pill" indicator in `tertiary_fixed` (Green) next to the active nav item to provide a high-contrast focal point.

---

## 6. Do's and Don'ts

### Do
*   **Do use asymmetric layouts:** Align a large title to the left and leave the right 30% of the canvas empty for "breathing room."
*   **Do lean into the gradient:** Let the sky blue background be visible between cards. The "gaps" are as important as the content.
*   **Do use "Pill" shapes for interactors:** Buttons, tags, and search bars should all use the `full` roundedness scale.

### Don't
*   **Don't use 1px solid borders:** This is the quickest way to make the design look like a legacy "enterprise" tool.
*   **Don't use pure black (#000000):** Use `on_surface` (#191c20) for a softer, more premium contrast.
*   **Don't crowd the cards:** If a card feels full, increase the padding or split the content. High-end design is defined by what you leave out.
*   **Don't use standard icons:** Use "Light" or "Thin" weight icon sets to match the elegance of the Manrope/Inter pairing.