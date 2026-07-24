# Selective HDR Reflection + Centered Framing — Design

**Date:** 2026-07-24
**Feature area:** `src/features/home-scene`
**Status:** Approved (pending spec review)

## Problem

The home 3D scene loads an equirectangular panorama (`80m-nano-green`) and uses it as
**both** the scene's image-based lighting/reflection source (`scene.environment`) **and**
the visible background sky (`scene.background`). Because that panorama has a strong green
cast, the green bleeds across the entire scene — buildings, walls, ground, and trees all
pick up a green tint from the global IBL, and the green sky is visible behind the model.

Separately, the default camera framing uses hardcoded coordinates
(`position [-220, 53, -88]`, `target [-5, 20, -7]`). The model file has since changed
(`88RES 06(1).glb`), so those hardcoded values no longer reliably center the complex in
the viewport.

## Goals

1. **Selective reflections.** The HDR environment must be visible **only** as reflections
   on a specific set of reflective materials — anything matching:
   ```
   /glass|balcon|win_glass|railing|obj_railing|material__2558|material__2556|window/i
   ```
   It must **not** influence any other object or material (buildings, walls, ground,
   terrain, trees). This removes the green tint from everything except intended glass /
   balcony / railing / window surfaces.

2. **No visible HDR background.** `scene.background` is disabled (set to `null`). The
   canvas already runs with `alpha: true` (`HOME_GL_CONFIG` in `src/utils/constant.js`),
   so the page's `bg-background` shows behind the buildings. No green sky.

3. **Centered framing.** The residential complex must sit centered in the viewport at a
   similar oblique aerial angle to the gltfeditor.com reference, and must stay centered
   even if the model file is swapped — so the target/framing is computed from the model's
   actual bounding box rather than hardcoded.

## Non-Goals

- Recoloring or color-correcting the panorama itself (rejected approach B).
- Swapping the panorama for a different sky HDR (rejected approach C).
- Pixel-perfect reproduction of the gltfeditor camera angle. Close is acceptable; final
  framing is fine-tuned with the DEV camera-coordinate HUD after the change lands.
- Any change to per-unit type views (`type-a`, `type-d`, etc.) or their configs.

## Approach

### Part 1 — HDR reflects only on the reflective material set

**Root cause:** `scene.environment` applies IBL to every PBR material in the scene
globally; `scene.background` shows the panorama as sky.

**Chosen mechanism:** keep `scene.environment = envMap` as the shared reflection source,
but **gate the environment's contribution per material** so only the reflective set uses
it. In the existing mesh traverse in `use-home-scene.js`:

- Default **every** material to `envMapIntensity = 0` (no environment contribution → no
  green on buildings / ground / trees).
- For materials whose name matches the reflective regex, set `envMapIntensity` to a
  visible reflection value so they reflect the HDR. The existing `GLASS` mirror-physical
  upgrade is preserved for the `glass` material specifically.

In `environment-setup.jsx`, set **`scene.background = null`** (keep `scene.environment`
set). Cleanup on unmount restores the previous values as it does today.

> Implementation note: whether to keep `scene.environment` + `envMapIntensity = 0`
> masking, versus `scene.environment = null` + explicit per-material `envMap`, will be
> finalized from the three.js version semantics verified during planning. Both achieve
> "only these materials reflect the HDR"; the plan picks the one that reliably removes
> **both** diffuse IBL and specular reflection from the non-reflective materials.

### Part 2 — Centered framing from the model bounding box

- In `use-home-scene.js`, after cloning the scene, compute
  `new THREE.Box3().setFromObject(clone)` and derive `center` and `size`. Return
  `{ scene, center, size }` from the hook.
- In `home-scene/index.jsx`:
  - Set the `OrbitControls` `target` to the computed `center`.
  - Preserve the current oblique aerial viewing **direction** (the normalized
    `position − target` offset), but scale the camera **distance** so the whole bounding
    box fits within the 35° FOV (with a small padding factor).
  - Set `minDistance` / `maxDistance` as a band around that computed fit distance.

## Files Touched

| File | Responsibility of change |
|------|--------------------------|
| `src/features/home-scene/environment-setup.jsx` | Disable visible HDR background (`scene.background = null`); keep env as reflection source. |
| `src/features/home-scene/use-home-scene.js` | Default `envMapIntensity = 0`; re-enable only for the reflective regex set; keep glass mirror upgrade; compute + return bounding-box `center`/`size`. |
| `src/features/home-scene/index.jsx` | Consume `center`/`size`; set orbit target to center; fit camera distance to bbox; set min/max distance band. |

## Testing / Verification

This is a visual rendering change in a React-Three-Fiber scene with no existing component
test harness. Verification is:

1. Logic-level assertions where feasible (pure helper functions: the reflective-material
   predicate and the camera fit-distance math extracted as testable functions).
2. Manual verification in the dev app using the DEV camera-coordinate HUD: confirm the
   complex is centered, no green tint on buildings/ground/trees, and reflections still
   appear on glass/railing/window surfaces.

## Risks / Open Questions (resolved during planning)

- Exact material names in `88RES 06(1).glb` — verify the regex matches real reflective
  materials and misses none (e.g. a glass material not named "glass").
- Three.js installed version semantics for `envMapIntensity = 0` fully removing IBL.
- Whether the DEV HUD currently receives live camera updates (the container passes
  `onCameraChange`, but `HomeScene` may not call it).

## Honest Caveat

The implementer/agent cannot see the live render. The framing will land close but may
need a small manual nudge via the DEV HUD after the change is running.
