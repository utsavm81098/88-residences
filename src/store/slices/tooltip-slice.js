import { createSlice } from "@reduxjs/toolkit";

const tooltipSlice = createSlice({
  name: "tooltip",
  initialState: {
    visible: false,
    unit: null,
    x: 0,
    y: 0,
  },
  reducers: {
    showTooltip: (state, action) => {
      state.visible = true;
      state.unit = action.payload.unit;
      state.x = action.payload.x;
      state.y = action.payload.y;
    },
    hideTooltip: (state) => {
      state.visible = false;
      // state.unit = null; // Keep last unit to prevent unmount flicker
    },
    updateTooltipPosition: (state, action) => {
      state.x = action.payload.x;
      state.y = action.payload.y;
    },
    updateTooltipUnit: (state, action) => {
      state.unit = action.payload;
    },
  },
});

export const {
  showTooltip,
  hideTooltip,
  updateTooltipUnit,
  updateTooltipPosition,
} = tooltipSlice.actions;
export default tooltipSlice.reducer;
