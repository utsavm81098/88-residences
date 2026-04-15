import { useRef } from "react";
import { useSelector } from "react-redux";
import useBuildingTransition from "./use-building-transition";

export const useBuildingModel = ({ controlsRef }) => {
  const { currentBuilding } = useSelector((state) => state.building);
  const groupRefs = useRef({});

  useBuildingTransition({ groupRefs, controlsRef });

  return {
    currentBuilding,
    groupRefs,
  };
};

export default useBuildingModel;
