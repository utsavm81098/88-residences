import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import gsap from "gsap";
import { useCallback, useMemo, useRef } from "react";
import * as THREE from "three";
import useFitCamera from "../use-fit-camera";

useGLTF.setDecoderPath("/draco/");
useGLTF.preload("/models/type-f-compressed.glb");
useGLTF.preload("/models/glass-hitbox.glb");

// ✅ Module-level constants — allocated once, never recreated
const _Y_AXIS = new THREE.Vector3(0, 1, 0);
const _hitPoint = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _temp = new THREE.Vector3();

const BASE_HITBOX_MATERIAL = new THREE.MeshBasicMaterial({
  color: "#0080ff",
  transparent: true,
  opacity: 0,
  depthWrite: false,
  polygonOffset: true,
  polygonOffsetFactor: -1,
  polygonOffsetUnits: -1,
});

const BuildingModel = ({
  controlsRef,
  modelRef,
  position = [],
  renderOrder = 0,
}) => {
  const rotationTween = useRef(null);
  const { invalidate } = useThree(); // ✅ Removed unused `camera` and `size`

  useFitCamera(modelRef, controlsRef);

  const building = useGLTF("/models/BUILDING_1.glb");
  const glassHitbox = useGLTF("/models/glass-hitbox.glb");

  // ✅ Material moved to module-level constant — no longer recreated on mount
  const glassScene = useMemo(() => {
    const scene = glassHitbox.scene.clone();
    scene.traverse((child) => {
      if (child.isMesh) child.material = BASE_HITBOX_MATERIAL.clone();
    });
    return scene;
  }, [glassHitbox]);

  // ✅ Unwrapped redundant useMemo wrapper
  const buildingScene = useMemo(() => building.scene.clone(), [building]);

  const handlePointerOver = useCallback((e) => {
    e.stopPropagation();
    document.body.style.cursor = "pointer";
    gsap.to(e.object.material, {
      opacity: 0.4,
      duration: 0.25,
      ease: "power2.out",
    });
  }, []);

  const handlePointerOut = useCallback((e) => {
    e.stopPropagation();
    document.body.style.cursor = "auto";
    gsap.to(e.object.material, {
      opacity: 0,
      duration: 0.25,
      ease: "power2.out",
    });
  }, []);

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();

      const controls = controlsRef.current;
      if (!controls) return;

      const camera = controls.object;

      if (rotationTween.current) {
        rotationTween.current.eventCallback("onInterrupt", null);
        rotationTween.current.eventCallback("onComplete", null);
        rotationTween.current.kill();
        rotationTween.current = null;
      }

      controls.enabled = false;

      const center = controls.target.clone();

      // ✅ Reuse module-level vectors instead of `new THREE.Vector3()` per click
      e.object.getWorldPosition(_hitPoint);
      _dir.subVectors(_hitPoint, center);

      const targetAngle = Math.atan2(_dir.x, _dir.z);
      const currentAzimuth = controls.getAzimuthalAngle();

      const delta = Math.atan2(
        Math.sin(targetAngle - currentAzimuth),
        Math.cos(targetAngle - currentAzimuth),
      );
      const finalAzimuth = currentAzimuth + delta;

      const offset = camera.position.clone().sub(center);
      const state = { azimuth: currentAzimuth };
      let prevAzimuth = currentAzimuth;

      const onFinish = () => {
        controls.enabled = true;
        rotationTween.current = null;
      };

      rotationTween.current = gsap.to(state, {
        azimuth: finalAzimuth,
        duration: 1.2,
        ease: "power3.inOut",

        onUpdate: () => {
          const frameDelta = state.azimuth - prevAzimuth;
          prevAzimuth = state.azimuth;

          // ✅ Reuse _Y_AXIS + _temp instead of new Vector3 every frame
          offset.applyAxisAngle(_Y_AXIS, frameDelta);
          camera.position.copy(_temp.copy(center).add(offset));

          controls.target.copy(center);
          controls.update();
          invalidate();
        },

        onComplete: onFinish,
        onInterrupt: onFinish,
      });
    },
    [controlsRef, invalidate],
  ); // ✅ Added missing `invalidate` dependency

  return (
    <group ref={modelRef} position={position}>
      <primitive object={buildingScene} renderOrder={renderOrder} />
      {/* <primitive
        object={glassScene}
        renderOrder={renderOrder + 1}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      /> */}
    </group>
  );
};

export default BuildingModel;
