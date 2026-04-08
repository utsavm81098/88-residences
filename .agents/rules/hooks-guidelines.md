---
trigger: always_on
glob:
  - "src/hooks/**"
  - "src/**/use-*.{js,jsx,ts,tsx}"
description: Enforce custom hook standards per SOP §11
---

# Custom Hooks Guidelines (SOP §11)

## Naming

- Hook names MUST start with `use` followed by camelCase: `useBuilding`, `useResponsiveConfig`
- File names MUST be kebab-case: `use-building.js`, `use-responsive-config.js`
- The name MUST clearly describe the hook's behavior or intent
- **One hook per file** (helper functions within the file are allowed)

## File Location

| Hook Type | Location | Example |
|---|---|---|
| Global reusable hook | `src/hooks/` | `use-responsive-config.js` |
| Feature-specific hook | `src/features/<feature>/` | `use-building.js` |
| Container hook | `src/containers/<name>/` | `use-inventory.js` |

## What Hooks Can Contain

- ✅ State management (`useState`, `useReducer`)
- ✅ Side effects (`useEffect`, `useLayoutEffect`)
- ✅ Memoization (`useMemo`, `useCallback`)
- ✅ Refs (`useRef`)
- ✅ Redux selectors and dispatch (`useSelector`, `useDispatch`)
- ✅ API calls (via services/utilities)
- ✅ Data transformation and computation
- ✅ Event handler definitions
- ✅ R3F hooks (`useThree`, `useFrame`, `useGLTF`) — in feature hooks only

## What Hooks CANNOT Contain

- ❌ **No JSX** — hooks must never return React elements
- ❌ **No HTML elements** — no DOM creation inside hooks
- ❌ **No styling logic** — no CSS-in-JS, no classname computation
- ❌ **No direct DOM manipulation** — no `document.getElementById`, except `document.body.style.cursor` for pointer state
- ❌ **No modal/toast triggering** — return data, let UI decide how to present
- ❌ **No route navigation** — return navigation intent, let container execute

## Return Value Pattern

Hooks MUST return an object with data and handlers:

```js
const useBuilding = ({ config, controlsRef }) => {
  // ... all logic ...

  return {
    // Data
    buildingScene,
    glassScene,
    // Handlers
    handlePointerOver,
    handlePointerOut,
    handlePointerMove,
    handleClick,
  };
};
```

## Reusability

- Global hooks (`/hooks/`) MUST be generic and not depend on a specific feature
- Accept configuration via parameters
- Avoid hardcoded values — use constants or parameters instead
- Prefer small, composable hooks — split large hooks into focused ones

## Hook Composition

Large hooks should be composed from smaller hooks:

```js
// ✅ Good: Composed from focused hooks
const useBuilding = (config) => {
  const materials = useBuildingMaterials(config);
  const interactions = useBuildingInteractions(config, materials);
  const camera = useCameraFocus(controlsRef);
  return { ...materials, ...interactions, ...camera };
};

// ❌ Bad: Monolithic 400-line hook
const useBuilding = (config) => {
  // 400 lines of mixed concerns
};
```

## Testing Requirements

- Hooks with business logic MUST be testable
- External dependencies must be mockable
- Test behavior, not implementation:
  - Initial state
  - State updates after actions
  - Side effects
  - Error handling
- Use `renderHook` from React Testing Library
