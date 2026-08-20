import { createSlice } from "@reduxjs/toolkit";

/**
 * appLoader — tracks whether the app's FIRST-EVER 3D content has finished
 * loading, regardless of whether the user's first route is Home or Inventory
 * (a direct link, e.g. /inventory?building=A, never mounts Home at all — see
 * containers/keep-alive-outlet). Global Redux state, not per-page local
 * state, precisely because it must survive route navigation unchanged: once
 * true it never resets, so containers/global-loader never reappears when the
 * user switches between Home and Inventory afterward.
 *
 * Fed from two independent sites, whichever one actually mounts first:
 * - containers/home/use-home.js's handleReady (Home's SceneReadyGate signal)
 * - containers/inventory/use-inventory.js's handleReady (Inventory's own
 *   SceneReadyGate signal — NOT containers/canvas-loader/index.jsx's old
 *   drei-useProgress-only isReady, which only meant bytes had downloaded;
 *   see that file's doc comment for why that alone was never enough)
 * Both dispatch the same markInitialLoadComplete action; whichever fires
 * first wins, and the other's later dispatch is a harmless no-op against an
 * already-true value.
 */
const initialState = {
  initialLoadComplete: false,
};

export const appLoaderSlice = createSlice({
  name: "appLoader",
  initialState,
  reducers: {
    markInitialLoadComplete: (state) => {
      state.initialLoadComplete = true;
    },
  },
});

export const { markInitialLoadComplete } = appLoaderSlice.actions;
export default appLoaderSlice.reducer;
