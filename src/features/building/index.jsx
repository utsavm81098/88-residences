import React, { memo, useState, useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { BUILDING_CONFIG } from "@/utils/constant";
import useBuilding from "./use-building";
import useBuildingInstance from "./use-building-instance";

const WARMUP_FRAMES = 2;

/**
 * Renders all buildings in the scene and manages their visibility and transitions.
 */
const BuildingModel = ({
  controlsRef,
  position = [0, 0, 0],
  renderOrder = 0,
}) => {
  const {
    currentBuildingIndex,
    previousBuildingIndex,
    isTransitioning,
    groupRefs,
  } = useBuilding({
    controlsRef,
  });

  // GPU Warmup: Force all buildings to render for at least one frame
  // This pre-compiles shaders and uploads textures to avoid stutters during transition.
  const [warmedUp, setWarmedUp] = useState(false);
  const frames = useRef(0);

  useFrame(() => {
    if (warmedUp) return;
    frames.current++;
    // Wait for the GPU to process draw calls for all models
    if (frames.current >= WARMUP_FRAMES) setWarmedUp(true);
  });

  return (
    <group position={position}>
      {BUILDING_CONFIG.map((config, index) => {
        const isCurrent = index === currentBuildingIndex;
        const isPrevious = isTransitioning && index === previousBuildingIndex;

        return (
          <BuildingInstance
            key={config.name}
            groupRef={(el) => (groupRefs.current[index] = el)}
            config={config}
            active={isCurrent}
            isVisible={!warmedUp || isCurrent || isPrevious}
            controlsRef={controlsRef}
            renderOrder={renderOrder}
          />
        );
      })}
    </group>
  );
};

/**
 * BuildingInstance component represents a single interactive building.
 * Memoized to prevent unnecessary re-renders during scene animations.
 */
const BUILDING_RENDER_ORDER = 0;
const GLASS_RENDER_ORDER_OFFSET = 1;

const BuildingInstance = memo(
  ({ config, active, isVisible, controlsRef, renderOrder, groupRef }) => {
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

    const glassRenderOrder = renderOrder + GLASS_RENDER_ORDER_OFFSET;

    return (
      <group ref={groupRef} visible={isVisible}>
        <primitive object={buildingScene} renderOrder={renderOrder} />
        <primitive
          key={glassScene.uuid}
          object={glassScene}
          renderOrder={glassRenderOrder}
          onPointerOver={active ? handlePointerOver : undefined}
          onPointerOut={active ? handlePointerOut : undefined}
          onPointerMove={active ? handlePointerMove : undefined}
          onPointerLeave={active ? handlePointerLeave : undefined}
          onClick={active ? handleClick : undefined}
        />
      </group>
    );
  },
);

export default memo(BuildingModel);
