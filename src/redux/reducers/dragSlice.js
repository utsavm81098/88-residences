import { createSlice } from "@reduxjs/toolkit";

const dragSlice = createSlice({
  name: "drag",
  initialState: {
    isDragging: false,
  },
  reducers: {
    setDragging: (state, action) => {
      state.isDragging = action.payload;
    },
  },
});

export const { setDragging } = dragSlice.actions;
export default dragSlice.reducer;
