---
trigger: always_on
glob:
  - "src/store/**"
  - "src/redux/**"
description: Enforce Redux Toolkit state management patterns per SOP §8
---

# State Management Rules (SOP §8)

## When to Use What

| Use Case | Solution |
|---|---|
| Component-only state (form inputs, toggles) | `useState` |
| Shared UI state between siblings | React Context or lift state |
| App-wide state (building selection, UI mode) | Redux Toolkit |
| Server/API state | TanStack Query (if/when APIs are added) |

## Redux Toolkit (RTK) Patterns

### Store Structure

```
src/store/
├── index.js              # configureStore
└── slices/
    ├── index.js           # combineReducers (aggregator)
    ├── building-slice.js  # Active building, selected unit, snap state
    ├── tooltip-slice.js   # Hover tooltip visibility, position, data
    └── drag-slice.js      # OrbitControls drag flag
```

### Slice Rules

1. **Global slices only** — The store folder must contain only cross-application concerns (building state, tooltip, drag).
2. **Feature-specific state** must live in feature hooks (`useState`, `useRef`), NOT in global slices.
3. **Each slice must be independent** — no cross-slice imports inside reducers.
4. **All slices must be registered** in `slices/index.js`.

### Slice File Pattern

```js
// src/store/slices/building-slice.js
import { createSlice } from "@reduxjs/toolkit";
import { BUILDING_CONFIG } from "../../utils/constant";

const initialState = {
  currentBuildingIndex: 0,
  currentBuilding: BUILDING_CONFIG[0],
  // ...
};

export const buildingSlice = createSlice({
  name: "building",
  initialState,
  reducers: {
    nextBuilding: (state) => { /* ... */ },
    setSelectedUnit: (state, action) => { /* ... */ },
  },
});

export const { nextBuilding, setSelectedUnit } = buildingSlice.actions;
export default buildingSlice.reducer;
```

### Aggregator Pattern

```js
// src/store/slices/index.js
import { combineReducers } from "@reduxjs/toolkit";
import buildingReducer from "./building-slice";
import tooltipReducer from "./tooltip-slice";
import dragReducer from "./drag-slice";

export default combineReducers({
  building: buildingReducer,
  tooltip: tooltipReducer,
  drag: dragReducer,
});
```

### Selector Rules

- UI components must consume state via `useSelector` ONLY in containers or feature hooks.
- Pure UI components (`/components`) must receive data via props.
- Use memoized selectors (`createSelector`) for derived data when performance matters.

### Action Dispatch Rules

- Dispatch actions ONLY from:
  - Container hooks
  - Feature hooks (`use-building.js`, `use-direction-label.js`)
  - Event handlers in containers
- NEVER dispatch from pure UI components.

## Anti-Patterns (Forbidden)

- ❌ Storing derived data in the store (compute it in selectors)
- ❌ Storing component-local state in Redux (use `useState`)
- ❌ Cross-slice dependencies inside reducers
- ❌ Dispatching from inside `useEffect` without proper dependency arrays
- ❌ Using Redux for form state (use local state or a form library)
