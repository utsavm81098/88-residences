import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  activePanel: "inventory", // "home" | "inventory" | "about" | "gallery" | "map" | "contact"
};

export const sidebarSlice = createSlice({
  name: "sidebar",
  initialState,
  reducers: {
    setActivePanel: (state, action) => {
      state.activePanel = action.payload;
    },
  },
});

export const { setActivePanel } = sidebarSlice.actions;
export default sidebarSlice.reducer;
