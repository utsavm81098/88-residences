import { createSlice } from "@reduxjs/toolkit";
import { BUILDING_CONFIG } from "../../utils/constant";

const initialState = {
  currentBuildingIndex: 0,
  currentBuilding: BUILDING_CONFIG[0],
  isMenuOpen: false,
  selectedUnit: null,
  snap: { height: "85px", snapIndex: 0 },
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
      state.selectedUnit = null;
      state.snap = { height: "85px", snapIndex: 0 };
    },
    setSelectedUnit: (state, action) => {
      state.selectedUnit = action.payload;
    },
    clearSelectedUnit: (state) => {
      state.selectedUnit = null;
    },
    setSnap: (state, action) => {
      state.snap = action.payload;
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
  setSelectedUnit,
  clearSelectedUnit,
  setSnap,
} = buildingSlice.actions;
export default buildingSlice.reducer;
