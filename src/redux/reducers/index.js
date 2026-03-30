import { combineReducers } from "@reduxjs/toolkit";
import buildingReducer from "./buildingSlice";

export const reducers = combineReducers({
  building: buildingReducer,
});
