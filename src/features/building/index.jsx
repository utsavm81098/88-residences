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

        // If it's a background building and we haven't reached the mount delay, do not render it.
        // This ensures the main canvas loads immediately with only the active building.
        if (!isCurrent && !isPrevious && !mountBackground) {
          return null;
        }

        const isVisible = isCurrent || isPrevious;

        const instance = (
          <BuildingInstance
            key={config.name}
            {...{
              groupRef: (el) => (groupRefs.current[index] = el),
              config,
              active: isCurrent,
              isVisible,
              isTransitioning,
              controlsRef,
              renderOrder,
            }}
          />
        );

        // Background buildings must have their own Suspense to avoid blocking the main canvas
        if (!isCurrent && !isPrevious) {
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
  isVisible,
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

  // During transitions, GSAP animates position for visible building groups directly.
  // Inactive background buildings remain underground at [0, -1000, 0].
  const position = isTransitioning
    ? isVisible
      ? undefined
      : INACTIVE_POSITION
    : active
      ? ACTIVE_POSITION
      : INACTIVE_POSITION;

  return (
    <group ref={groupRef} visible={isVisible} position={position}>
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
