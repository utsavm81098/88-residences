import { combineReducers } from "@reduxjs/toolkit";
import buildingReducer from "./building-slice";
import tooltipReducer from "./tooltip-slice";
import dragReducer from "./drag-slice";

export default combineReducers({
  building: buildingReducer,
  tooltip: tooltipReducer,
  drag: dragReducer,
});
