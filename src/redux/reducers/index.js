import { combineReducers } from "@reduxjs/toolkit";
import buildingReducer from "./buildingSlice";
import tooltipReducer from "./tooltipSlice";
import dragReducer from "./dragSlice";

export const reducers = combineReducers({
  building: buildingReducer,
  tooltip: tooltipReducer,
  drag: dragReducer,
});
