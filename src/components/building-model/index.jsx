import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import gsap from "gsap";
import { useCallback, useMemo, useRef } from "react";
import * as THREE from "three";

useGLTF.setDecoderPath("/draco/");

useGLTF.preload("/models/type-f-compressed.glb");
useGLTF.preload("/models/glass-hitbox.glb");

const BuildingModel = ({ controlsRef, position = [], renderOrder = 0 }) => {
  const groupRef = useRef();
  const rotationTween = useRef(null);
  const { invalidate } = useThree();

  const building = useGLTF("/models/type-f-compressed.glb");
  const glassHitbox = useGLTF("/models/glass-hitbox.glb");

  const baseHitboxMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#0080ff",
        transparent: true,
        opacity: 0,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      }),
    [],
  );

  const glassScene = useMemo(() => {
    const scene = glassHitbox.scene.clone();
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material = baseHitboxMaterial.clone();
      }
    });
    return scene;
  }, [glassHitbox, baseHitboxMaterial]);

  const buildingScene = useMemo(() => {
    return building.scene.clone();
  }, [building]);

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

      // ✅ FIX: Clear onInterrupt BEFORE killing so the old tween's
      // async callback can't accidentally re-enable controls mid-animation.
      if (rotationTween.current) {
        rotationTween.current.eventCallback("onInterrupt", null);
        rotationTween.current.eventCallback("onComplete", null);
        rotationTween.current.kill();
        rotationTween.current = null;
      }

      // ✅ FIX: Always explicitly disable controls here, after kill,
      // so state is always clean before the new tween starts.
      controls.enabled = false;

      const center = controls.target.clone();

      const hitPoint = new THREE.Vector3();
      e.object.getWorldPosition(hitPoint);

      const dir = new THREE.Vector3().subVectors(hitPoint, center);
      const targetAngle = Math.atan2(dir.x, dir.z);

      let currentAzimuth = controls.getAzimuthalAngle();

      // Shortest path calculation
      let delta = targetAngle - currentAzimuth;
      delta = Math.atan2(Math.sin(delta), Math.cos(delta));

      const finalAzimuth = currentAzimuth + delta;

      const offset = camera.position.clone().sub(center);

      const state = { azimuth: currentAzimuth };
      let prevAzimuth = currentAzimuth;

      // ✅ FIX: Shared re-enable function to guarantee controls
      // are always restored exactly once when the tween ends.
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

          offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), frameDelta);

          camera.position.copy(center.clone().add(offset));
          controls.target.copy(center);
          controls.update();

          invalidate();
        },

        onComplete: onFinish,
        onInterrupt: onFinish,
      });
    },
    [controlsRef],
  );
  return (
    <group ref={groupRef} position={position}>
      <primitive
        object={buildingScene}
        position={position}
        renderOrder={renderOrder}
      />
      <primitive
        object={glassScene}
        position={position}
        renderOrder={renderOrder + 1}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      />
    </group>
  );
};

export default BuildingModel;
