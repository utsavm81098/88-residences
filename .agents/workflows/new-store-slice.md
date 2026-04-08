---
description: Add a new Redux Toolkit slice to the store
---

# New Store Slice Workflow

Use this workflow when adding a new **Redux Toolkit slice** for a new cross-application concern.

## Pre-check

Before creating a new slice, ask:
- Is this state truly **global** (needed by multiple unrelated components)? → Slice
- Is this state **feature-specific**? → Use `useState`/`useRef` in the feature hook instead
- Is this state **component-local** (form inputs, toggles)? → Use `useState` instead

Only create a slice for cross-application concerns (e.g., auth, theme, building selection).

## Steps

1. **Create the slice file**
   ```
   src/store/slices/<slice-name>-slice.js
   ```

   > **Note:** If the project still uses `src/redux/reducers/`, create there but flag for migration.

2. **Implement the slice**
   ```js
   // src/store/slices/<slice-name>-slice.js
   import { createSlice } from "@reduxjs/toolkit";

   const initialState = {
     // Define all state properties with initial values
   };

   export const sliceNameSlice = createSlice({
     name: "sliceName",
     initialState,
     reducers: {
       setProperty: (state, action) => {
         state.property = action.payload;
       },
       resetSlice: () => initialState,
     },
   });

   export const { setProperty, resetSlice } = sliceNameSlice.actions;
   export default sliceNameSlice.reducer;
   ```

3. **Register in the aggregator**
   ```js
   // src/store/slices/index.js
   import { combineReducers } from "@reduxjs/toolkit";
   import buildingReducer from "./building-slice";
   import tooltipReducer from "./tooltip-slice";
   import dragReducer from "./drag-slice";
   import sliceNameReducer from "./<slice-name>-slice"; // ← Add

   export default combineReducers({
     building: buildingReducer,
     tooltip: tooltipReducer,
     drag: dragReducer,
     sliceName: sliceNameReducer, // ← Add
   });
   ```

4. **Add tests**
   ```
   src/store/slices/__tests__/<slice-name>-slice.test.js
   ```
   ```js
   import reducer, { setProperty, resetSlice } from "../<slice-name>-slice";

   describe("<slice-name>-slice", () => {
     it("should return the initial state", () => {
       expect(reducer(undefined, { type: "unknown" })).toEqual(initialState);
     });

     it("should handle setProperty", () => {
       const state = reducer(initialState, setProperty("value"));
       expect(state.property).toBe("value");
     });

     it("should handle resetSlice", () => {
       const modifiedState = { ...initialState, property: "changed" };
       const state = reducer(modifiedState, resetSlice());
       expect(state).toEqual(initialState);
     });
   });
   ```

## Rules

- File name: `<name>-slice.js` (kebab-case)
- Slice name: `camelCase` (matches the store key)
- Export both actions and default reducer
- Always define `initialState` as a const
- No cross-slice imports inside reducers
- No async logic inside reducers (use `createAsyncThunk` if needed)
- No derived data in state (compute in selectors)

## Checklist

- [ ] Slice file: `<name>-slice.js` (kebab-case)
- [ ] `initialState` defined as const
- [ ] Actions exported as named exports
- [ ] Reducer exported as default
- [ ] Registered in `slices/index.js` aggregator
- [ ] Tests added for all reducers
