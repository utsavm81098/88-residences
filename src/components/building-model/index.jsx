import { memo } from "react";
import useBuilding from "./use-building";

const BuildingModel = ({
  controlsRef,
  modelRef,
  position = [],
  renderOrder = 0,
  onTooltipShow, // ← new
  onTooltipHide, // ← new
  onTooltipMove, // ← new
}) => {
  const {
    buildingScene,
    glassScene,
    handlePointerOver,
    handlePointerOut,
    handlePointerMove,
    handlePointerDown,
    handlePointerUp,
  } = useBuilding({
    controlsRef,
    modelRef,
    onTooltipShow,
    onTooltipHide,
    onTooltipMove,
  }); // ← pass tooltip handlers

  return (
    <group ref={modelRef} position={position}>
      <primitive object={buildingScene} renderOrder={renderOrder} />
      <primitive
        object={glassScene}
        renderOrder={renderOrder + 1}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      />
    </group>
  );
};

export default memo(BuildingModel);
