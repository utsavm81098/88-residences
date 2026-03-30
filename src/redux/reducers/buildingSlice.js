import { createSlice } from "@reduxjs/toolkit";
import { BUILDING_CONFIG } from "../../utils/constant";

const initialState = {
  currentBuildingIndex: 0,
  currentBuilding: BUILDING_CONFIG[0],
  isMenuOpen: false,
};

export const buildingSlice = createSlice({
  name: "building",
  initialState,
  reducers: {
    nextBuilding: (state) => {
      state.currentBuildingIndex =
        (state.currentBuildingIndex + 1) % BUILDING_CONFIG.length;
      state.currentBuilding = BUILDING_CONFIG[state.currentBuildingIndex];
    },
    prevBuilding: (state) => {
      state.currentBuildingIndex =
        (state.currentBuildingIndex - 1 + BUILDING_CONFIG.length) %
        BUILDING_CONFIG.length;
      state.currentBuilding = BUILDING_CONFIG[state.currentBuildingIndex];
    },
    setBuilding: (state, action) => {
      state.currentBuildingIndex = action.payload;
      state.currentBuilding = BUILDING_CONFIG[action.payload];
      state.isMenuOpen = false;
    },
    toggleMenu: (state) => {
      state.isMenuOpen = !state.isMenuOpen;
    },
    closeMenu: (state) => {
      state.isMenuOpen = false;
    },
    resetBuilding: (state) => {
      state.currentBuildingIndex = 0;
      state.currentBuilding = BUILDING_CONFIG[0];
      state.isMenuOpen = false;
    },
  },
});

export const {
  nextBuilding,
  prevBuilding,
  setBuilding,
  toggleMenu,
  closeMenu,
  resetBuilding,
} = buildingSlice.actions;
export default buildingSlice.reducer;
