import {
  createSlice,
  createAsyncThunk,
  createSelector,
} from "@reduxjs/toolkit";
import { BUILDING_CONFIG } from "@/utils/constant";
import api from "@/services";
import { normalizeInventory, filterUnits } from "@/utils/filter-helper";

// Selectors
export const selectBuildingState = (state) => state.building;

export const selectNormalizedInventory = createSelector(
  [selectBuildingState],
  (building) => normalizeInventory(building.inventory),
);

export const selectFilteredInventory = createSelector(
  [selectNormalizedInventory, (state) => state.building.filters],
  (normalized, filters) => filterUnits(normalized, filters),
);

export const selectBuildingUnits = createSelector(
  [selectFilteredInventory, (state) => state.building.currentBuilding.name],
  (filtered, buildingName) =>
    filtered.filter((u) => u.buildingName === buildingName),
);

export const fetchInventory = createAsyncThunk(
  "building/fetchInventory",
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.inventory.getAll({ params });
      return response;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch inventory");
    }
  },
);

const initialState = {
  currentBuildingIndex: 0,
  currentBuilding: BUILDING_CONFIG[0],
  selectedUnit: null,
  mobileSelectedUnit: null,
  snapHeight: 0,
  isTransitioning: false,
  previousBuildingIndex: null,
  transitionDirection: null,
  filters: {
    rooms: [],
    direction: [],
    price: [],
    areas: [],
  },
  inventory: {},
  loading: false,
  error: null,
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
      if (newIndex === state.currentBuildingIndex) return;
      state.previousBuildingIndex = state.currentBuildingIndex;
      const total = BUILDING_CONFIG.length;
      const diff = (newIndex - state.currentBuildingIndex + total) % total;
      state.transitionDirection = diff <= total / 2 ? "next" : "prev";
      state.isTransitioning = true;
      state.currentBuildingIndex = newIndex;
      state.currentBuilding = BUILDING_CONFIG[newIndex];
      state.selectedUnit = null;
      state.mobileSelectedUnit = null;
    },
    resetBuilding: (state) => {
      state.currentBuildingIndex = 0;
      state.currentBuilding = BUILDING_CONFIG[0];
      state.selectedUnit = null;
      state.mobileSelectedUnit = null;
      state.snapHeight = 0;
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
    setSnapHeight: (state, action) => {
      state.snapHeight = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };
    },
    clearFilters: (state) => {
      state.filters = {
        rooms: [],
        direction: [],
        price: null,
        areas: null,
        buildings: null,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInventory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventory.fulfilled, (state, action) => {
        state.loading = false;
        // Transform the inventory data to include buildingName in each unit
        const rawData = action.payload || {};

        state.inventory = Object.keys(rawData).reduce((acc, key) => {
          const units = rawData[key];
          if (Array.isArray(units)) {
            acc[key] = units.map((item) => ({
              ...item,
              buildingName: key,
            }));
          } else {
            acc[key] = units;
          }
          return acc;
        }, {});
      })
      .addCase(fetchInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  nextBuilding,
  prevBuilding,
  setBuilding,
  resetBuilding,
  endTransition,
  setSelectedUnit,
  setMobileSelectedUnit,
  clearSelectedUnit,
  setSnapHeight,
  setFilters,
  clearFilters,
} = buildingSlice.actions;

export default buildingSlice.reducer;
