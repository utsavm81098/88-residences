import { combineReducers } from "@reduxjs/toolkit";
import buildingReducer from "./buildingSlice";
import tooltipReducer from "./tooltipSlice";

export const reducers = combineReducers({
  building: buildingReducer,
  tooltip: tooltipReducer,
});
