import { combineReducers } from "@reduxjs/toolkit";
import buildingReducer from "./building-slice";
import tooltipReducer from "./tooltip-slice";
import dragReducer from "./drag-slice";
import sidebarReducer from "./sidebar-slice";

const appReducer = combineReducers({
  building: buildingReducer,
  tooltip: tooltipReducer,
  drag: dragReducer,
  sidebar: sidebarReducer,
});

const rootReducer = (state, action) => {
  if (action.type === "app/reset") {
    state = undefined;
  }
  return appReducer(state, action);
};

export default rootReducer;
