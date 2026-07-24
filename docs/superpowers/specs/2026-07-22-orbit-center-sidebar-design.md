# Design — Center the home 3D scene orbit on the 7 buildings, accounting for the sidebar

**Date:** 2026-07-22
**Area:** `src/features/home-scene`, `src/containers/home`, layout width tokens
**Status:** Approved pending spec review

## Problem

On the home page the `88-fixed.glb` scene (a sky-dome hemisphere containing 7 buildings)
does not look centered:

- **Horizontally**, there is more empty space on the right than the left — the buildings
  look pushed toward the sidebar.
- **Vertically**, there is more sky on top than ground below — the buildings sit low.
- Orbiting does not feel balanced around the buildings.

The user wants the OrbitControls to pivot on the true center of the 7 buildings so the view
is equidistant in every direction, and the composition to be centered within the *visible*
canvas (i.e. the sidebar width must be taken into account).

## Root causes (measured from `88-fixed.glb`)

Bounding boxes were computed offline from the GLB node graph (world-space AABBs).

1. **Sidebar overlap.** On the home page the nav sidebar is *permanently expanded to 225px*
   (`src/containers/sidebar-nav/use-sidebar-nav.js` line 88 — `isCollapsible` is only true on
   the inventory route, so `isExpanded` is always true on home). But `main-layout` reserves
   only a **55px** rail in the flex flow and the `<aside>` is `absolute`, so it overlays and
   hides ~**170px** of the canvas's left edge. The canvas is centered in its own box, but
   170px of that box is behind the opaque sidebar → the subject reads as shifted left with
   extra space on the right.

2. **Target height too high.** The current orbit target is `[-5, 20, -7]`. The buildings'
   vertical mid-height is ≈ 10, so a target at Y = 20 sits above them and tilts the framing so
   the buildings fall low in frame (sky-heavy top).

3. **Target not at the building center.** Measured geometry:
   - Sky dome `PANO_Sphere` horizontal center ≈ (−3.5, 2.35).
   - Ground plane `Plane002` center ≈ (−22.9, 2.0).
   - **7-building floor-structure AABB** (the `FLOOR_*` slabs excluding `FLOOR__PARK`):
     center **(3.13, 8.24, −3.82)**, size 73 × 16 × 182.
   The whole-scene AABB is useless as a pivot (dominated by the dome; center Y ≈ 218).
   Runtime auto-classification was rejected: the GLB is a flat list of 3417 unnamed wrappers
   with 6840 cryptic mesh names and no building group node, so a name/heuristic filter would be
   fragile. The model is fixed (`88-fixed.glb`), so a measured, documented constant is the
   robust choice and matches the existing code style (camera position/target are already
   documented constants).

## Solution

Two independent, small changes. No changes to lighting, materials, or camera position.

### 1. Orbit target → measured building center

In `src/features/home-scene/index.jsx`:

- Change `orbitTarget` from `[-5, 20, -7]` to **`[3, 10, -4]`**.
  - X = 3, Z = −4: the AABB center of the 7 buildings' floor structure (rounded from
    3.13 / −3.82) — the midpoint of the building spread, so orbiting is equidistant left↔right
    and front↔back.
  - Y = 10: building mid-height (floor structure mid ≈ 8.2, bumped slightly for roofs/parapets
    above the top floor plate), so the buildings sit vertically centered instead of low.
- Add a comment documenting the derivation (measured AABB center of the `FLOOR_*` slabs of
  `88-fixed.glb`).
- **Camera position unchanged** at `[-173, 53, -88]` (user's choice). Consequence: it looks
  ~12° more steeply down at the lower target, which is the intended fix for the top-heavy sky.
  The user fine-tunes zoom manually if desired.

Because the pivot is now the true center of the building masses, orbiting keeps equal space
around the buildings in all directions.

### 2. Canvas composition → reserve the real sidebar width on home

Make "centered in the canvas" equal "centered in the visible area" by starting the canvas at
the sidebar's real right edge, rather than compensating in the projection. This keeps the
orbit target at the true 3D center (a projection/target offset would unbalance the orbit).

**Single source of truth for the widths** (user's choice):

- `tailwind.config.js` → `theme.extend.spacing`:
  - `'nav-rail': '55px'`
  - `'nav-expanded': '225px'`
- `src/containers/sidebar-nav/index.jsx` → `w-[225px]`/`w-[55px]` become
  `w-nav-expanded`/`w-nav-rail`.
- `src/layouts/main-layout/index.jsx` → the reserved rail `w-[55px]` becomes `w-nav-rail`.
- `src/containers/home/index.jsx` → the outer canvas container gets an inline-start offset on
  `lg+` equal to the overlap (expanded − rail = 170px), derived from the tokens:
  `lg:ps-[calc(theme(spacing.nav-expanded)-theme(spacing.nav-rail))]`.
  - Logical `ps-` (padding-inline-start) so it stays correct in RTL/Hebrew, matching the
    sidebar's `start-0`. Applied to the outer container (which inherits the document `dir`),
    not the inner wrapper that hardcodes `dir="ltr"` for the canvas.
  - `lg:` only: below `lg` the rail is hidden (`hidden lg:block`) and a bottom mobile nav is
    used, so no inline offset is wanted on mobile.
  - Fallback if `calc(theme(...))` in an arbitrary value does not compile in this Tailwind
    setup: use `lg:ps-[170px]` with a comment referencing `nav-expanded − nav-rail`.

After this, the canvas occupies exactly the visible region `[225px, viewport-width]`, so the
building-center target projects to the visible center → balanced horizontally; the lowered
target Y → balanced vertically.

## Files touched

| File | Change |
|---|---|
| `src/features/home-scene/index.jsx` | `orbitTarget` constant + comment |
| `tailwind.config.js` | add `spacing.nav-rail`, `spacing.nav-expanded` |
| `src/containers/sidebar-nav/index.jsx` | use `w-nav-expanded` / `w-nav-rail` |
| `src/layouts/main-layout/index.jsx` | use `w-nav-rail` for the reserved rail |
| `src/containers/home/index.jsx` | `lg:ps-[...]` offset on the canvas container |

## Out of scope

- Camera position / angle / FOV (kept as-is per user).
- Lighting, environment map, materials.
- Inventory page layout and its collapsible sidebar behavior.
- Mobile vertical composition vs. the bottom nav bar.
- Runtime auto-framing / dynamic target computation.

## Verification

- Run the app; on the home page (desktop, `lg+`) confirm the 7 buildings are centered
  left↔right in the area not covered by the sidebar, and vertically centered (no heavy sky
  band on top).
- Orbit (drag): the buildings stay framed with roughly equal margin as the camera rotates
  around, confirming the pivot is at the cluster center.
- Toggle Hebrew (RTL): the sidebar moves to the right and the canvas offset flips with it.
- Confirm the sidebar still renders at 225px (home) / 55px (inventory collapsed) after the
  token swap, and the inventory page is visually unchanged.
- Resize the window: the composition stays centered in the visible area.
