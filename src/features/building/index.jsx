import React, { memo, Suspense } from "react";
import { BUILDING_CONFIG } from "@/utils/constant";
import useBuilding from "./use-building";
import useBuildingInstance from "./use-building-instance";
import { ComponentErrorBoundary } from "@/components/error-boundary";

const ACTIVE_POSITION = [0, 0, 0];
const INACTIVE_POSITION = [0, -1000, 0];

// Inside a <Canvas> an error boundary's fallback renders into the R3F scene
// graph, not the DOM, so it must not be the default shadcn <Card> fallback
// (see components/error-boundary/error-fallback.jsx) — rendering nothing is
// the correct degrade here.
const NullFallback = () => null;

/**
 * Renders all buildings in the scene and manages their visibility and transitions.
 */
const BuildingModel = memo(function BuildingModel({
  controlsRef,
  position = [0, 0, 0],
  renderOrder = 0,
  // Whether Inventory (as opposed to Home) is the currently VISIBLE scene
  // under the unified canvas — see the comment on `sceneActive` further down
  // for why this has to be threaded all the way to useBuildingInstance.
  active: sceneActive = true,
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
    sceneActive,
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
              sceneActive,
              isVisible,
              isTransitioning,
              controlsRef,
              renderOrder,
            }}
          />
        );

        // Each building gets its own error boundary, isolated from every
        // other building AND from the outer "Unified 3D Canvas" boundary in
        // containers/scene-canvas/index.jsx. Without this, one building's
        // GLB/hitbox failing to load (a real mobile-network failure mode —
        // useGLTF's Suspense promise rejects and propagates as a thrown
        // render error, which Suspense does not catch) took down the ENTIRE
        // canvas — Home included — on the next repeat visit to whichever
        // building failed. Now it just renders nothing for that one
        // building; every other building and Home keep working.
        return (
          <ComponentErrorBoundary
            key={config.name}
            name={`Building ${config.name}`}
            FallbackComponent={NullFallback}
            // Auto-retries the next time this building becomes (or stops
            // being) the selected one, instead of staying blank for the rest
            // of the session after one failed load.
            resetKeys={[isCurrent]}
          >
            <Suspense fallback={null}>{instance}</Suspense>
          </ComponentErrorBoundary>
        );
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
  sceneActive,
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
    sceneActive,
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
