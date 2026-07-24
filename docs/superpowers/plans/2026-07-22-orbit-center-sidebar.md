# Center Home Orbit on 7 Buildings + Sidebar-Aware Canvas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the home 3D scene pivot/orbit around the true center of the 7 buildings and render centered within the visible canvas area (not hidden behind the always-expanded 225px sidebar).

**Architecture:** Two independent changes. (1) Set the OrbitControls target to the measured AABB center of the buildings' floor structure so orbiting is equidistant in all directions. (2) Reserve the sidebar's real width on the home canvas via shared Tailwind width tokens, so "centered in the canvas" equals "centered on screen" — no projection offset, orbit stays balanced.

**Tech Stack:** React, @react-three/fiber + @react-three/drei (Three.js), Tailwind CSS 3.4.19, Vite.

## Global Constraints

- No changes to lighting, environment map, materials, camera position, FOV, or near/far.
- Camera position stays exactly `[-173, 53, -88]`.
- Layout offset must be RTL/Hebrew-safe (logical properties) and apply only at `lg+`.
- Sidebar width and canvas offset must derive from a single source of truth (Tailwind tokens).
- No unit-test runner exists in this project; verification is `npm run lint`, `npm run build`, and explicit in-browser visual checks.
- Commit after each task. Branch is `features/latest-model-23-feb` (not a default branch) — commit directly.

---

### Task 1: Shared nav-width tokens + sidebar-aware canvas offset

Reserve the sidebar's real width so the home canvas occupies only the visible area. Introduce
`nav-rail` (55px) and `nav-expanded` (225px) as Tailwind spacing tokens and reference them from
the sidebar, the layout rail, and the home canvas offset.

**Files:**
- Modify: `tailwind.config.js` (add `theme.extend.spacing`)
- Modify: `src/containers/sidebar-nav/index.jsx:33` (use tokens)
- Modify: `src/layouts/main-layout/index.jsx:26` (use token)
- Modify: `src/containers/home/index.jsx:14` (canvas offset)

**Interfaces:**
- Produces: Tailwind spacing tokens `nav-rail` = `55px`, `nav-expanded` = `225px`, usable as
  `w-nav-rail`, `w-nav-expanded`, and inside `theme(spacing.nav-rail)` / `theme(spacing.nav-expanded)`.

- [ ] **Step 1: Add the spacing tokens to Tailwind**

In `tailwind.config.js`, inside `theme.extend` (add as a new key alongside `colors`):

```js
      spacing: {
        "nav-rail": "55px",
        "nav-expanded": "225px",
      },
```

- [ ] **Step 2: Use the tokens in the sidebar width**

In `src/containers/sidebar-nav/index.jsx`, line 33, replace:

```jsx
        isExpanded ? "w-[225px]" : "w-[55px]",
```

with:

```jsx
        isExpanded ? "w-nav-expanded" : "w-nav-rail",
```

- [ ] **Step 3: Use the token for the reserved rail in the layout**

In `src/layouts/main-layout/index.jsx`, line 26, replace:

```jsx
      <div className="hidden lg:block w-[55px] h-full shrink-0 relative z-[110]">
```

with:

```jsx
      <div className="hidden lg:block w-nav-rail h-full shrink-0 relative z-[110]">
```

- [ ] **Step 4: Offset the home canvas by the sidebar overlap**

In `src/containers/home/index.jsx`, line 14, replace the outer container:

```jsx
    <div className="relative flex-1 w-full h-full overflow-hidden bg-background">
```

with (adds `lg:ps-[...]` = expanded − rail = 170px, RTL-safe, lg+ only):

```jsx
    <div className="relative flex-1 w-full h-full overflow-hidden bg-background lg:ps-[calc(theme(spacing.nav-expanded)_-_theme(spacing.nav-rail))]">
```

Note: the underscores around `-` are Tailwind's escaping for spaces, so the compiled value is
`calc(theme(spacing.nav-expanded) - theme(spacing.nav-rail))`. If Tailwind emits no rule for
this class (check Step 6), fall back to `lg:ps-[170px]` with a comment `// 225px nav-expanded - 55px nav-rail`.

- [ ] **Step 5: Lint**

Run: `npm run lint`
Expected: PASS (no new errors in the four changed files).

- [ ] **Step 6: Build to confirm the tokens/arbitrary value compile**

Run: `npm run build`
Expected: build succeeds. Then confirm the offset class produced CSS:

Run: `grep -R "padding-inline-start" dist/assets/*.css | head`
Expected: a rule with `padding-inline-start:170px` (or `calc(225px - 55px)`).
If nothing is found, apply the `lg:ps-[170px]` fallback from Step 4 and rebuild.

- [ ] **Step 7: Visual verification (desktop, lg+)**

Run: `npm run dev` and open the home page in a `lg+` viewport.
Expected:
- The 7 buildings are horizontally centered in the area to the right of the sidebar (no heavy
  empty band on the right).
- The sidebar still renders at 225px on home.
- Navigate to `/inventory`: sidebar collapses to 55px on mouse-out and expands on hover
  (unchanged behavior); page layout unchanged.
- Switch to Hebrew (עברית): sidebar moves to the right, and the canvas offset flips to the
  right so the buildings stay centered in the visible area.

- [ ] **Step 8: Commit**

```bash
git add tailwind.config.js src/containers/sidebar-nav/index.jsx src/layouts/main-layout/index.jsx src/containers/home/index.jsx
git commit -m "feat(home): reserve sidebar width so 3D canvas centers in visible area

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Orbit target at the 7-building center

Move the OrbitControls pivot to the measured AABB center of the buildings so orbiting is
equidistant in all directions and the buildings sit vertically centered.

**Files:**
- Modify: `src/features/home-scene/index.jsx:49-50` (orbitTarget constant + comment)

**Interfaces:**
- Consumes: nothing from Task 1 (independent).
- Produces: `orbitTarget = [3, 10, -4]` passed to `<OrbitControls target={...} />` (line 86).

- [ ] **Step 1: Update the target constant and its comment**

In `src/features/home-scene/index.jsx`, replace lines 49-50:

```jsx
  // Hardcoded camera position and target from the user's manual adjustment
  const orbitTarget = [-5.0, 20, -7.0];
```

with:

```jsx
  // Orbit pivot = measured AABB center of the 7 buildings' floor structure in
  // 88-fixed.glb (the FLOOR_* slabs, excluding FLOOR__PARK): X/Z center 3.13/-3.82,
  // rounded to 3/-4; Y=10 is building mid-height (floor structure mid ~8.2, bumped
  // for roofs/parapets above the top floor plate). Pivoting here keeps the view
  // equidistant left<->right and front<->back when orbiting, and centers the
  // buildings vertically (the previous Y=20 sat above them -> sky-heavy top).
  const orbitTarget = [3, 10, -4];
```

Leave line 51 (`const defaultCameraPosition = [-173, 53, -88];`) unchanged.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 3: Visual verification**

Run: `npm run dev` and open the home page.
Expected:
- The buildings are vertically centered (no heavy sky band on top; roughly equal space
  above and below the building masses).
- Drag to orbit: the building cluster stays framed with roughly equal margin all the way
  around (balanced pivot), confirming the target is at the cluster center.
- The camera starts from the same position/angle as before, just tilted slightly more
  steeply toward the lower target.

- [ ] **Step 4: Commit**

```bash
git add src/features/home-scene/index.jsx
git commit -m "feat(home): orbit target at measured 7-building center

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- Sidebar width factored into canvas → Task 1 (shared tokens + offset). ✓
- Orbit target at 7-building center, equidistant all directions → Task 2. ✓
- Vertical centering (top/bottom) → Task 2 (Y 20 → 10). ✓
- Camera position unchanged → Global Constraints + Task 2 Step 1 leaves line 51. ✓
- RTL-safe, lg+ only, single source of truth → Task 1 Steps 1–4. ✓

**Placeholder scan:** No TBD/TODO; every code step shows exact code and exact file:line. The
only conditional is the documented Tailwind fallback (Task 1 Steps 4/6), which includes the
exact fallback class. ✓

**Type consistency:** Token names `nav-rail`/`nav-expanded` used identically in
`tailwind.config.js`, `sidebar-nav`, `main-layout`, and the `home` `theme(...)` reference.
`orbitTarget` shape `[x,y,z]` matches `<OrbitControls target={orbitTarget}>` usage. ✓
