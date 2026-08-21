import React from "react";
import useHome from "./use-home";

/**
 * HomeContainer - Coordinates the 2D UI for the Home Masterplan route
 * over the single shared 3D Canvas.
 */
export const HomeContainer = ({ active = true }) => {
  return (
    <div className="relative h-full w-full flex-1 overflow-hidden pointer-events-none" />
  );
};

export default HomeContainer;
