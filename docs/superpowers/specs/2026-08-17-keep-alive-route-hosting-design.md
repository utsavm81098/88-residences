# Keep-Alive Route Hosting — Design

**Date:** 2026-08-17
**Status:** Approved for implementation
**Goal:** Eliminate the loading overlay that appears on every Home ↔ Inventory navigation, by preserving each route's WebGL context across the switch instead of destroying and rebuilding it.

---

## 1. Problem

Switching between Home and Inventory shows a full loading treatment every single time, in both directions:

- **Home → Inventory:** `CanvasLoader` shows a "Loading Model" card that fades over 700ms and unmounts after 750ms.
- **Inventory → Home:** `HomeLoader` replays the full-screen day/night carousel until the scene re-warms.

This happens on the second, third and Nth switch, not just the first.

## 2. Root cause

The router's `<Outlet />` in `src/layouts/main-layout/index.jsx` swaps `HomeContainer` ↔ `InventoryContainer`. Each container owns its own `<Canvas>` (`src/containers/home/index.jsx`, `src/containers/inventory/index.jsx`). Unmounting an R3F `<Canvas>` disposes the `WebGLRenderer` and destroys its WebGL context.

There are **two independent causes**, and both must be addressed.

### 2.1 The GPU work is genuinely repeated

The JS-side caches work correctly and are not the problem:

- The 41 MB `88RES-06_05-2.glb` is **not** re-downloaded — the module-scope cache in `src/hooks/use-glb-loader.js` holds the parsed `THREE.Group`.
- Inventory's building/hitbox GLBs are held by drei's `useGLTF` cache.

But compiled shader programs, uploaded textures and the PMREM environment target live in the **WebGL context**, not in the `THREE.Group`. A new context means every program re-links and every texture re-uploads. That is exactly the work `gl.compile(scene, camera)` in `src/features/home-scene/scene-ready-gate.jsx` blocks on. Returning to Home therefore pays nearly the full warm-up cost again, minus only the download.

### 2.2 `CanvasLoader` flashes even when there is zero work to do

In `src/containers/canvas-loader/index.jsx`, `mounted` initialises to `true`, so the overlay paints at `opacity-100` on the first frame. Only afterwards does a `useEffect` read `useProgress.getState()`, find `progress === 100 && !active` (drei's `useProgress` is a global store, still full from the first visit), and set `isReady`.

The result is a guaranteed `duration-700` fade of a "Loading Model 100%" card plus a 750ms unmount timer — with no loading behind it at all. This is a standalone bug that would survive any architectural fix, and is repaired independently.

Home has the mirror problem: `isReady` initialises to `false` on every mount in `src/containers/home/use-home.js`, so the carousel replays from scratch.

## 3. Decisions

Resolved with the user on 2026-08-17:

| Decision | Choice | Rationale |
|---|---|---|
| Approach | Keep-alive (mount once, hide when inactive) | Preserves the WebGL context with **zero** changes to scene, material, camera, controls or postprocessing code. The alternative — one shared Canvas — is blocked by constructor-time-incompatible `gl` configs (see §8). |
| Low-end mobile | Keep-alive everywhere, then measure | One code path, consistent behaviour. Profile real GPU memory after shipping rather than pre-building a mitigation for a hypothetical regression. |
| Preloading | Warm both directions | `main.jsx` already idle-preloads Inventory models; add the mirror for Home so the *first* switch in either direction is also warm. |
| Automated tests | None | The repo has zero test files and a non-functional Vitest config (see §7.3). Expanding this change to stand up the harness was explicitly declined. Verification is manual + instrumented. |
| Acceptance | Instrumented metric + manual QA | A hard number, not "it feels faster". See §7.1. |
| Rollout | Env flag, default ON | GPU-memory risk is real but unmeasured; a flag makes the fallback a config change rather than a code revert. |

## 4. Architecture

### 4.1 Routes declare identity; they stop owning the mount

Routes remain the source of truth for the URL, language guard and loaders. They stop owning the *mount* of the 3D containers. Each 3D leaf route declares an identity via react-router's `handle` and renders nothing of its own:

```js
{ index: true,       handle: { keepAlive: "home" } },
{ path: "inventory", handle: { keepAlive: "inventory" } },
{ path: "",          handle: { keepAlive: "home" } },
```

A leaf route with no `element`/`Component` is a valid pass-through in react-router 7 — it defaults to rendering `<Outlet />`, which for a leaf renders nothing. The `handle` object is surfaced by `useMatches()`.

### 4.2 `KeepAliveOutlet` owns the mount

A new container, `src/containers/keep-alive-outlet/`, replaces `<Outlet />` in `MainLayout`. It:

1. reads `useMatches()` for the deepest match carrying a `keepAlive` key;
2. looks that key up in a registry (`src/pages/home`, `src/pages/inventory` become the registry entries — no dead code is left behind);
3. renders **every key visited so far**, stacked absolutely, with only the active one visible.

The registry is its own module, `src/containers/keep-alive-outlet/keep-alive-views.js`, exporting a plain `{ [key]: Component }` map. Keeping it separate from both the hook and the JSX means adding a future keep-alive route touches one object literal.

Per `.agents/rules/hooks-guidelines.md`, the match/registry/visited-set logic lives in `use-keep-alive-outlet.js` and returns `{ data: { views } }` with no JSX; the markup above stays in `index.jsx`.

```jsx
<div className="relative h-full w-full">
  {views.map(({ key, Component, isActive }) => (
    <div
      key={key}
      className="absolute inset-0"
      style={{ visibility: isActive ? "visible" : "hidden" }}
      inert={!isActive || undefined}
    >
      <Component active={isActive} />
    </div>
  ))}
</div>
```

The visited set grows monotonically and never shrinks. That *is* the mechanism — nothing else keeps the context alive.

Routes **without** a `keepAlive` handle fall through to a normal `<Outlet />`, so any future non-3D route behaves conventionally and pays no keep-alive cost.

### 4.3 Why `visibility: hidden`, not `display: none`

`display: none` collapses the element to 0×0. R3F observes size via `ResizeObserver` and would resize the renderer to zero, which additionally makes Inventory's `EffectComposer` allocate a zero-sized render target. `visibility: hidden` keeps the layout box intact, skips paint, and blocks hit-testing.

`inert` (native in React 19) keeps the hidden subtree out of tab order and the accessibility tree — necessary because the hidden view still contains focusable controls (`TopNavigation`, `SidebarPanel`).

### 4.4 Freezing the hidden scene

Mounted-but-hidden must cost nothing. Both containers accept an `active` prop and pass `frameloop={active ? "always" : "never"}` to their `<Canvas>`.

`frameloop` is confirmed reactive in @react-three/fiber 9.5.0: the reconciler's configure step runs on every render and calls `setFrameloop` when the value differs. `"never"` halts the loop entirely, so all `useFrame` work stops — the pan clamp in `camera-rig.jsx`, drei's `OrbitControls.update()`, `building-markers`, `use-building`, and `PerformanceMonitor`/`AdaptiveDpr` sampling. Flipping back to `"always"` resumes and renders immediately; no `advance()` call is needed.

**Known R3F behaviour:** `setFrameloop` performs `clock.stop()` and `clock.elapsedTime = 0`. Any `useFrame` reading `clock.elapsedTime` or `delta` would therefore jump on each toggle.

One consumer *does* read `delta`, and it is not in application code: `@react-three/postprocessing`'s `EffectComposer` runs `useFrame((state, delta) => composer.render(delta))`, and Inventory mounts it via `scene-environment/index.jsx`. This is safe as currently configured — SMAA is time-independent, no frames render at all while frozen, and `clock.start()` resets `oldTime` on resume so the first delta is small rather than a stale spike. The invariant that actually matters is therefore narrower than "nothing reads delta": **every post-processing pass in that composer must stay time-independent.** Adding Noise, Glitch, ShockWave or any custom pass driving a `uTime` uniform would visibly jump on each route switch.

The four *application* `useFrame` consumers were audited and none read the clock:

| Consumer | Reads |
|---|---|
| `features/home-scene/camera-rig.jsx` | ignores callback args |
| `features/building-markers/index.jsx` | `camera`, `size` only |
| `features/building/use-building.js` | frame counter only |
| `features/home-scene/dev-markers.jsx` | dev-only, not mounted in production |

This constraint must hold for future `useFrame` code in these subtrees.

### 4.5 Timers are not frozen by `frameloop`

`frameloop="never"` stops the render loop, not JS timers. `src/features/home-scene/use-auto-rotate-hint.js` arms a 20s timer that sets `controls.autoRotate = true`. While hidden that timer still fires, so Home would begin spinning the instant the user returned.

The hook gains an `enabled` flag: when disabled it clears the pending timer and forces `autoRotate = false`; when re-enabled it re-arms the initial delay. `active` threads `HomeContainer → HomeScene → CameraRig → useAutoRotateHint`.

### 4.6 Loaders

With the context preserved, both loaders simply never run a second time — `isReady` in `use-home.js` and `mounted` in `canvas-loader/index.jsx` retain their post-load values because the components never unmount. No new state is required.

`CanvasLoader` is fixed independently (§2.2): `mounted` and `isReady` initialise from `useProgress.getState()` inside the `useState` initialiser rather than in a post-paint `useEffect`, so it can never paint a "100%" card for one frame and then fade it out.

### 4.7 Activation-time effects

Two effects currently keyed to *mount* must be re-keyed to *activation*, because mount now happens only once:

- `src/containers/inventory/use-inventory.js` reads `?building=X` on mount. Marker clicks already `dispatch(setBuilding(...))` before navigating (`use-building-markers.js`), so the common path is unaffected — but browser back/forward and direct URL edits would silently stop working. It becomes an effect that runs when `active` transitions false → true, keyed on `[active, searchParams]`.
- `src/layouts/main-layout/index.jsx` derives `railWidth` from a pathname suffix test. It switches to the same `keepAlive` key so there is one definition of "which route am I on".

`fetchInventory()` in `MainLayout` needs no change — `MainLayout` already survives the navigation and dispatches once.

### 4.8 Preloading both directions

`src/main.jsx` already idle-preloads Inventory models when the user lands anywhere except Inventory. The mirror is added: a `preloadGLB(url, configureLoader)` export from `use-glb-loader.js` (a thin wrapper over the existing `getOrCreateEntry`), called on idle when the user lands *on* Inventory, so the 41 MB Home GLB is warm before the first switch. It reuses the same `requestIdleCallback` + 4s timeout guard so it never competes with the route actually opened.

## 5. Feature flag

Added to `src/utils/env-config.js`, matching the existing `ENV_CONFIG` pattern:

```js
KEEP_ALIVE_ROUTES: import.meta.env.VITE_KEEP_ALIVE_ROUTES !== "false",
```

`!== "false"` (not `=== "true"`) so the flag defaults **ON** with no env file present. This matters: `.env*` is fully gitignored and **no env file is tracked in git**, so a `=== "true"` default would ship the feature permanently off. No `.env` file is modified by this work; the variable is documented here and set locally/in CI only if someone needs to flip it.

When the flag is OFF, `KeepAliveOutlet` renders only the active view and unmounts the rest — exactly today's behaviour. `active` is then always `true` for the single rendered view, so there is one code path, not two.

## 6. Error handling

- Each container keeps its own `ComponentErrorBoundary` and `WebGLRecoveryGuard`. Because containers now persist, a caught error in the hidden view stays caught and does not surface until that view is shown again — acceptable, and no worse than the boundary's current behaviour.
- `handleResetCache` in both containers still disposes and evicts. Under keep-alive these run on a live, mounted container, which is the case they were already written for.
- An unknown/missing `keepAlive` key falls through to `<Outlet />` rather than rendering nothing, so a routing mistake degrades to today's behaviour instead of a blank screen.

## 7. Verification

### 7.1 Instrumented metric

`performance.mark()` / `performance.measure()` around route activation, so the number is visible in the DevTools Performance timeline **in any build mode**. This is deliberate: `logger.info` is gated on `import.meta.env.DEV` (`src/utils/logger.js`), so a logger-only readout would be stripped from staging and production builds — the very builds whose performance is in question. A dev-only `logger.info` readout is added alongside for convenience.

**Target:** returning to a previously-visited route shows no loader, issues no network request, and completes in under ~100ms.

### 7.2 Manual QA checklist

Home → Inventory → Home → Inventory with DevTools open, confirming:

1. no loader after the first visit in each direction;
2. no new network requests on subsequent switches;
3. WebGL context count stays at 2 (no `WEBGL_lose_context` churn);
4. the hidden canvas draws zero frames;
5. auto-rotate does not start on return to Home;
6. browser back/forward still selects the correct building;
7. `?building=X` deep links still work;
8. Hebrew/RTL and the language prefix still route correctly;
9. mobile bottom-menu height offsets still apply to the correct canvas.

### 7.3 Automated tests — explicitly out of scope

Vitest 4.1.4, jsdom and `@testing-library/*` are installed and `vite.config.js` declares a `test` block, but the harness has never run: there is **no `test` npm script**, `setupFiles` points at `./src/test-setup.js` which **does not exist**, and there are **zero test files** in the repo. Repairing that is a pre-existing gap, was declined for this change, and is recorded here as known debt.

`npm run lint` must pass.

## 8. Rejected alternatives

**One shared `<Canvas>` hoisted into the layout.** Theoretically ideal — a single context for the whole app. Blocked by constructor-time-incompatible configs: Home requires `antialias: true` because its foliage `alphaToCoverage` depends on MSAA (`use-home-scene.js`), while Inventory runs `multisampling: 0` plus `EffectComposer`/`SMAA` (`scene-environment/index.jsx`). `antialias` cannot be changed on a live context, so this forces dropping SMAA and reworking Home's camera seeding away from `<Canvas camera={}>` — which `camera-rig.jsx` documents as the specific fix for a wrong-opening-frame bug. Highest reward, highest blast radius; held in reserve.

**Fix the loaders only.** Cheap, but hides the symptom: it would swap a 750ms overlay for a black canvas and a stutter while the context re-warms. Worse UX than today on Home. Its `CanvasLoader` fix is folded into this design regardless, because that flash is a bug on its own.

## 9. Risks and rollback

| Risk | Mitigation |
|---|---|
| Two live WebGL contexts hold Home's masterplan and a building model on the GPU simultaneously; may regress low-end mobile. | Accepted deliberately (ship and measure). Rollback is `VITE_KEEP_ALIVE_ROUTES=false` — a config change, no code revert. If mobile specifically regresses, the narrow follow-up is to gate visited-set growth on `useIsMobile()`. |
| A future `useFrame` reading `clock.elapsedTime` in these subtrees would break on frameloop toggle (§4.4). | Documented as a constraint in the design and in code comments at the `frameloop` prop. |
| Hidden view retains focusable controls. | `inert` on the hidden wrapper. |
| GSAP tweens (e.g. `focusCameraOnMesh`) continue running while hidden and call `invalidate()`, which is a no-op under `frameloop="never"`. | Harmless — the tween completes invisibly and the final state is correct on return. Verified as part of QA item 6. |

## 10. Out of scope

- Repairing the dormant Vitest harness (§7.3).
- The single-shared-Canvas consolidation (§8).
- Any change to scene, material, camera, controls or postprocessing code.
- Any modification to `.env*` files.
- Committing to git — this repository is treated as read-only per the user's standing instruction.
