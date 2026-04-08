---
trigger: always_on
glob:
  - "src/**/*.{css,jsx,tsx}"
  - "tailwind.config.js"
  - "src/index.css"
description: Enforce styling and theming standards per SOP §13
---

# Styling & Theming Rules (SOP §13)

## Styling System

- The project uses **Tailwind CSS 3** as the single styling system.
- **Mixing** multiple styling systems (CSS Modules, Styled Components, etc.) is NOT allowed.
- **Inline styles** should be avoided except for dynamic values (e.g., GSAP-controlled heights).

## Theme Provider

- Theming is handled via **CSS custom properties** defined in `src/index.css` (shadcn pattern).
- All theme values (colors, radii, spacing) are defined as CSS variables.
- UI components MUST consume theme values instead of hardcoded styles.

### CSS Custom Properties (index.css)

```css
@layer base {
  :root {
    --background: 0 0% 2%;          /* #050505 */
    --foreground: 0 0% 100%;        /* white */
    --card: 0 0% 12%;               /* card backgrounds */
    --border: 0 0% 100% / 0.1;      /* subtle borders */
    --sidebar-bg: 220 18% 16%;      /* #1f2530 */
    --sidebar-card: 220 15% 20%;    /* card inside sidebar */
    /* ... additional tokens ... */
  }
}
```

## Design Tokens

Design tokens MUST be defined centrally in `index.css` or `tailwind.config.js`:

| Token Type | Where Defined | Example |
|---|---|---|
| Colors | `tailwind.config.js` `extend.colors` + CSS vars | `bg-background`, `text-foreground` |
| Font sizes | Tailwind defaults or `extend.fontSize` | `text-sm`, `text-base` |
| Spacing | Tailwind defaults | `p-4`, `gap-3`, `m-2` |
| Border radius | `tailwind.config.js` `extend.borderRadius` | `rounded-xl`, `rounded-full` |
| Z-index | Named levels in constants or Tailwind | `z-[1000]` for overlays |

### ❌ Hardcoded Values (Forbidden)

```jsx
// ❌ BAD: Hardcoded color
<div className="bg-[#1f2530]">

// ✅ GOOD: Using design token
<div className="bg-sidebar">
```

**Exception:** One-off 3D-specific values (e.g., Three.js material colors defined in `UNIT_COLORS` constant) are acceptable since they operate outside the CSS layer.

## Dark Mode

- This project uses **dark mode only** (no light mode toggle needed).
- Components must NOT contain hardcoded light or dark colors.
- All colors must reference CSS custom properties or Tailwind theme values.

## Font

- **Primary font**: Outfit (loaded via `@fontsource-variable/outfit`).
- Use the `font-outfit` Tailwind utility class.
- Do not import or use other fonts without approval.

## Utility Function

Use `cn()` from `src/lib/utils.js` for conditional class merging:

```js
import { cn } from "@/lib/utils";

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  variant === "primary" && "primary-classes"
)} />
```
