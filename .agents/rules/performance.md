---
trigger: always_on
glob:
  - "src/**/*.{js,jsx,ts,tsx}"
description: Enforce performance optimization standards per SOP §15
---

# Performance Optimization Rules (SOP §15)

## Lazy Loading

- Heavy components, modals, and non-critical modules SHOULD be lazy-loaded using `React.lazy` and `Suspense`.
- Suspense fallback components must be lightweight (spinner or skeleton).
- Avoid loading non-critical components during initial page load.

**Note:** This project is a single-page 3D viewer where all building models are preloaded intentionally. Lazy loading applies primarily to UI overlays, modals, and future route-level components.

## Code Splitting

- Code splitting must be implemented at feature/module level when applicable.
- Avoid bundling unrelated features into a single chunk.
- Dynamic imports must be used responsibly to reduce bundle size.

## Memoization

### Rules

- Use `useMemo` and `useCallback` to prevent unnecessary recalculations and re-renders.
- Memoization must be applied only when there is a **proven performance benefit**.
- Overusing memoization without measurement is discouraged.
- Memoized values must be deterministic.
- Avoid using impure functions during render cycles.

### 3D-Specific Memoization (Project-Specific)

- GLB scenes MUST be cloned once via `useMemo` — never on every render.
- Three.js vectors/matrices used in `useFrame` MUST be module-level constants to avoid GC pressure.
- GSAP tweens MUST call `killTweensOf()` before creating new ones to prevent accumulation.

```js
// ✅ Correct: Module-level reusable vectors
const _Y_AXIS = new THREE.Vector3(0, 1, 0);
const _hitPoint = new THREE.Vector3();

// ❌ Wrong: Creating vectors every frame
useFrame(() => {
  const axis = new THREE.Vector3(0, 1, 0); // GC pressure!
});
```

## Virtualization

- Virtualization is mandatory for large lists (50+ items).
- Use `@tanstack/react-virtual` (recommended for Tailwind + shadcn).
- Rendering all items at once for large datasets is not allowed.

## Monitoring & Measurement

- Performance must be measured using React DevTools Profiler and Browser Performance Tools.
- Optimizations should be **data-driven, not assumption-based**.

## 3D-Specific Performance (Project-Specific)

| Optimization | Implementation |
|---|---|
| Model preloading | `useGLTF.preload()` at module level |
| Visibility toggling | All buildings in scene graph, `visible` toggles |
| Adaptive resolution | `AdaptiveDpr` + `PerformanceMonitor` |
| Camera stabilizer | FOV compensation threshold (0.05°) |
| Continuous render | `frameloop="always"` for OrbitControls damping |
