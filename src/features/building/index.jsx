import React, { memo, Suspense } from "react";
import { BUILDING_CONFIG } from "@/utils/constant";
import useBuilding from "./use-building";
import useBuildingInstance from "./use-building-instance";

const ACTIVE_POSITION = [0, 0, 0];
const INACTIVE_POSITION = [0, -1000, 0];

/**
 * Renders all buildings in the scene and manages their visibility and transitions.
 */
const BuildingModel = memo(function BuildingModel({
  controlsRef,
  position = [0, 0, 0],
  renderOrder = 0,
}) {
  const {
    currentBuildingIndex,
    previousBuildingIndex,
    isTransitioning,
    groupRefs,
    warmedUp,
    mountBackground,
  } = useBuilding({
    controlsRef,
  });

  return (
    <group position={position}>
      {BUILDING_CONFIG.map((config, index) => {
        const isCurrent = index === currentBuildingIndex;
        const isPrevious = isTransitioning && index === previousBuildingIndex;
        const isLanding = index === 0;

        // If it's a background building and we haven't reached the mount delay, do not render it.
        // This ensures the main canvas loads immediately with only the active building.
        if (!isLanding && !isCurrent && !isPrevious && !mountBackground) {
          return null;
        }

        const instance = (
          <BuildingInstance
            key={config.name}
            {...{
              groupRef: (el) => (groupRefs.current[index] = el),
              config,
              active: isCurrent,
              isTransitioning,
              controlsRef,
              renderOrder,
            }}
          />
        );

        // Background buildings must have their own Suspense to avoid blocking the main canvas
        if (!isLanding && !isCurrent && !isPrevious) {
          return (
            <Suspense key={config.name} fallback={null}>
              {instance}
            </Suspense>
          );
        }

        return instance;
      })}
    </group>
  );
});

/**
 * BuildingInstance component represents a single interactive building.
 * Memoized to prevent unnecessary re-renders during scene animations.
 */
const GLASS_RENDER_ORDER_OFFSET = 1;

const BuildingInstance = memo(function BuildingInstance({
  config,
  active,
  isTransitioning,
  controlsRef,
  renderOrder,
  groupRef,
}) {
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

  // During transitions, we let GSAP completely control the position by passing undefined.
  // Otherwise, active building is at [0, 0, 0] and inactive ones are warmed underground.
  const position = isTransitioning
    ? undefined
    : active
      ? ACTIVE_POSITION
      : INACTIVE_POSITION;

  return (
    <group ref={groupRef} visible={true} position={position}>
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
});

export default BuildingModel;
