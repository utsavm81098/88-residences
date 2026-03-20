import { memo } from "react";
import useBuilding from "./use-building";

const BuildingModel = ({
  controlsRef,
  modelRef,
  position = [],
  renderOrder = 0,
}) => {
  const {
    buildingScene,
    glassScene,
    handlePointerOver,
    handlePointerOut,
    handleClick,
  } = useBuilding({ controlsRef, modelRef });

  return (
    <group ref={modelRef} position={position}>
      <primitive object={buildingScene} renderOrder={renderOrder} />
      <primitive
        object={glassScene}
        renderOrder={renderOrder + 1}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      />
    </group>
  );
};

export default memo(BuildingModel);
