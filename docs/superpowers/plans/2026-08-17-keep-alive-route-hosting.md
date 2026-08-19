# Keep-Alive Route Hosting — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop the loading overlay from appearing on every Home ↔ Inventory navigation by keeping each route's `<Canvas>` mounted — and therefore its WebGL context, compiled shaders and uploaded textures alive — across the switch.

**Architecture:** Routes stop owning the mount of the 3D containers. Each 3D leaf route declares `handle: { keepAlive: "<key>" }`; a new `KeepAliveOutlet` container replaces `<Outlet />` in `MainLayout` and renders every route visited so far, stacked absolutely, with only the active one visible (`visibility: hidden` + `inert` on the rest). The hidden view is frozen with `frameloop="never"` so it costs no GPU time. All scene, material, camera, controls and postprocessing code is untouched.

**Tech Stack:** React 19.2.3, react-router 7.14.2, @react-three/fiber 9.5.0, @react-three/drei 10.7.7, @react-three/postprocessing 3.0.4, three 0.172.0, Vite, Redux Toolkit, Tailwind.

**Spec:** `docs/superpowers/specs/2026-08-17-keep-alive-route-hosting-design.md` — read it before starting; this plan argues from it.

## Global Constraints

- **No git operations.** This repository is treated as read-only per the user's standing instruction (`~/.claude/CLAUDE.md`). Do NOT `git add`, `git commit`, `git checkout`, branch, or stash. Leave all changes in the working tree for the user to review and commit themselves. This overrides the writing-plans skill's default "commit frequently" guidance.
- **No automated tests.** The user explicitly declined expanding scope to repair the dormant Vitest harness. Do NOT create `src/test-setup.js`, do NOT add a `test` npm script, do NOT write `*.test.js` files. Verification is `npm run lint` plus the manual checks in each task. (Known pre-existing debt: `vite.config.js:57` declares `setupFiles: ["./src/test-setup.js"]`, that file does not exist, there is no `test` script, and there are zero test files.)
- **No `.env` file changes.** `.gitignore:28` ignores `.env*` and no env file is tracked in git. The new flag must work with no env file present.
- **Feature flag defaults ON:** `KEEP_ALIVE_ROUTES: import.meta.env.VITE_KEEP_ALIVE_ROUTES !== "false"`. Use `!== "false"`, never `=== "true"` — an opt-in default would ship the feature permanently off given the constraint above.
- **`visibility: hidden`, never `display: none`** for hiding an inactive view. `display: none` collapses the box to 0×0, driving R3F's `ResizeObserver` to resize the renderer to zero and making Inventory's `EffectComposer` allocate a zero-sized render target.
- **Nothing in the Home or Inventory `useFrame` subtrees may read `clock.elapsedTime` or `delta`.** R3F's `setFrameloop` runs `clock.stop()` and `clock.elapsedTime = 0` on every toggle (verified at `node_modules/@react-three/fiber/dist/events-5a94e5eb.esm.js:1043`). Audited and currently safe: `camera-rig.jsx` ignores its callback args, `building-markers/index.jsx` uses `camera`/`size` only, `use-building.js` uses a frame counter, `dev-markers.jsx` is dev-only.
- **Three.js is pinned at 0.172.0, R3F 9.5, drei 10.7.** Verify API shapes against these versions.
- **No raw `console.log`** — use `logger` from `@/utils/logger` (`.agents/rules/error-handling.md`). Note `logger.info`/`logger.warn` are gated on `import.meta.env.DEV` and are stripped from staging/production builds.
- **File naming:** kebab-case files, PascalCase components (`.agents/rules/coding-standards.md`). Hooks return `{ data, handlers }` and contain no JSX, one hook per file (`.agents/rules/hooks-guidelines.md`).
- **Platform:** Windows, PowerShell primary. Dev server: `npm run dev`. Lint: `npm run lint`.

---

## File Structure

| File | Change | Responsibility |
|---|---|---|
| `src/containers/canvas-loader/index.jsx` | **Modify** | Initialise loader state from `useProgress.getState()` in the `useState` initialiser instead of a post-paint effect, so a completed load can never flash a "100%" card. |
| `src/utils/env-config.js` | **Modify** | Add the `KEEP_ALIVE_ROUTES` flag. |
| `src/hooks/use-keep-alive-key.js` | **Create** | Single definition of "which keep-alive route is active", read from `useMatches()`. Consumed by both `MainLayout` and `use-keep-alive-outlet`. |
| `src/containers/keep-alive-outlet/keep-alive-views.js` | **Create** | Plain `{ key: Component }` registry. Adding a future keep-alive route touches this one object literal. |
| `src/containers/keep-alive-outlet/use-keep-alive-outlet.js` | **Create** | Visited-set state, view list derivation, activation instrumentation. No JSX. |
| `src/containers/keep-alive-outlet/index.jsx` | **Create** | The stacked-and-hidden markup; falls through to `<Outlet />` when no keep-alive route matched. |
| `src/routes/index.jsx` | **Modify** | Replace the two leaf `Component` entries with `handle: { keepAlive }`; drop the now-unused page imports. |
| `src/layouts/main-layout/index.jsx` | **Modify** | Render `<KeepAliveOutlet />` instead of `<Outlet />`; derive `railWidth` from the keep-alive key instead of a pathname suffix test. |
| `src/pages/home/index.jsx` | **Modify** | Forward the `active` prop to `HomeContainer`. |
| `src/pages/inventory/index.jsx` | **Modify** | Forward the `active` prop to `InventoryContainer`. |
| `src/containers/home/index.jsx` | **Modify** | Accept `active`; set `frameloop`; pass `active` to `HomeScene`; import `KTX2Init` from its new shared location. |
| `src/features/ktx2-init/index.jsx` | **Create** | `KTX2Init` moved out of `containers/home` so the Inventory canvas can mount it too (required by Task 6). |
| `src/features/home-scene/index.jsx` | **Modify** | Accept `active`; pass to `CameraRig`. |
| `src/features/home-scene/camera-rig.jsx` | **Modify** | Accept `active`; pass as `enabled` to `useAutoRotateHint`. |
| `src/features/home-scene/use-auto-rotate-hint.js` | **Modify** | Add the `enabled` gate so the 20s idle timer cannot fire while the view is hidden. |
| `src/containers/inventory/index.jsx` | **Modify** | Accept `active`; set `frameloop`; mount `<KTX2Init />`; pass `active` to `useInventory`. |
| `src/containers/inventory/use-inventory.js` | **Modify** | Re-key the `?building=X` effect from mount to the false→true activation edge. |
| `src/utils/preloader.js` | **Modify** | Add `whenKTX2Ready()` so out-of-Canvas preloads can await renderer-dependent KTX2 support detection. |
| `src/hooks/use-glb-loader.js` | **Modify** | Add a `preloadGLB(url, configureLoader)` export. |
| `src/main.jsx` | **Modify** | Warm the Home GLB on idle when landing on Inventory (the mirror of the existing Inventory preload). |

---

## Task 1: Fix the `CanvasLoader` first-paint flash

This is a standalone bug, independent of keep-alive: `CanvasLoader` paints a full "Loading Model 100%" card for one frame and then fades it out over 700ms even when there is nothing to load. Doing it first means the rest of the plan is verified against a clean baseline.

**Files:**
- Modify: `src/containers/canvas-loader/index.jsx:12-53`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: nothing consumed by later tasks. `CanvasLoader` keeps its current zero-prop signature: `<CanvasLoader />`.

- [ ] **Step 1: Read the current file**

Read `src/containers/canvas-loader/index.jsx` in full so the surrounding JSX (the glow div, the progress bar, the `dir`/i18n wiring) is preserved verbatim — only the state initialisation changes.

- [ ] **Step 2: Add a module-scope reader for drei's global progress store**

Insert directly below the existing imports, above the component's JSDoc block:

```js
/**
 * drei's `useProgress` is a global zustand store shared by every loader in the
 * app, and it is NOT reset between mounts. On any mount that happens after a
 * load has already finished it already reads `progress: 100, active: false`.
 *
 * Reading it here — synchronously, for the `useState` initialiser — instead of
 * in a post-paint `useEffect` is the whole fix: the effect version rendered the
 * overlay at `opacity-100` for one frame before it could discover there was
 * nothing to load, producing a visible 700ms fade of a "100%" card followed by
 * a 750ms unmount timer.
 */
const readInitialProgress = () => {
  try {
    const state = useProgress.getState();
    const progress = state?.progress ?? 0;
    return { progress, isComplete: progress >= 100 && !state?.active };
  } catch {
    // Defensive: matches the existing try/catch around the same call.
    return { progress: 0, isComplete: false };
  }
};
```

- [ ] **Step 3: Replace the three `useState` calls with seeded ones**

Replace:

```jsx
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [mounted, setMounted] = useState(true);
```

with:

```jsx
  const [initial] = useState(readInitialProgress);
  const [progress, setProgress] = useState(initial.progress);
  const [isReady, setIsReady] = useState(initial.isComplete);
  // Already complete at first render → never mount the overlay at all, so
  // there is no frame at opacity-100 to fade out.
  const [mounted, setMounted] = useState(!initial.isComplete);
```

- [ ] **Step 4: Delete the now-redundant initial-state check from the subscribe effect**

Inside the first `useEffect`, delete this block (Step 2's initialiser has already done this work):

```js
    // Check initial state
    try {
      const initial = useProgress.getState();
      if (initial?.progress >= 100 && !initial?.active) {
        setIsReady(true);
      }
    } catch {
      // Ignore
    }
```

Leave the `useProgress.subscribe(...)` body, its `requestAnimationFrame` throttle, and the cleanup exactly as they are. Leave the second `useEffect` (the 750ms unmount timer) unchanged — when `initial.isComplete` is true, `mounted` is already `false`, so it is inert.

- [ ] **Step 5: Lint**

Run: `npm run lint`
Expected: PASS, with no new warnings for `src/containers/canvas-loader/index.jsx`. In particular there must be no unused-variable warning — `initial` is used three times.

- [ ] **Step 6: Manual check**

Run `npm run dev`, open the Inventory route, and wait for the model to finish loading. Then navigate to Home and back to Inventory.

Expected: on the **return** visit the "Loading Model" card must not appear at all — not even for a frame. Before this task it appeared and faded over 700ms. (The scene itself will still stutter on return; that is Task 3's job, not this one.)

---

## Task 2: Add the `KEEP_ALIVE_ROUTES` feature flag

**Files:**
- Modify: `src/utils/env-config.js`

**Interfaces:**
- Produces: `ENV_CONFIG.KEEP_ALIVE_ROUTES: boolean` — consumed by Task 3's `use-keep-alive-outlet.js`.

- [ ] **Step 1: Add the flag to `ENV_CONFIG`**

Replace the whole file with:

```js
export const ENV_CONFIG = {
  ENVIRONMENT: import.meta.env.VITE_APP_ENV || "development",
  API_BASE_URL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  PORT: import.meta.env.VITE_PORT || 3000,
  DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === "true",

  // Keep-alive route hosting — see
  // docs/superpowers/specs/2026-08-17-keep-alive-route-hosting-design.md
  //
  // `!== "false"`, deliberately NOT `=== "true"`: .env* is gitignored
  // (.gitignore:28) and no env file is tracked in this repo, so an opt-in
  // default would ship the feature permanently off for every checkout and CI
  // build. Set VITE_KEEP_ALIVE_ROUTES=false locally or in CI to fall back to
  // unmount-on-navigate if two live WebGL contexts ever prove too much for a
  // low-end device.
  KEEP_ALIVE_ROUTES: import.meta.env.VITE_KEEP_ALIVE_ROUTES !== "false",
};
```

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 3: Verify the default resolves to `true` with no env file**

Run `npm run dev` and confirm the app still boots normally. The flag has no consumer yet, so there is nothing else to observe at this point — this step only guards against a syntax/import error in a file imported early.

---

## Task 3: `KeepAliveOutlet` — mount once, hide when inactive

The core of the change. After this task the loader stops reappearing.

**Files:**
- Create: `src/hooks/use-keep-alive-key.js`
- Create: `src/containers/keep-alive-outlet/keep-alive-views.js`
- Create: `src/containers/keep-alive-outlet/use-keep-alive-outlet.js`
- Create: `src/containers/keep-alive-outlet/index.jsx`
- Modify: `src/routes/index.jsx:8,14,81-98`
- Modify: `src/layouts/main-layout/index.jsx`
- Modify: `src/pages/home/index.jsx`
- Modify: `src/pages/inventory/index.jsx`

**Interfaces:**
- Consumes: `ENV_CONFIG.KEEP_ALIVE_ROUTES` (Task 2).
- Produces:
  - `useKeepAliveKey(): string | null` — the active `handle.keepAlive` key.
  - `KEEP_ALIVE_VIEWS: Record<string, React.ComponentType<{ active: boolean }>>`.
  - `useKeepAliveOutlet(): { data: { activeKey: string | null, views: Array<{ key: string, Component: React.ComponentType<{active: boolean}>, isActive: boolean }> } }`.
  - `<KeepAliveOutlet />` — zero props.
  - Every registry component MUST accept an `active: boolean` prop. Tasks 4 and 5 consume it.

- [ ] **Step 1: Create `src/hooks/use-keep-alive-key.js`**

```js
import { useMemo } from "react";
import { useMatches } from "react-router";

/**
 * useKeepAliveKey — the single definition of "which keep-alive route is
 * active". Reads react-router's match chain rather than sniffing
 * `location.pathname` for a suffix, so the language prefix (/dashboard-en) and
 * any future nesting can never desync it from the router.
 *
 * Scans deepest-match-first so a nested route can override its parent.
 *
 * @returns {string | null} the active route's `handle.keepAlive` key
 */
export const useKeepAliveKey = () => {
  const matches = useMatches();

  return useMemo(() => {
    for (let index = matches.length - 1; index >= 0; index -= 1) {
      const key = matches[index]?.handle?.keepAlive;
      if (key) return key;
    }
    return null;
  }, [matches]);
};

export default useKeepAliveKey;
```

- [ ] **Step 2: Create `src/containers/keep-alive-outlet/keep-alive-views.js`**

```js
import HomePage from "@/pages/home";
import InventoryPage from "@/pages/inventory";

/**
 * Registry mapping a route's `handle.keepAlive` key to the component that
 * renders it. Kept separate from the hook and the JSX so adding a future
 * keep-alive route touches exactly this object literal.
 *
 * Every component here MUST accept an `active: boolean` prop — see
 * containers/keep-alive-outlet/index.jsx, which renders inactive views mounted
 * but hidden, and relies on the component to stop its own render loop.
 */
export const KEEP_ALIVE_VIEWS = {
  home: HomePage,
  inventory: InventoryPage,
};

export default KEEP_ALIVE_VIEWS;
```

- [ ] **Step 3: Create `src/containers/keep-alive-outlet/use-keep-alive-outlet.js`**

```js
import { useEffect, useMemo, useState } from "react";
import useKeepAliveKey from "@/hooks/use-keep-alive-key";
import { ENV_CONFIG } from "@/utils/env-config";
import { KEEP_ALIVE_VIEWS } from "./keep-alive-views";

/**
 * useKeepAliveOutlet — decides which route views are rendered.
 *
 * Navigating between two <Canvas>-bearing routes used to unmount one and mount
 * the other, which destroys the WebGLRenderer and its context. The parsed GLB
 * survives in the module-scope caches (hooks/use-glb-loader.js, drei's
 * useGLTF), but compiled shader programs, uploaded textures and the PMREM
 * target live in the CONTEXT — so every switch re-linked every program and
 * re-uploaded every texture, which is the multi-second gl.compile() the loading
 * overlay was covering.
 *
 * The fix is that `visited` below only ever grows. A key enters on its first
 * activation and is never removed, so its <Canvas> stays mounted for the rest
 * of the session. Removing a key here would destroy the context again and undo
 * the entire feature.
 */
export const useKeepAliveOutlet = () => {
  const activeKey = useKeepAliveKey();
  const [visited, setVisited] = useState(() => new Set());

  useEffect(() => {
    if (!activeKey || !ENV_CONFIG.KEEP_ALIVE_ROUTES) return;
    if (!KEEP_ALIVE_VIEWS[activeKey]) return;

    setVisited((previous) =>
      previous.has(activeKey) ? previous : new Set(previous).add(activeKey),
    );
  }, [activeKey]);

  const views = useMemo(() => {
    if (!activeKey || !KEEP_ALIVE_VIEWS[activeKey]) return [];

    // `activeKey` is unioned in explicitly rather than waited for: the effect
    // above lands one commit later, and the route the user just navigated to
    // has to render on THIS one.
    //
    // With the flag off, only the active key renders — i.e. exactly the
    // unmount-on-navigate behaviour that shipped before this feature, on the
    // same code path rather than a forked one.
    const keys = ENV_CONFIG.KEEP_ALIVE_ROUTES
      ? Array.from(new Set([...visited, activeKey]))
      : [activeKey];

    return keys.map((key) => ({
      key,
      Component: KEEP_ALIVE_VIEWS[key],
      isActive: key === activeKey,
    }));
  }, [activeKey, visited]);

  return { data: { activeKey, views } };
};

export default useKeepAliveOutlet;
```

- [ ] **Step 4: Create `src/containers/keep-alive-outlet/index.jsx`**

```jsx
import { Outlet } from "react-router";
import useKeepAliveOutlet from "./use-keep-alive-outlet";

/**
 * KeepAliveOutlet — replaces <Outlet /> for the 3D routes.
 *
 * Renders every keep-alive route visited so far, stacked absolutely, with only
 * the active one visible. See use-keep-alive-outlet.js for why the inactive
 * ones must stay mounted.
 */
export const KeepAliveOutlet = () => {
  const {
    data: { views },
  } = useKeepAliveOutlet();

  // No keep-alive route matched — a future non-3D page, or a `handle` typo.
  // Falling through to a conventional Outlet degrades to normal routing
  // instead of a blank screen.
  if (views.length === 0) return <Outlet />;

  return (
    <div className="relative h-full w-full">
      {views.map(({ key, Component, isActive }) => (
        <div
          key={key}
          className="absolute inset-0"
          // visibility, NOT display:none. display:none collapses the box to
          // 0x0, which drives R3F's ResizeObserver to resize the renderer to
          // zero and makes the inventory EffectComposer allocate a zero-sized
          // render target. visibility keeps the layout box intact and skips
          // paint — and because it inherits, the fixed-position HomeLoader
          // (containers/home/home-loader.jsx, `fixed inset-0 z-[150]`) inside a
          // hidden view is hidden along with it rather than covering the
          // visible route.
          style={{ visibility: isActive ? "visible" : "hidden" }}
          // React 19 treats `inert` as a real boolean attribute. The hidden
          // view still contains focusable controls (TopNavigation's buttons,
          // SidebarPanel), so without this they stay tabbable and visible to
          // screen readers.
          inert={!isActive}
          aria-hidden={!isActive}
        >
          <Component active={isActive} />
        </div>
      ))}
    </div>
  );
};

export default KeepAliveOutlet;
```

- [ ] **Step 5: Point the routes at the registry**

In `src/routes/index.jsx`, replace the `children` array of the `MainLayout` route:

```js
        children: [
          {
            index: true,
            Component: HomePage,
          },
          {
            path: WEB_ROUTES.landing.path,
            Component: Inventory,
          },
          {
            path: WEB_ROUTES.home.path,
            Component: HomePage,
          },
        ],
```

with:

```js
        // These leaves intentionally declare no element/Component. They exist
        // to match the URL and to name the view via `handle`; the actual mount
        // is owned by containers/keep-alive-outlet, which keeps a visited
        // route's <Canvas> alive across navigations. A leaf route with no
        // element is a valid react-router pass-through and renders nothing.
        children: [
          {
            index: true,
            handle: { keepAlive: "home" },
          },
          {
            path: WEB_ROUTES.landing.path,
            handle: { keepAlive: "inventory" },
          },
          {
            path: WEB_ROUTES.home.path,
            handle: { keepAlive: "home" },
          },
        ],
```

Then delete the two now-unused imports at the top of the same file:

```js
import HomePage from "@/pages/home";
```
```js
import Inventory from "@/pages/inventory";
```

Leave every other import (`MainLayout`, `WEB_ROUTES`, `i18n`, `SUPPORTED_LANGS`, `DASHBOARD_PREFIX`, `getDashboardRoute`) and the `RootRedirect` / `LangGuard` components exactly as they are.

- [ ] **Step 6: Wire `MainLayout` to `KeepAliveOutlet`**

In `src/layouts/main-layout/index.jsx`:

Change the imports — drop `Outlet` and `useLocation` from the `react-router` import (both become unused), and add the two new modules:

```js
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchInventory } from "@/store/slices/building-slice";
import KeepAliveOutlet from "@/containers/keep-alive-outlet";
import useKeepAliveKey from "@/hooks/use-keep-alive-key";
import SidebarNavContainer from "@/containers/sidebar-nav";
import MobileNavContainer from "@/containers/mobile-nav";
import { SIDEBAR_WIDTH } from "@/utils/constant";
```

Replace the `location` / `isInventoryPage` derivation:

```js
  const location = useLocation();
```
```js
  const isInventoryPage = (location.pathname.replace(/\/$/, "") || "/").endsWith(
    "/inventory",
  );
  const railWidth = isInventoryPage
    ? SIDEBAR_WIDTH.collapsed
    : SIDEBAR_WIDTH.expanded;
```

with:

```js
  // Same source of truth the KeepAliveOutlet uses, so the rail width can never
  // disagree with which view is actually showing. Replaces a pathname-suffix
  // test that had to re-derive the route independently.
  const activeKey = useKeepAliveKey();
  const railWidth =
    activeKey === "inventory"
      ? SIDEBAR_WIDTH.collapsed
      : SIDEBAR_WIDTH.expanded;
```

Keep the `useEffect` that dispatches `fetchInventory()` unchanged — `MainLayout` already survives navigation, so it still runs exactly once.

Replace the outlet in the JSX:

```jsx
            <Outlet />
```
with:
```jsx
            <KeepAliveOutlet />
```

Leave the commented-out `SidebarNavContainer` / `MobileNavContainer` blocks and the `railWidth` usage inside them exactly as they are — `railWidth` stays referenced by the commented block and by nothing else, which is the pre-existing state.

- [ ] **Step 7: Forward `active` through the page components**

`src/pages/home/index.jsx` — replace the whole file:

```jsx
import HomeContainer from "@/containers/home";

/**
 * HomePage Component.
 * Pure entry point — renders the 3D masterplan container.
 *
 * `active` is supplied by containers/keep-alive-outlet: this page stays mounted
 * after its first visit and is hidden rather than unmounted, so the container
 * needs to know when to stop its render loop. It MUST be forwarded.
 */
const HomePage = ({ active = true }) => {
  return <HomeContainer active={active} />;
};

export default HomePage;
```

`src/pages/inventory/index.jsx` — replace the whole file:

```jsx
import InventoryContainer from "@/containers/inventory";

/**
 * Inventory Page Component.
 * Acts as a pure entry point to render the InventoryContainer.
 *
 * `active` is supplied by containers/keep-alive-outlet: this page stays mounted
 * after its first visit and is hidden rather than unmounted, so the container
 * needs to know when to stop its render loop. It MUST be forwarded.
 */
export default function Inventory({ active = true }) {
  return <InventoryContainer active={active} />;
}
```

The containers do not accept `active` until Task 4; passing an unread prop is harmless in the interim.

- [ ] **Step 8: Lint**

Run: `npm run lint`
Expected: PASS. Specifically confirm there are no `no-unused-vars` errors for the removed `Outlet`, `useLocation`, `HomePage` and `Inventory` imports — if any remain, the deletions in Steps 5 and 6 were incomplete.

- [ ] **Step 9: Manual check — the loader stops reappearing**

Run `npm run dev`. Open the Home route and let the 3D masterplan finish loading. Click a building marker to go to Inventory and let it load. Then use the Home button in the top navigation to return, and go back to Inventory again.

Expected:
1. The Home carousel loader appears **only** on the very first Home load.
2. The Inventory "Loading Model" card appears **only** on the very first Inventory load.
3. Both return trips are immediate, with the scene already drawn.
4. On the Network tab, the second and subsequent switches issue **no** requests for `.glb` files.

If the Home loader reappears, the `visited` set is being reset — check that `useKeepAliveOutlet` is called exactly once (only from `KeepAliveOutlet`) and that `MainLayout` itself is not remounting.

- [ ] **Step 10: Manual check — flag-off fallback**

Stop the dev server. Create a temporary `.env.local` containing `VITE_KEEP_ALIVE_ROUTES=false`, restart `npm run dev`, and repeat Step 9.

Expected: the pre-existing behaviour returns — each switch unmounts the previous view, and the loaders reappear on every navigation (except the Inventory card, which Task 1 already fixed).

**Delete `.env.local` when done.** It is gitignored, but leaving it behind would silently disable the feature for the user.

---

## Task 4: Freeze the hidden scene

After Task 3 the hidden view is still rendering every frame — two full scenes competing for the GPU. This task makes an inactive view cost nothing.

**Files:**
- Modify: `src/containers/home/index.jsx`
- Modify: `src/features/home-scene/index.jsx`
- Modify: `src/features/home-scene/camera-rig.jsx:49`
- Modify: `src/features/home-scene/use-auto-rotate-hint.js:44-99`
- Modify: `src/containers/inventory/index.jsx:35-68`

**Interfaces:**
- Consumes: the `active: boolean` prop delivered by Task 3's registry.
- Produces:
  - `HomeContainer({ active })`, `InventoryContainer({ active })`
  - `HomeScene({ controlsRef, onReady, active })`
  - `CameraRig({ controlsRef, active })`
  - `useAutoRotateHint({ controlsRef, enabled })`

- [ ] **Step 1: Accept `active` in `HomeContainer` and set `frameloop`**

In `src/containers/home/index.jsx`, change the signature:

```jsx
export const HomeContainer = () => {
```
to:
```jsx
export const HomeContainer = ({ active = true }) => {
```

Then add `frameloop` to the `<Canvas>` and pass `active` down:

```jsx
          <Canvas
            dpr={dpr}
            gl={glConfig}
            camera={initialCamera}
            // This container stays mounted after its first visit and is hidden
            // by containers/keep-alive-outlet rather than unmounted, so the
            // WebGL context (and every compiled program and uploaded texture)
            // survives navigation. "never" is what stops that mounted-but-
            // invisible scene from costing GPU time: it halts the render loop
            // entirely, so no useFrame callback and no OrbitControls.update()
            // runs while hidden.
            //
            // CAUTION: R3F's setFrameloop does clock.stop() and
            // clock.elapsedTime = 0 on every toggle. Nothing in this subtree
            // may read clock.elapsedTime or delta in useFrame — audited at the
            // time of writing (camera-rig ignores its args, building-markers
            // reads camera/size only). Keep it that way.
            frameloop={active ? "always" : "never"}
          >
            <KTX2Init />
            <WebGLRecoveryGuard onFatalLoss={handleResetCache} />
            <Suspense fallback={null}>
              <HomeScene
                controlsRef={controlsRef}
                onReady={handleReady}
                active={active}
              />
            </Suspense>
          </Canvas>
```

- [ ] **Step 2: Thread `active` through `HomeScene`**

In `src/features/home-scene/index.jsx`, change:

```jsx
const HomeSceneImpl = ({ controlsRef, onReady }) => {
```
to:
```jsx
const HomeSceneImpl = ({ controlsRef, onReady, active = true }) => {
```

and change:

```jsx
      <CameraRig controlsRef={controlsRef} />
```
to:
```jsx
      <CameraRig controlsRef={controlsRef} active={active} />
```

- [ ] **Step 3: Thread `active` through `CameraRig`**

In `src/features/home-scene/camera-rig.jsx`, change:

```jsx
const CameraRigImpl = ({ controlsRef }) => {
```
to:
```jsx
const CameraRigImpl = ({ controlsRef, active = true }) => {
```

and change:

```jsx
  useAutoRotateHint({ controlsRef });
```
to:
```jsx
  // `enabled` is gated on route activity: frameloop="never" stops the render
  // loop but not setTimeout, so without this the idle timer would fire while
  // the home view is hidden and the scene would be mid-spin on return.
  useAutoRotateHint({ controlsRef, enabled: active });
```

- [ ] **Step 4: Add the `enabled` gate to `useAutoRotateHint`**

In `src/features/home-scene/use-auto-rotate-hint.js`, change the signature:

```js
export const useAutoRotateHint = ({ controlsRef }) => {
```
to:
```js
export const useAutoRotateHint = ({ controlsRef, enabled = true }) => {
```

Replace the first effect (the "First arm" block) with:

```js
  // First arm: CameraRig only mounts once the GLB has loaded
  // (src/features/home-scene/index.jsx), so "on mount" already means "after
  // the model is ready" — no separate onReady/SceneReadyGate gating needed.
  //
  // `enabled` exists because this container is no longer unmounted when the
  // user navigates away (see containers/keep-alive-outlet). frameloop="never"
  // freezes the render loop but NOT this setTimeout, so without the gate the
  // 20s timer would still fire while the home view was hidden and flip
  // autoRotate on — and the scene would be spinning the instant the user came
  // back. Disabling clears the pending timer and forces autoRotate off;
  // re-enabling re-arms the full initial delay, so returning to the route
  // behaves like arriving at it.
  useEffect(() => {
    const controls = controlsRef.current;

    if (!enabled) {
      clearTimeout(idleTimerRef.current);
      if (controls) controls.autoRotate = false;
      return undefined;
    }

    scheduleIdleTimer(INITIAL_ROTATE_DELAY_MS);

    return () => {
      clearTimeout(idleTimerRef.current);
      if (controls) controls.autoRotate = false;
    };
  }, [enabled, scheduleIdleTimer, controlsRef]);
```

Replace the second effect's guard so the `start`/`end` listeners are not attached while disabled:

```js
    const controls = controlsRef.current;
    if (!controls) return;
```
becomes:
```js
    const controls = controlsRef.current;
    if (!controls || !enabled) return undefined;
```

and add `enabled` to that effect's dependency array:

```js
  }, [enabled, controlsRef, scheduleIdleTimer]);
```

Leave `AUTO_ROTATE_SPEED`, `INITIAL_ROTATE_DELAY_MS`, `RESUME_IDLE_MS` and `scheduleIdleTimer` unchanged.

- [ ] **Step 5: Accept `active` in `InventoryContainer` and set `frameloop`**

In `src/containers/inventory/index.jsx`, change:

```jsx
export default function InventoryContainer() {
  const {
    controlsRef,
    modelRef,
    canvasHeight,
    handleResetCamera,
    handleResetCache,
  } = useInventory();
```
to:
```jsx
export default function InventoryContainer({ active = true }) {
  const {
    controlsRef,
    modelRef,
    canvasHeight,
    handleResetCamera,
    handleResetCache,
  } = useInventory({ active });
```

`useInventory` does not read the argument until Task 5; passing it now keeps the two tasks independently reviewable.

Add `frameloop` to the `<Canvas>`:

```jsx
            <Canvas
              dpr={[1, Math.min(window.devicePixelRatio, 2)]}
              performance={{ min: 0.5, debounce: 200 }}
              gl={CANVAS_GL_CONFIG}
              // See the matching comment in containers/home/index.jsx. This
              // container stays mounted and hidden after its first visit;
              // "never" halts the render loop so the hidden scene — including
              // the EffectComposer/SMAA pass — costs no GPU time.
              frameloop={active ? "always" : "never"}
            >
```

- [ ] **Step 6: Lint**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 7: Manual check — the hidden scene draws nothing**

Run `npm run dev`. Visit both routes so both are mounted, then settle on Inventory.

Temporarily add a frame counter to confirm the freeze — insert into `src/features/home-scene/camera-rig.jsx`'s existing `useFrame`:

```jsx
  useFrame(() => {
    clampPanTarget();
    logger.info("[CameraRig] frame");
  });
```

Expected: while Inventory is showing, `[CameraRig] frame` must stop appearing in the console entirely. Navigate to Home and it resumes immediately.

**Remove the temporary `logger.info` line before finishing this task.**

- [ ] **Step 8: Manual check — auto-rotate does not ambush the user**

Run `npm run dev`, load Home, immediately navigate to Inventory, and wait there for more than 20 seconds (`INITIAL_ROTATE_DELAY_MS`). Navigate back to Home.

Expected: Home is stationary on return, exactly where the camera was left, and only begins its idle rotation 20 seconds later if untouched. If it is already spinning on arrival, the `enabled` gate in Step 4 is not wired.

---

## Task 5: Re-key the Inventory `?building=` effect to activation

Under keep-alive, `InventoryContainer` mounts once. A mount-only effect now runs for the first visit and never again — which would silently break browser back/forward and direct `?building=X` URL edits.

**Files:**
- Modify: `src/containers/inventory/use-inventory.js:13,30-46`

**Interfaces:**
- Consumes: `active: boolean` passed by Task 4's `InventoryContainer`.
- Produces: `useInventory({ active }): { controlsRef, modelRef, canvasHeight, handleResetCamera, handleResetCache }` — the returned shape is unchanged.

- [ ] **Step 1: Accept the argument and add an activation-edge ref**

Change the signature:

```js
export const useInventory = () => {
```
to:
```js
export const useInventory = ({ active = true } = {}) => {
```

Add `useRef` to the existing `react` import if it is not already there (it is — the file already imports `useRef`), and declare the edge tracker next to the other refs:

```js
  const wasActiveRef = useRef(false);
```

- [ ] **Step 2: Replace the mount-only effect with an activation-edge effect**

Replace:

```js
  // On mount, read ?building=X from the URL (set by home-page marker clicks) and
  // pre-select the matching building so the inventory opens on the right one.
  // If no param is present, always reset to Building A (index 0) so visiting
  // /inventory directly never shows a stale building from a previous session.
  useEffect(() => {
    const buildingParam = searchParams.get("building");

    if (!buildingParam) {
      // No param → guarantee Building A is shown regardless of Redux state.
      dispatch(setBuilding(0));
      return;
    }

    const name = buildingParam.toUpperCase();
    const index = BUILDING_CONFIG.findIndex((c) => c.name === name);
    if (index !== -1) {
      dispatch(setBuilding(index));
    }
    // Only run once on mount — subsequent URL changes are driven by in-page nav.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
```

with:

```js
  // On ACTIVATION, read ?building=X from the URL (set by home-page marker
  // clicks) and pre-select the matching building so the inventory opens on the
  // right one. If no param is present, reset to Building A (index 0) so
  // visiting /inventory directly never shows a stale building.
  //
  // Keyed on the false->true activation edge, not on mount: under
  // containers/keep-alive-outlet this container mounts exactly once and is then
  // shown and hidden, so a mount-only effect would fire for the first visit and
  // never again — quietly breaking browser back/forward and any direct edit of
  // the ?building= param.
  //
  // The edge ref preserves the original "once per arrival" semantics: URL
  // changes made by in-page navigation WHILE the route is already active must
  // not be reapplied here, or this would fight the top-navigation building
  // switcher. That was true of the mount-only version and stays true here.
  useEffect(() => {
    if (!active) {
      wasActiveRef.current = false;
      return;
    }
    if (wasActiveRef.current) return;
    wasActiveRef.current = true;

    const buildingParam = searchParams.get("building");

    if (!buildingParam) {
      dispatch(setBuilding(0));
      return;
    }

    const name = buildingParam.toUpperCase();
    const index = BUILDING_CONFIG.findIndex((c) => c.name === name);
    if (index !== -1) {
      dispatch(setBuilding(index));
    }
  }, [active, searchParams, dispatch]);
```

Note the `eslint-disable-next-line react-hooks/exhaustive-deps` comment is deleted — the new dependency array is complete, so the suppression is no longer needed and would itself trip lint as an unused disable directive under some configs.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: PASS, with no `react-hooks/exhaustive-deps` warning for this effect.

- [ ] **Step 4: Manual check — marker deep-link still selects the right building**

Run `npm run dev`. From Home, click the marker for building **D**. Expected: Inventory opens on building D, and the URL ends with `?building=D`.

Go back to Home and click the marker for building **G**. Expected: Inventory shows building G — not the stale D. This is the case a mount-only effect would have broken.

- [ ] **Step 5: Manual check — back/forward**

With the history from Step 4, press the browser Back button to Home and Forward to Inventory again. Expected: no crash, and the building shown matches the `?building=` value in the address bar.

- [ ] **Step 6: Manual check — direct entry with no param**

Open `http://localhost:5173/dashboard-en/inventory` directly in a fresh tab. Expected: building A is shown.

---

## Task 6: Deterministic KTX2 init + warm the other route in both directions

`main.jsx` already idle-preloads the Inventory models when the user lands anywhere else. This task adds the mirror — warming the Home GLB when the user lands on Inventory — so the *first* switch is fast in both directions.

**This exposes a real ordering bug that must be fixed in the same task.** `KTX2Loader` cannot transcode until `detectSupport(renderer)` has run, and that requires a live `WebGLRenderer`. Today `initKTX2` is called only from `KTX2Init` inside the **Home** canvas (`src/containers/home/index.jsx:40-46`). Preloading the Home GLB — which carries `KHR_texture_basisu` textures — from the Inventory route would therefore throw `Missing initialization with .detectSupport( renderer )`. Two changes prevent it: the Inventory canvas must also mount `KTX2Init`, and the preload must await readiness rather than race the first Canvas commit.

**Files:**
- Create: `src/features/ktx2-init/index.jsx`
- Modify: `src/containers/home/index.jsx` (remove the local `KTX2Init`, import the shared one)
- Modify: `src/containers/inventory/index.jsx` (mount `KTX2Init`)
- Modify: `src/utils/preloader.js:39-57`
- Modify: `src/hooks/use-glb-loader.js`
- Modify: `src/main.jsx:22-33`

**Interfaces:**
- Produces:
  - `<KTX2Init />` from `@/features/ktx2-init` — zero props, renders `null`, must be a child of a `<Canvas>`.
  - `whenKTX2Ready(): Promise<void>` from `@/utils/preloader`.
  - `preloadGLB(url: string, configureLoader?: (loader) => void): void` from `@/hooks/use-glb-loader`.

- [ ] **Step 1: Extract `KTX2Init` into a shared feature module**

Create `src/features/ktx2-init/index.jsx`. This is the component currently defined inline in `src/containers/home/index.jsx:40-46`, moved verbatim so both canvases can mount it:

```jsx
import { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import { initKTX2 } from "@/utils/preloader";

/**
 * KTX2Loader needs a live renderer to know which compressed formats the GPU
 * supports. Rendered outside <Suspense> so it runs before the GLB is requested.
 *
 * useLayoutEffect, not a render-phase call: calling initKTX2 directly in the
 * component body was a side effect during render (harmless in practice since
 * it's idempotent, but against the rules of pure render). useLayoutEffect
 * still fires before any *passive* useEffect in the same commit — including
 * useHomeScene's effect that kicks off the GLB fetch — so KTX2 support
 * detection is still guaranteed to complete before anything tries to
 * transcode a KHR_texture_basisu texture.
 *
 * Lives in features/ rather than inside the home container because BOTH
 * canvases mount it: initKTX2 is what resolves whenKTX2Ready(), and the idle
 * cross-route preload in src/main.jsx awaits that promise before parsing a GLB
 * outside any Canvas. Without this on the inventory route, landing on
 * /inventory would leave KTX2 support undetected and the home GLB preload
 * would never run.
 */
export const KTX2Init = () => {
  const gl = useThree((state) => state.gl);

  useLayoutEffect(() => {
    initKTX2(gl);
  }, [gl]);

  return null;
};

export default KTX2Init;
```

- [ ] **Step 2: Use the shared component in `HomeContainer`**

In `src/containers/home/index.jsx`, delete the entire local `KTX2Init` function and its JSDoc block (currently lines 28-46), delete the now-unused imports `useLayoutEffect` (from `react`), `useThree` (from `@react-three/fiber`) and `initKTX2` (from `@/utils/preloader`), and add:

```js
import KTX2Init from "@/features/ktx2-init";
```

Verify the remaining `react` import is `import { Suspense, useMemo } from "react";` and the fiber import is `import { Canvas } from "@react-three/fiber";`. The `<KTX2Init />` usage inside `<Canvas>` stays exactly where it is.

- [ ] **Step 3: Mount `KTX2Init` in the Inventory canvas**

In `src/containers/inventory/index.jsx`, add the import:

```js
import KTX2Init from "@/features/ktx2-init";
```

and add it as the first child of the `<Canvas>`, above `WebGLRecoveryGuard` and outside `<Suspense>` (the same position it occupies in the home canvas):

```jsx
              <KTX2Init />
              <WebGLRecoveryGuard onFatalLoss={handleResetCache} />
```

- [ ] **Step 4: Add `whenKTX2Ready()` to the preloader**

In `src/utils/preloader.js`, replace:

```js
let ktx2SupportDetected = false;
```

with:

```js
let ktx2SupportDetected = false;
let resolveKTX2Ready;

/**
 * Resolves the first time a live WebGLRenderer reaches initKTX2 below.
 *
 * Anything that parses a GLB containing KHR_texture_basisu textures from
 * OUTSIDE a mounted <Canvas> — i.e. the idle cross-route warm-up in
 * src/main.jsx — must await this. KTX2Loader throws "Missing initialization
 * with `.detectSupport( renderer )`" otherwise, and a renderer only exists once
 * a Canvas has committed. Awaiting a promise is deterministic; racing the first
 * Canvas commit against a requestIdleCallback is not.
 *
 * Never resolves if no Canvas ever mounts (e.g. WebGL unavailable) — which is
 * correct: there is nothing to warm up in that case.
 */
const ktx2ReadyPromise = new Promise((resolve) => {
  resolveKTX2Ready = resolve;
});

export const whenKTX2Ready = () => ktx2ReadyPromise;
```

Then add the resolve call inside `initKTX2`:

```js
export const initKTX2 = (renderer) => {
  if (ktx2SupportDetected || !renderer) return;
  ktx2Loader.detectSupport(renderer);
  ktx2SupportDetected = true;
  resolveKTX2Ready();
};
```

Leave `configureLoader`, `preloadModels`, `preloadBackgroundModels` and `disposeThreeScene` unchanged.

- [ ] **Step 5: Add `preloadGLB` to the GLB loader**

In `src/hooks/use-glb-loader.js`, add this export immediately above the existing `clearGLBCache` export:

```js
/**
 * Warms the module-scope cache for a URL without mounting a component. The
 * fetch+parse still runs at most once per URL, so a later useGLBLoader for the
 * same URL resolves instantly from the same entry instead of re-downloading.
 *
 * Callers outside a mounted <Canvas> must gate this on whenKTX2Ready() when the
 * GLB carries KHR_texture_basisu textures — see utils/preloader.js.
 *
 * @param {string | null | undefined} url
 * @param {(loader: import('three').Loader) => void} [configureLoader]
 */
export const preloadGLB = (url, configureLoader) => {
  if (!url) return;
  // The .catch is required, not defensive: getOrCreateEntry logs the failure
  // and evicts the entry so a real consumer still gets a genuine retry, but
  // with no handler attached here a failed preload would surface as an
  // unhandled promise rejection.
  getOrCreateEntry(url, configureLoader).promise.catch(() => {});
};
```

- [ ] **Step 6: Warm the Home GLB when landing on Inventory**

In `src/main.jsx`, update the imports:

```js
import { preloadModels, configureLoader, whenKTX2Ready } from "@/utils/preloader";
import { preloadGLB } from "@/hooks/use-glb-loader";
import { HOME_MODEL_PATH } from "@/utils/constant";
```

Then replace the preload block:

```js
if (isLandingOnInventory) {
  preloadModels();
} else if (typeof window !== "undefined") {
  const scheduleIdlePreload = window.requestIdleCallback
    ? (cb) => window.requestIdleCallback(cb, { timeout: 4000 })
    : (cb) => setTimeout(cb, 1500);
  scheduleIdlePreload(preloadModels);
}
```

with:

```js
if (typeof window !== "undefined") {
  const scheduleIdlePreload = window.requestIdleCallback
    ? (cb) => window.requestIdleCallback(cb, { timeout: 4000 })
    : (cb) => setTimeout(cb, 1500);

  if (isLandingOnInventory) {
    preloadModels();

    // Mirror of the branch below: warm the OTHER route's asset on idle so the
    // first Inventory -> Home switch is as fast as every switch after it.
    // Under containers/keep-alive-outlet the home <Canvas> stays alive once
    // visited, so this download is paid at most once per session.
    //
    // Gated on whenKTX2Ready(): the home GLB carries KHR_texture_basisu
    // textures and this parse happens outside any <Canvas>, so KTX2Loader has
    // no renderer to detect format support against until the inventory canvas
    // mounts <KTX2Init />. See utils/preloader.js.
    scheduleIdlePreload(() => {
      whenKTX2Ready().then(() => preloadGLB(HOME_MODEL_PATH, configureLoader));
    });
  } else {
    scheduleIdlePreload(preloadModels);
  }
}
```

Note `preloadModels()` on the inventory-landing path keeps its existing immediate, ungated call — changing its timing is out of scope for this plan and would risk regressing the route the user actually opened.

- [ ] **Step 7: Lint**

Run: `npm run lint`
Expected: PASS. Confirm no unused-import warnings remain in `src/containers/home/index.jsx` for `useLayoutEffect`, `useThree` or `initKTX2`.

- [ ] **Step 8: Manual check — Home warms while sitting on Inventory**

Run `npm run dev` and open `http://localhost:5173/dashboard-en/inventory` **directly** in a fresh tab (a hard reload, not an in-app navigation). Open the Network tab and wait ~5 seconds after the inventory model finishes.

Expected: a request for `88RES-06_05-2.glb` appears on its own, without any navigation. Then click the Home button.

Expected: Home appears with markedly less delay than before this task — the bytes are already cached and only the GPU warm-up remains. There must be **no** console error mentioning `detectSupport`.

- [ ] **Step 9: Manual check — no regression landing on Home**

Hard-reload `http://localhost:5173/dashboard-en/`.

Expected: Home loads as before, and the inventory models are still requested on idle a moment later. Nothing about this path changed.

---

## Task 7: Activation instrumentation and full verification

**Files:**
- Modify: `src/containers/keep-alive-outlet/use-keep-alive-outlet.js`

**Interfaces:**
- Consumes: `activeKey` from Task 3's hook.
- Produces: `performance` User Timing entries named `keep-alive:<key>:activate`.

- [ ] **Step 1: Add the activation measurement**

In `src/containers/keep-alive-outlet/use-keep-alive-outlet.js`, add `logger` to the imports:

```js
import { logger } from "@/utils/logger";
```

and add this effect below the existing `visited` effect:

```js
  // Activation timing.
  //
  // performance.mark/measure rather than a logger-only readout: logger.info is
  // gated on import.meta.env.DEV (utils/logger.js) and is stripped from staging
  // and production builds — the exact builds whose switching cost is in
  // question. User Timing entries show up in the DevTools Performance timeline
  // in every build mode. The logger line below is the convenience readout for
  // dev.
  //
  // Double rAF: the first fires before the browser paints the newly activated
  // view, the second after — so the measure spans "route changed" to "the user
  // can see it". Target: under ~100ms for a previously-visited route.
  useEffect(() => {
    if (!activeKey) return undefined;

    const startMark = `keep-alive:${activeKey}:activate:start`;
    performance.mark(startMark);

    let innerRaf = 0;
    const outerRaf = requestAnimationFrame(() => {
      innerRaf = requestAnimationFrame(() => {
        const measure = performance.measure(
          `keep-alive:${activeKey}:activate`,
          startMark,
        );
        logger.info(
          `[KeepAlive] "${activeKey}" visible in ${Math.round(measure.duration)}ms`,
        );
      });
    });

    return () => {
      cancelAnimationFrame(outerRaf);
      cancelAnimationFrame(innerRaf);
    };
  }, [activeKey]);
```

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 3: Measure**

Run `npm run dev`, visit both routes once each, then switch back and forth four times while watching the console.

Expected: `[KeepAlive] "home" visible in Xms` and `[KeepAlive] "inventory" visible in Xms` where X is **under ~100** for every switch after the first visit to each route.

Record the numbers. If a return switch exceeds ~100ms, the context is being destroyed somewhere — re-check that `visited` never shrinks (Task 3, Step 3) and that both containers actually receive `active` (Task 4).

Note: dev runs under `StrictMode` (`src/main.jsx`), which double-invokes effects. The first measurement after a fresh page load is therefore noisy; the steady-state switching numbers are the ones that matter.

- [ ] **Step 4: Measure a production-mode build**

Run `npm run build` then `npm run preview`. Repeat Step 3 in the preview server with the DevTools **Performance** panel recording.

Expected: `keep-alive:home:activate` and `keep-alive:inventory:activate` appear under User Timing with durations under ~100ms. The `logger.info` lines will be absent here — that is expected and is precisely why the marks exist.

- [ ] **Step 5: Full manual QA checklist**

Against the `npm run preview` build, work through every item. All nine must pass:

1. No loader appears after the first visit to each route, in either direction.
2. No `.glb` network requests on any switch after the first visit to each route.
3. WebGL context count stays at 2 across many switches — no context-loss churn in the console.
4. The hidden canvas draws zero frames (re-verify with the temporary `logger.info` from Task 4 Step 7 if in doubt, in a dev run, then remove it again).
5. Auto-rotate does not start on return to Home; it starts 20s after arrival if untouched.
6. Browser back/forward selects the correct building and does not crash.
7. `?building=X` deep links still work from a cold load.
8. Hebrew/RTL still routes correctly — visit `/dashboard-he/inventory`, confirm the language prefix survives switching and the layout direction is right.
9. On a mobile viewport (DevTools device emulation), the bottom-menu height offsets still apply to the correct canvas and neither view overlaps the other.

- [ ] **Step 6: Record the GPU-memory baseline**

The accepted risk of this design is two live WebGL contexts holding Home's masterplan and a building model simultaneously. Capture a baseline so a later field regression can be compared against something.

In the `npm run preview` build, visit both routes, then open `chrome://gpu` (or the DevTools Memory panel) and record the GPU memory figure. Note it in the PR/handoff description alongside the Step 3 and Step 4 timings.

If it proves too high on a real low-end device later, the rollback is `VITE_KEEP_ALIVE_ROUTES=false` — no code change.

- [ ] **Step 7: Confirm no stray files**

Verify the working tree contains no `.env.local` (Task 3 Step 10) and no leftover temporary `logger.info` frame counter (Task 4 Step 7).

Run: `git status`
Expected: only the files listed in this plan's File Structure table appear as modified or new. **Do not commit** — leave the tree for the user to review.

---

## Self-Review Notes

Checked against the spec on 2026-08-17:

- **Spec §2.1** (context destruction) → Task 3. **§2.2** (CanvasLoader flash) → Task 1.
- **Spec §4.1–4.3** (routes/handle, KeepAliveOutlet, visibility) → Task 3.
- **Spec §4.4** (frameloop freeze, clock-reset audit) → Task 4 Steps 1, 5 + Global Constraints.
- **Spec §4.5** (timers not frozen) → Task 4 Steps 3, 4.
- **Spec §4.6** (loaders) → Task 1; the keep-alive half needs no code, as §4.6 states.
- **Spec §4.7** (activation effects) → Task 5 (`?building=`) and Task 3 Step 6 (`railWidth`).
- **Spec §4.8** (preload both directions) → Task 6.
- **Spec §5** (flag) → Task 2, exercised in Task 3 Step 10.
- **Spec §6** (error handling) → Task 3 Step 4's `<Outlet />` fallthrough; the boundaries and `handleResetCache` are untouched by design.
- **Spec §7.1/7.2** (instrumentation, QA checklist) → Task 7.
- **Spec §7.3, §10** (no tests, no env edits, no commits) → Global Constraints.
- **Spec §9** (risks) → Task 7 Step 6 records the baseline; rollback is the Task 2 flag.

**Addition beyond the spec:** Task 6 Steps 1–4 (shared `KTX2Init` + `whenKTX2Ready`). The spec's §4.8 specified the mirror preload but did not account for `KTX2Loader.detectSupport` requiring a live renderer, which `initKTX2` only ever received from the Home canvas. Preloading the Home GLB from the Inventory route would have thrown. The fix is scoped to making the new preload correct and does not alter existing `preloadModels()` timing.

**Naming consistency verified across tasks:** `active` (prop, all components), `enabled` (only `useAutoRotateHint`'s parameter), `KEEP_ALIVE_VIEWS`, `useKeepAliveKey`, `useKeepAliveOutlet`, `KEEP_ALIVE_ROUTES`, `whenKTX2Ready`, `preloadGLB`, `KTX2Init`.
