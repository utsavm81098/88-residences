import { createSlice } from "@reduxjs/toolkit";
import { BUILDING_CONFIG } from "../../utils/constant";

const initialState = {
  currentBuildingIndex: 0,
  currentBuilding: BUILDING_CONFIG[0],
  isMenuOpen: false,
  selectedUnit: null,
  mobileSelectedUnit: null,
  snap: { height: 0.4, snapIndex: 0 },
  // ── Transition state (carousel circle rotation) ──
  isTransitioning: false,
  previousBuildingIndex: null,
  transitionDirection: null, // "next" | "prev"
  // ── Filter state ──
  filters: {
    rooms: [],
    budget: null,
    type: [],
    exposure: [],
    buildings: null,
  },
};

export const buildingSlice = createSlice({
  name: "building",
  initialState,
  reducers: {
    nextBuilding: (state) => {
      state.previousBuildingIndex = state.currentBuildingIndex;
      state.transitionDirection = "next";
      state.isTransitioning = true;
      state.currentBuildingIndex =
        (state.currentBuildingIndex + 1) % BUILDING_CONFIG.length;
      state.currentBuilding = BUILDING_CONFIG[state.currentBuildingIndex];
    },
    prevBuilding: (state) => {
      state.previousBuildingIndex = state.currentBuildingIndex;
      state.transitionDirection = "prev";
      state.isTransitioning = true;
      state.currentBuildingIndex =
        (state.currentBuildingIndex - 1 + BUILDING_CONFIG.length) %
        BUILDING_CONFIG.length;
      state.currentBuilding = BUILDING_CONFIG[state.currentBuildingIndex];
    },
    setBuilding: (state, action) => {
      const newIndex = action.payload;
      if (newIndex === state.currentBuildingIndex) {
        state.isMenuOpen = false;
        return;
      }
      state.previousBuildingIndex = state.currentBuildingIndex;
      // Determine shortest rotation direction
      const total = BUILDING_CONFIG.length;
      const diff = (newIndex - state.currentBuildingIndex + total) % total;
      state.transitionDirection = diff <= total / 2 ? "next" : "prev";
      state.isTransitioning = true;
      state.currentBuildingIndex = newIndex;
      state.currentBuilding = BUILDING_CONFIG[newIndex];
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
      state.mobileSelectedUnit = null;
      state.snap = { height: 0.4, snapIndex: 0 };
      state.isTransitioning = false;
      state.previousBuildingIndex = null;
      state.transitionDirection = null;
    },
    endTransition: (state) => {
      state.isTransitioning = false;
      state.previousBuildingIndex = null;
      state.transitionDirection = null;
    },
    setSelectedUnit: (state, action) => {
      state.selectedUnit = action.payload;
    },
    setMobileSelectedUnit: (state, action) => {
      state.mobileSelectedUnit = action.payload;
    },
    clearSelectedUnit: (state) => {
      state.selectedUnit = null;
      state.mobileSelectedUnit = null;
    },
    setSnap: (state, action) => {
      state.snap = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        rooms: [],
        budget: null,
        type: [],
        exposure: [],
        buildings: null,
      };
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
  endTransition,
  setSelectedUnit,
  setMobileSelectedUnit,
  clearSelectedUnit,
  setSnap,
  setFilters,
  clearFilters,
} = buildingSlice.actions;
export default buildingSlice.reducer;
