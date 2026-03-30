import React, { memo, useRef, useEffect } from "react";
import gsap from "gsap";
import useBuilding from "./use-building";
import { BUILDING_CONFIG } from "../../utils/constant";
import { useSelector } from "react-redux";

// This wrapper component pre-renders ALL models but only reveals the active one.
// This prevents the "Loading..." flickering because all models are already in the scene graph.
const BuildingModel = ({
  controlsRef,
  position = [0, 0, 0],
  renderOrder = 0,
  onTooltipShow,
  onTooltipHide,
  onTooltipMove,
}) => {
  const { currentBuilding } = useSelector((state) => state.building);

  return (
    <group position={position}>
      {BUILDING_CONFIG.map((config) => (
        <BuildingInstance
          key={config.name}
          config={config}
          active={currentBuilding.name === config.name}
          controlsRef={controlsRef}
          renderOrder={renderOrder}
          onTooltipShow={onTooltipShow}
          onTooltipHide={onTooltipHide}
          onTooltipMove={onTooltipMove}
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
  onTooltipShow,
  onTooltipHide,
  onTooltipMove,
}) => {
  const {
    buildingScene,
    glassScene,
    handlePointerOver,
    handlePointerOut,
    handlePointerMove,
    handleClick,
  } = useBuilding({
    config, // Pass the specific config to the hook
    controlsRef,
    onTooltipShow,
    onTooltipHide,
    onTooltipMove,
  });

  // const groupRef = useRef();

  // // Add scale & slide animation when model becomes active
  // useEffect(() => {
  //   if (!groupRef.current) return;

  //   if (active) {
  //     // Kill any previous tweens if user clicked fast
  //     gsap.killTweensOf(groupRef.current.scale);
  //     gsap.killTweensOf(groupRef.current.position);

  //     // Start small and low
  //     groupRef.current.scale.set(0.01, 0.01, 0.01);
  //     groupRef.current.position.y = -20;

  //     // Pop in dynamically
  //     gsap.to(groupRef.current.scale, {
  //       x: 1,
  //       y: 1,
  //       z: 1,
  //       duration: 1.2,
  //       ease: "elastic.out(1, 0.75)",
  //     });

  //     gsap.to(groupRef.current.position, {
  //       y: 0,
  //       duration: 0.8,
  //       ease: "power3.out",
  //     });
  //   }
  // }, [active]);

  return (
    <group
      // ref={groupRef}
      visible={active}
      // We keep non-active models in the scene but toggle visibility to ensure instantaneous switching
    >
      <primitive object={buildingScene} renderOrder={renderOrder} />
      {active && (
        <primitive
          object={glassScene}
          renderOrder={renderOrder + 1}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onPointerMove={handlePointerMove}
          onClick={handleClick}
        />
      )}
    </group>
  );
};

export default memo(BuildingModel);
