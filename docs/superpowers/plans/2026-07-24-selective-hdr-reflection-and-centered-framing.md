# Selective HDR Reflection + Centered Framing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the `80m-nano-green` HDR reflect **only** on a specific set of glass/railing/window materials (removing the green tint from the whole scene), hide the HDR background, and center the residential complex in the viewport from the model's real bounding box.

**Architecture:** Three.js `scene.environment` is dropped (it applies global IBL to every PBR material, which is what tints everything green — and per-material `envMapIntensity=0` masking is silently overridden in three r172). Instead, a PMREM env map is generated once and assigned **per-material** (`material.envMap`) only to materials matching the reflective regex; every other material keeps `envMap === null` and is lit by lights alone. `scene.background` is left `null` so the transparent canvas (`alpha:true`) shows the page background. Camera target + distance are computed from `new THREE.Box3().setFromObject(model)` so framing is robust to model swaps.

**Tech Stack:** three 0.172.0, @react-three/fiber 9.5.0, @react-three/drei 10.7.7, React 19.2, Vite, Vitest 4 (configured but currently dormant).

## Global Constraints

- **three.js version:** 0.172.0 — `scene.environment` auto-applies IBL to all `MeshStandardMaterial`/`MeshPhysicalMaterial`; a material's own `envMapIntensity` is **ignored** while it relies on `scene.environment` (three overwrites it with `scene.environmentIntensity` each frame). Per-material control REQUIRES `material.envMap` be set on that material.
- **Adding/removing `material.envMap` requires `material.needsUpdate = true`** (shader recompile). Changing only the numeric `envMapIntensity` does NOT.
- **Cache safety:** `useGLTF` caches the source scene; `scene.clone()` shares material *references*. NEVER mutate a shared material in place — clone it (or replace it) before setting `envMap`/roughness/etc. (The existing GLASS branch already builds a fresh material; the GROUND branch already `.clone()`s. New reflective assignments must do the same.)
- **Bounding box:** call `clone.updateMatrixWorld(true)` immediately before `new THREE.Box3().setFromObject(clone)`, or world matrices may be stale and the center/size wrong.
- **Reflective material regex (user-specified, verbatim — do not alter):**
  ```
  /glass|balcon|win_glass|railing|obj_railing|material__2558|material__2556|window/i
  ```
- **Env asset:** keep the current `/hdr/80m-nano-green.jpg` (the real `.hdr` also exists but the code has always used the `.jpg`; swapping is out of scope — see "Open decisions").
- **Verification:** no runnable test suite exists today (`vitest` is a devDep, but there is no `test` script, no `src/test-setup.js` referenced by `vite.config.js`, and zero test files). Pure logic is unit-tested (Task 1 fixes the dormant setup); R3F glue is verified via `npm run build` + `npm run dev` manual inspection. There is NO screenshot/visual-regression tooling.
- **Platform:** Windows, PowerShell primary; Bash tool available. Vite dev server on port 5173.

## Decisions (resolved 2026-07-24)

- **Reflective set:** use the user's regex **verbatim** — no refinement. Consequences accepted by the user:
  - Wood materials that WILL get mirror reflections (intentional): `adskMatD__RAILING__WOOD`, `adskMatG__WOOD_RAILING`, `PINE_RAILING`, `adskMatD__FL__BALCON`, `adskMatRAILING___CAFE`.
  - Reflective-looking materials that will NOT reflect (intentionally left out): `WIN_BigWAll`, `adskMatWIN_BigWAll`, `adskMatG__Wall_WIN`, `Water`, `POOL_WATER`, `adskMatPOOL_`, `adskMatPOOL_FRAME`, `Chrom`, `Panel_Chrom`, `Metal___Aluminium*` family, `Material__2551`, `Material__2554`.
- **DEV camera HUD rewire (Task 6): DESCOPED** at user request. Framing is verified by eye. The HUD remains non-functional in the working tree; this is accepted.
- **Env asset:** keep the current `/hdr/80m-nano-green.jpg`; do NOT swap to the real `.hdr`. (Out of scope.)

## File Structure

| File | Change | Responsibility |
|------|--------|----------------|
| `src/features/home-scene/reflection-utils.js` | **Create** | Pure, testable helpers: `isReflectiveMaterial(name)` and `computeCameraFit(...)`. No three.js scene objects; only math + regex + plain arrays. |
| `src/features/home-scene/reflection-utils.test.js` | **Create** | Unit tests for both helpers using real material names + known geometry. |
| `src/test-setup.js` | **Create** | Fixes the missing setup file `vite.config.js` already references. Imports `@testing-library/jest-dom`. |
| `package.json` | **Modify** | Add `"test"` / `"test:watch"` scripts (vitest already installed). |
| `src/features/home-scene/use-env-map.js` | **Create** | `useEnvMap()` — loads the equirect JPEG, builds a PMREM cube-UV texture, returns it. Producer only; does not touch `scene.environment`/`background`. |
| `src/features/home-scene/use-home-scene.js` | **Modify** | Accept `envMap` param. In the existing traverse: assign `envMap` (clone-safe) only to reflective-regex materials (incl. the upgraded GLASS); leave all others with no envMap. Compute + return bounding-box `center`/`size`. |
| `src/features/home-scene/index.jsx` | **Modify** | Call `useEnvMap()` + `useHomeScene(envMap)`; remove `<EnvironmentSetup>`; set OrbitControls `target` = center; compute camera position/near/far/min/max via `computeCameraFit`. |
| `src/features/home-scene/environment-setup.jsx` | **Delete** | Its sole job was applying the global `scene.environment`/`background`, which this change removes. |

_(DevMarkers HUD rewire — descoped per user; see Decisions above.)_

---

## Task 1: Test setup + `isReflectiveMaterial` predicate

**Files:**
- Create: `src/test-setup.js`
- Modify: `package.json` (scripts block)
- Create: `src/features/home-scene/reflection-utils.js`
- Test: `src/features/home-scene/reflection-utils.test.js`

**Interfaces:**
- Produces: `isReflectiveMaterial(name: string) => boolean` — true iff `name` matches the reflective regex. Used by Task 4.

- [ ] **Step 1: Create the missing test setup file**

`vite.config.js` already declares `setupFiles: ["./src/test-setup.js"]` but the file does not exist. Create `src/test-setup.js`:

```js
import "@testing-library/jest-dom";
```

- [ ] **Step 2: Add test scripts to `package.json`**

In the `"scripts"` object, add these two entries (keep existing scripts unchanged):

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Write the failing test**

Create `src/features/home-scene/reflection-utils.test.js`. These names are the REAL material names from `88RES 06(1).glb`:

```js
import { describe, it, expect } from "vitest";
import { isReflectiveMaterial } from "./reflection-utils";

describe("isReflectiveMaterial", () => {
  it("matches the intended reflective materials", () => {
    for (const name of [
      "GLASS",
      "Balcon_Glass",
      "Win_Glass",
      "Win_Glass_1",
      "Win_Glass_2",
      "Material__2556",
      "Material__2558",
      "adskMatCLUB_RAILING",
      "adskMatRAILING___GADER_01",
      "Metal___Aluminium_Anthracite_Windows_Doors",
    ]) {
      expect(isReflectiveMaterial(name)).toBe(true);
    }
  });

  it("does not match non-reflective materials", () => {
    for (const name of [
      "adskMatE__GROUND",
      "_GRASS_01_1",
      "Gray_BUILD",
      "adskMatBETON__GREEN",
      "Stone_roof",
      "Mango_Tree",
      "",
    ]) {
      expect(isReflectiveMaterial(name)).toBe(false);
    }
  });

  it("is case-insensitive and null-safe", () => {
    expect(isReflectiveMaterial("glass")).toBe(true);
    expect(isReflectiveMaterial(undefined)).toBe(false);
    expect(isReflectiveMaterial(null)).toBe(false);
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npm run test`
Expected: FAIL — `reflection-utils.js` does not exist / `isReflectiveMaterial is not a function`.

- [ ] **Step 5: Write the minimal implementation**

Create `src/features/home-scene/reflection-utils.js`:

```js
// Materials whose surfaces should reflect the HDR environment. User-specified
// set: glass, balconies, window glass, railings, and two explicit materials.
const REFLECTIVE_NAME_RE =
  /glass|balcon|win_glass|railing|obj_railing|material__2558|material__2556|window/i;

/**
 * True when a material name belongs to the reflective set (glass / balcony /
 * railing / window). Used to decide which materials get an env map assigned.
 */
export const isReflectiveMaterial = (name) =>
  typeof name === "string" && REFLECTIVE_NAME_RE.test(name);
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm run test`
Expected: PASS (3 tests in `reflection-utils.test.js`).

- [ ] **Step 7: Commit**

```bash
git add src/test-setup.js package.json src/features/home-scene/reflection-utils.js src/features/home-scene/reflection-utils.test.js
git commit -m "feat(home-scene): add reflective-material predicate + vitest setup"
```

---

## Task 2: `computeCameraFit` bounding-box framing math

**Files:**
- Modify: `src/features/home-scene/reflection-utils.js`
- Test: `src/features/home-scene/reflection-utils.test.js`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces:
  ```
  computeCameraFit({
    center: [number,number,number],
    size:   [number,number,number],   // bounding-box dimensions
    fovDeg: number,                    // vertical fov in degrees
    aspect: number,                    // viewport width / height
    direction: [number,number,number], // normalized camera-from-center dir
    padding?: number                   // default 1.2
  }) => {
    position: [number,number,number],
    target:   [number,number,number],  // === center
    distance: number,
    near: number,
    far: number,
    minDistance: number,
    maxDistance: number
  }
  ```
  Used by Task 5. `direction` default is the current view direction `[-0.9263, 0.1422, -0.3490]` (normalized `[-215, 33, -81]` = current `position − target`).

- [ ] **Step 1: Write the failing test**

Append to `src/features/home-scene/reflection-utils.test.js`:

```js
import { computeCameraFit } from "./reflection-utils";

describe("computeCameraFit", () => {
  const base = {
    center: [0, 0, 0],
    size: [100, 40, 100],
    fovDeg: 35,
    aspect: 16 / 9,
    direction: [0, 0, 1],
  };

  it("places the camera on the direction ray at the fit distance", () => {
    const fit = computeCameraFit(base);
    // direction is +Z, center is origin -> position is [0,0,distance]
    expect(fit.position[0]).toBeCloseTo(0, 5);
    expect(fit.position[1]).toBeCloseTo(0, 5);
    expect(fit.position[2]).toBeCloseTo(fit.distance, 5);
    expect(fit.target).toEqual([0, 0, 0]);
  });

  it("returns a positive distance large enough to clear the bounding sphere", () => {
    const fit = computeCameraFit(base);
    const radius = Math.hypot(100, 40, 100) / 2;
    expect(fit.distance).toBeGreaterThan(radius);
    expect(fit.near).toBeGreaterThan(0);
    expect(fit.far).toBeGreaterThan(fit.distance);
    expect(fit.minDistance).toBeLessThan(fit.distance);
    expect(fit.maxDistance).toBeGreaterThan(fit.distance);
  });

  it("moves the camera farther for a bigger model", () => {
    const small = computeCameraFit(base);
    const big = computeCameraFit({ ...base, size: [200, 80, 200] });
    expect(big.distance).toBeGreaterThan(small.distance);
  });

  it("offsets the position by the (non-origin) center", () => {
    const fit = computeCameraFit({ ...base, center: [10, 20, -7] });
    expect(fit.position[0]).toBeCloseTo(10, 5);
    expect(fit.position[1]).toBeCloseTo(20, 5);
    expect(fit.position[2]).toBeCloseTo(-7 + fit.distance, 5);
    expect(fit.target).toEqual([10, 20, -7]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test`
Expected: FAIL — `computeCameraFit is not a function`.

- [ ] **Step 3: Write the minimal implementation**

Append to `src/features/home-scene/reflection-utils.js`:

```js
const DEG2RAD = Math.PI / 180;

/**
 * Compute a camera placement that frames an axis-aligned bounding box in a
 * perspective view. Fits the model's bounding SPHERE (radius = half the box
 * diagonal), which is orientation-independent and handles both landscape and
 * portrait aspect ratios via the derived horizontal fov.
 */
export const computeCameraFit = ({
  center,
  size,
  fovDeg,
  aspect,
  direction,
  padding = 1.2,
}) => {
  const radius = Math.hypot(size[0], size[1], size[2]) / 2;

  const fovV = fovDeg * DEG2RAD;
  const fovH = 2 * Math.atan(Math.tan(fovV / 2) * aspect);

  // Sphere-tangent condition: sin(halfFov) = radius / distance.
  const distV = radius / Math.sin(fovV / 2);
  const distH = radius / Math.sin(fovH / 2);
  const distance = Math.max(distV, distH) * padding;

  // Normalize the requested direction (guard against a zero vector).
  const dl = Math.hypot(direction[0], direction[1], direction[2]) || 1;
  const dir = [direction[0] / dl, direction[1] / dl, direction[2] / dl];

  const position = [
    center[0] + dir[0] * distance,
    center[1] + dir[1] * distance,
    center[2] + dir[2] * distance,
  ];

  return {
    position,
    target: [center[0], center[1], center[2]],
    distance,
    near: Math.max(distance - radius * 2, 0.1),
    far: distance + radius * 3,
    minDistance: distance * 0.6,
    maxDistance: distance * 1.6,
  };
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test`
Expected: PASS (all `reflection-utils.test.js` tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/home-scene/reflection-utils.js src/features/home-scene/reflection-utils.test.js
git commit -m "feat(home-scene): add computeCameraFit bounding-box framing helper"
```

---

## Task 3: `useEnvMap` PMREM producer hook

**Files:**
- Create: `src/features/home-scene/use-env-map.js`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `useEnvMap() => THREE.Texture | null` — a PMREM cube-UV texture suitable for assigning to `material.envMap`. Used by Task 5 (passed into `useHomeScene`).

> Not unit-tested: it needs a live WebGL renderer (`gl`). Verified by `npm run build` (compiles) + Task 5 manual check (reflections appear on glass). This preserves the exact PMREM pipeline the deleted `environment-setup.jsx` used, minus the global `scene.environment`/`background` assignment.

- [ ] **Step 1: Create the hook**

Create `src/features/home-scene/use-env-map.js`:

```js
import { useMemo } from "react";
import { useThree, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { getAssetPath } from "@/utils/constant";
import { logger } from "@/utils/logger";

const ENV_PATH = getAssetPath("/hdr/80m-nano-green.jpg");

/**
 * useEnvMap — loads the equirectangular JPEG via TextureLoader (correct sRGB
 * handling) and converts it to a PMREM cube-UV texture for image-based
 * reflections.
 *
 * IMPORTANT: this does NOT set scene.environment. In three r172, scene.environment
 * applies IBL to EVERY PBR material globally and overrides per-material
 * envMapIntensity, which is exactly the green-tint-everywhere bug. Instead the
 * returned texture is assigned per-material (material.envMap) only to the
 * reflective set, so nothing else in the scene picks up the environment.
 */
export const useEnvMap = () => {
  const gl = useThree((state) => state.gl);
  const texture = useLoader(THREE.TextureLoader, ENV_PATH);

  return useMemo(() => {
    if (!texture) return null;

    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;

    const pmremGenerator = new THREE.PMREMGenerator(gl);
    pmremGenerator.compileEquirectangularShader();
    const pmremRT = pmremGenerator.fromEquirectangular(texture);
    pmremGenerator.dispose();

    logger.info("[useEnvMap] PMREM generated", {
      width: pmremRT.texture.image?.width,
      height: pmremRT.texture.image?.height,
      colorSpace: pmremRT.texture.colorSpace,
    });

    return pmremRT.texture;
  }, [texture, gl]);
};

export default useEnvMap;
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: build succeeds (no import/syntax errors). The hook is not yet consumed, so runtime behavior is unchanged.

- [ ] **Step 3: Commit**

```bash
git add src/features/home-scene/use-env-map.js
git commit -m "feat(home-scene): add useEnvMap PMREM producer hook"
```

---

## Task 4: Per-material env map + bounding box in `use-home-scene.js`

**Files:**
- Modify: `src/features/home-scene/use-home-scene.js`

**Interfaces:**
- Consumes: `isReflectiveMaterial` (Task 1); `envMap` texture (Task 3, passed as an argument).
- Produces: `useHomeScene(envMap) => { scene, center, size }` where `center`/`size` are `[x,y,z]` arrays from the model bounding box. Used by Task 5.

- [ ] **Step 1: Update imports and the hook signature**

At the top of `src/features/home-scene/use-home-scene.js`, add the predicate import next to the existing imports:

```js
import { isReflectiveMaterial } from "./reflection-utils";
```

Change the hook signature from:

```js
export const useHomeScene = () => {
```

to:

```js
export const useHomeScene = (envMap = null) => {
```

- [ ] **Step 2: Assign the env map to the GLASS material during its upgrade**

In the GLASS branch (where a new `THREE.MeshPhysicalMaterial()` is built), the material currently sets `envMapIntensity` but no `envMap`. Add the env map assignment just before `tuned.needsUpdate = true;`:

```js
          tuned.envMap = envMap;
          tuned.envMapIntensity = GLASS_TUNING.envMapIntensity;
```

(Replace the existing lone `tuned.envMapIntensity = GLASS_TUNING.envMapIntensity;` line with the two lines above so the env map is attached to the fresh material.)

- [ ] **Step 3: Assign the env map to the other reflective materials (clone-safe)**

The current non-glass path only handles GROUND tuning via `getReflectiveTuning`. Replace the GROUND-only block with a block that (a) still forces ground matte, and (b) attaches the env map to reflective-regex materials without mutating the shared cached material.

Find this existing block:

```js
        // (b) GROUND / terrain â force matte so it stops mirroring the sky
        const tuning = getReflectiveTuning(mat.name);
        if (!tuning) return;

        const tuned = mat.clone();
        tuned.roughness = tuning.roughness;
        tuned.metalness = tuning.metalness;
        if (tuning.envMapIntensity !== undefined) {
          tuned.envMapIntensity = tuning.envMapIntensity;
        }
        tuned.needsUpdate = true;

        if (Array.isArray(child.material)) {
          child.material[i] = tuned;
        } else {
          child.material = tuned;
        }
```

Replace it with:

```js
        // (b) Reflective set (glass/balcony/railing/window) â attach the HDR
        //     env map to THIS material only. scene.environment stays null, so
        //     no other material picks up the environment (kills the green tint).
        if (isReflectiveMaterial(mat.name)) {
          const tuned = mat.clone(); // clone: never mutate the useGLTF cache
          tuned.envMap = envMap;
          if (tuned.envMapIntensity === 0) tuned.envMapIntensity = 1.0;
          tuned.needsUpdate = true; // adding envMap toggles a shader #define

          if (Array.isArray(child.material)) {
            child.material[i] = tuned;
          } else {
            child.material = tuned;
          }
          return;
        }

        // (c) GROUND / terrain â force matte so it stops mirroring the sky
        const tuning = getReflectiveTuning(mat.name);
        if (!tuning) return;

        const tuned = mat.clone();
        tuned.roughness = tuning.roughness;
        tuned.metalness = tuning.metalness;
        if (tuning.envMapIntensity !== undefined) {
          tuned.envMapIntensity = tuning.envMapIntensity;
        }
        tuned.needsUpdate = true;

        if (Array.isArray(child.material)) {
          child.material[i] = tuned;
        } else {
          child.material = tuned;
        }
```

- [ ] **Step 4: Compute the bounding box and return center/size**

Find the end of the `useMemo` where it currently returns the clone:

```js
    return clone;
  }, [scene]);

  return {
    scene: sceneClone,
  };
};
```

Replace with a version that computes the bounding box (after forcing world matrices) and returns it. Also key the memo on `envMap` so materials get the env map once it is ready:

```js
    // Force world matrices before measuring; a fresh clone() is not guaranteed
    // to have up-to-date matrixWorld, which would corrupt the bounding box.
    clone.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(clone);
    const c = new THREE.Vector3();
    const s = new THREE.Vector3();
    box.getCenter(c);
    box.getSize(s);

    return {
      clone,
      center: [c.x, c.y, c.z],
      size: [s.x, s.y, s.z],
    };
  }, [scene, envMap]);

  return {
    scene: sceneClone.clone,
    center: sceneClone.center,
    size: sceneClone.size,
  };
};
```

> Note: the `useMemo` variable is still named `sceneClone`; it now holds `{ clone, center, size }`. If you prefer, rename it to `sceneData` for clarity — but keep the returned property `scene` pointing at `.clone`.

- [ ] **Step 5: Verify it compiles**

Run: `npm run build`
Expected: build succeeds. (Runtime still unchanged until Task 5 passes `envMap` and consumes `center`/`size`; `useHomeScene()` with no arg yields `envMap = null`, so reflective materials get `envMap = null` — harmless.)

- [ ] **Step 6: Run unit tests (guard against breaking Task 1/2)**

Run: `npm run test`
Expected: PASS (unchanged — this task adds no tests but must not break the helpers).

- [ ] **Step 7: Commit**

```bash
git add src/features/home-scene/use-home-scene.js
git commit -m "feat(home-scene): assign env map per reflective material + compute model bounds"
```

---

## Task 5: Wire env map + centered framing in `index.jsx`; remove `EnvironmentSetup`

**Files:**
- Modify: `src/features/home-scene/index.jsx`
- Delete: `src/features/home-scene/environment-setup.jsx`

**Interfaces:**
- Consumes: `useEnvMap` (Task 3), `useHomeScene(envMap) => { scene, center, size }` (Task 4), `computeCameraFit` (Task 2).

- [ ] **Step 1: Update imports**

In `src/features/home-scene/index.jsx`, remove the `EnvironmentSetup` import and add the new ones. Also import `useThree` for the viewport aspect and `useMemo`.

Remove:

```js
import EnvironmentSetup from "./environment-setup";
```

Add (near the existing imports):

```js
import { useThree } from "@react-three/fiber";
import useEnvMap from "./use-env-map";
import { computeCameraFit } from "./reflection-utils";
```

Ensure `useMemo` is imported from React (it currently imports `React`; use `React.useMemo` or add `useMemo` to the import). This plan uses `React.useMemo`.

- [ ] **Step 2: Load the env map and consume model bounds**

Change:

```js
  const { scene } = useHomeScene();
  const lightRef = React.useRef();
```

to:

```js
  const envMap = useEnvMap();
  const { scene, center, size } = useHomeScene(envMap);
  const lightRef = React.useRef();
  const { width, height } = useThree((state) => state.size);
```

- [ ] **Step 3: Replace the hardcoded camera/target with the computed fit**

Remove the two hardcoded lines:

```js
  // Hardcoded camera position and target from the user's manual adjustment
  const orbitTarget = [-5.0, 20, -7.0];
  const defaultCameraPosition = [-220, 53, -88];
```

Replace with a memoized fit computed from the model bounds. `DEFAULT_VIEW_DIR` is the current oblique viewing direction (normalized `position − target` = normalized `[-215, 33, -81]`), so the angle stays the same and only the framing distance/centering changes:

```js
  // Preserve the existing oblique aerial viewing direction; only re-center and
  // re-fit the distance so the whole complex frames nicely (robust to model swaps).
  const DEFAULT_VIEW_DIR = [-0.9263, 0.1422, -0.349];

  const fit = React.useMemo(
    () =>
      computeCameraFit({
        center,
        size,
        fovDeg: 35,
        aspect: width / height,
        direction: DEFAULT_VIEW_DIR,
        padding: 1.2,
      }),
    [center, size, width, height],
  );

  const orbitTarget = fit.target;
  const defaultCameraPosition = fit.position;
```

- [ ] **Step 4: Feed the fitted near/far to the camera and min/max to the controls**

Update the `<PerspectiveCamera>` props — keep `fov={35}` but drive `near`/`far` from the fit:

Change:

```js
        fov={35}
        near={0.5}
        far={4000}
        position={defaultCameraPosition}
```

to:

```js
        fov={35}
        near={fit.near}
        far={fit.far}
        position={defaultCameraPosition}
```

Update the `<OrbitControls>` distance clamps. Change:

```js
        minDistance={120}
        maxDistance={250}
```

to:

```js
        minDistance={fit.minDistance}
        maxDistance={fit.maxDistance}
```

- [ ] **Step 5: Remove the `<EnvironmentSetup>` element**

Delete the entire `<EnvironmentSetup ... />` block (and its surrounding comment) from the returned JSX:

```jsx
      {/* 3. Environment Map (IBL) ... */}
      <EnvironmentSetup environmentRotation={[0, environmentRotationY, 0]} />
```

The `environmentRotationY` / `ENVIRONMENT_ROTATION_DEG` constant is still used by the sun-position math (`azimRad`), so leave those computations in place. Only the `<EnvironmentSetup>` element is removed.

- [ ] **Step 6: Delete the now-unused component file**

```bash
git rm src/features/home-scene/environment-setup.jsx
```

- [ ] **Step 7: Verify build + lint**

Run: `npm run build`
Expected: build succeeds, no reference to the deleted `environment-setup`.

Run: `npm run lint`
Expected: no new errors in `src/features/home-scene/*`.

- [ ] **Step 8: Manual verification in the dev app**

Run: `npm run dev` and open `http://localhost:5173`.
Expected:
1. The residential complex is centered in the viewport at the same oblique aerial angle.
2. No green tint on buildings, walls, ground, or trees.
3. Reflections of the sky are visible on glass / balcony-glass / window / railing surfaces.
4. The background behind the buildings is the page background (no green sky).

- [ ] **Step 9: Commit**

```bash
git add src/features/home-scene/index.jsx
git commit -m "feat(home-scene): center camera from model bounds + per-material reflections, drop global environment"
```

---

## Task 6 (DESCOPED per user — do NOT implement): Re-wire the DEV camera HUD for framing fine-tuning

> Left in the document for reference only. The user chose to skip this; the DEV camera HUD stays non-functional and framing is verified by eye.

**Files:**
- Modify: `src/features/home-scene/index.jsx`

**Context:** The working tree removed the `DevMarkers` block, so the container's `onCameraChange` is never called and the bottom-right camera-coordinate HUD never appears — making manual framing fine-tuning impossible. `src/features/home-scene/dev-markers.jsx` still exists on disk.

**Interfaces:**
- Consumes: `onCameraChange` prop from the home container (already passed in `src/containers/home/index.jsx`).

- [ ] **Step 1: Accept the `onCameraChange` prop again**

In the `HomeScene` signature, add `onCameraChange` back:

```js
export const HomeScene = ({
  controlsRef,
  isAutoRotate = false,
  isSunLockedToCamera = false,
  onCameraChange,
}) => {
```

- [ ] **Step 2: Render `DevMarkers` in DEV**

Add the import:

```js
import DevMarkers from "./dev-markers";
```

Add this inside the returned `<Fragment>` (e.g. after `<OrbitControls>`):

```jsx
      {import.meta.env.DEV && (
        <DevMarkers controlsRef={controlsRef} onCameraChange={onCameraChange} />
      )}
```

> Before writing the import/usage, open `src/features/home-scene/dev-markers.jsx` and confirm its actual prop names and default export — match them exactly. If the props differ from `{ controlsRef, onCameraChange }`, adjust this step to the real signature.

- [ ] **Step 3: Verify the HUD works**

Run: `npm run dev`, open the app in DEV.
Expected: the bottom-right "Dev Camera Coordinates" panel shows live 🟢 position and 🔴 target as you orbit. Use it to read/tune framing values; if the client wants a slightly different angle, capture the numbers here.

- [ ] **Step 4: Commit**

```bash
git add src/features/home-scene/index.jsx
git commit -m "fix(home-scene): re-wire DevMarkers so the dev camera HUD works again"
```

---

## Self-Review

**Spec coverage:**
- Goal 1 (HDR reflects only on reflective materials) → Tasks 1, 3, 4 (predicate, PMREM producer, per-material `envMap`; `scene.environment` never set).
- Goal 2 (no visible HDR background) → Task 5 (removed `<EnvironmentSetup>`, `scene.background` left `null`, `alpha:true` → transparent).
- Goal 3 (centered framing from bounding box) → Tasks 2, 4, 5 (`computeCameraFit`, bbox center/size, camera wiring).
- Verification gap in spec (no test infra) → Task 1 fixes the dormant vitest setup; pure logic tested; R3F glue manually verified.
- DEV HUD broken (found during planning) → Task 6 documented but DESCOPED per user; framing verified by eye.

**Placeholder scan:** No TBD/TODO; all code steps include full code; commands include expected output.

**Type consistency:** `isReflectiveMaterial(name)→bool`, `computeCameraFit({center,size,fovDeg,aspect,direction,padding})→{position,target,distance,near,far,minDistance,maxDistance}`, `useEnvMap()→texture|null`, `useHomeScene(envMap)→{scene,center,size}` are used consistently across Tasks 1→5. `center`/`size` are `[x,y,z]` arrays everywhere (hook returns arrays; `computeCameraFit` consumes arrays).

**Known correctness anchors (from ground-truth verification):**
- Per-material `envMap` (not `envMapIntensity=0` masking) — required because three r172 overwrites `envMapIntensity` with `scene.environmentIntensity` when a material has no own `envMap`.
- `material.needsUpdate = true` set wherever `envMap` is added.
- Materials cloned before mutation (cache safety).
- `clone.updateMatrixWorld(true)` before `Box3.setFromObject`.
