import React, { memo } from "react";
import useBuilding from "./use-building";
import useBuildingInstance from "./use-building-instance";
import { BUILDING_CONFIG } from "@/utils/constant";

/**
 * Renders all buildings in the scene and manages their visibility and transitions.
 */
const BuildingModel = ({
  controlsRef,
  position = [0, 0, 0],
  renderOrder = 0,
}) => {
  const { currentBuilding, groupRefs } = useBuilding({ controlsRef });

  return (
    <group position={position}>
      {BUILDING_CONFIG.map((config, index) => (
        <BuildingInstance
          key={config.name}
          groupRef={(el) => (groupRefs.current[index] = el)}
          config={config}
          active={currentBuilding.name === config.name}
          controlsRef={controlsRef}
          renderOrder={renderOrder}
        />
      ))}
    </group>
  );
};

const BuildingInstance = ({
  config,
  active,
  controlsRef,
  renderOrder,
  groupRef,
}) => {
  const {
    buildingScene,
    glassScene,
    handlePointerOver,
    handlePointerOut,
    handlePointerMove,
    handlePointerLeave,
    handleClick,
  } = useBuildingInstance({
    config,
    controlsRef,
  });

  return (
    <group ref={groupRef} visible={active}>
      <primitive object={buildingScene} renderOrder={renderOrder} />
      <primitive
        key={glassScene.uuid}
        object={glassScene}
        renderOrder={renderOrder + 1}
        onPointerOver={active ? handlePointerOver : undefined}
        onPointerOut={active ? handlePointerOut : undefined}
        onPointerMove={active ? handlePointerMove : undefined}
        onPointerLeave={active ? handlePointerLeave : undefined}
        onClick={active ? handleClick : undefined}
      />
    </group>
  );
};

export default memo(BuildingModel);
