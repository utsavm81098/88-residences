import React, { useCallback, useMemo, useRef } from "react";
import gsap from "gsap";
import * as THREE from "three";
import { unitData, getUnitMaterialConfig } from "../../utils/constant";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
// import useFitCamera from "../use-fit-camera";

// useGLTF.setDecoderPath("/draco/");
useGLTF.preload("/models/TYPE_F+_compressed.glb");
useGLTF.preload("/models/HITBOX01.glb");
const _Y_AXIS = new THREE.Vector3(0, 1, 0);
const _hitPoint = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _temp = new THREE.Vector3();

const useBuilding = ({ controlsRef }) => {
  const building = useGLTF("/models/TYPE_F+_compressed.glb");
  const glassHitbox = useGLTF("/models/HITBOX01.glb");
  const rotationTween = useRef(null);
  const { invalidate } = useThree();

  // const HIDDEN_NODES = ["Box001", "Box006", "Box011", "Box016"];

  const unitMap = useMemo(() => {
    const map = {};

    unitData.forEach((unit) => {
      map[unit.name] = unit;
    });

    return map;
  }, [unitData]);

  const buildingScene = useMemo(() => {
    const buildingClone = building.scene.clone();

    buildingClone.traverse((child) => {
      if (!child.isMesh) return;
      // child.material.envMapIntensity = 2;
      // child.material.needsUpdate = true;
      // child.material.roughness = 1; // ⭐ removes shine
      // child.material.metalness = 0; // ⭐ removes reflections
      child.material.envMapIntensity = 0.5; // ⭐ reduce HDR effect
      child.material.flatShading = true;
      child.material.needsUpdate = true;
    });

    return buildingClone;
  }, [building]);

  const glassScene = useMemo(() => {
    const scene = glassHitbox.scene.clone();

    scene.traverse((child) => {
      if (!child.isMesh) return;

      child.material = new THREE.MeshStandardMaterial({
        transparent: true,
        opacity: 1,
      });
      const unit = unitMap[child.name];

      if (!unit) {
        child.material = new THREE.MeshStandardMaterial({
          transparent: true,
          opacity: 0.5,
        });
        return;
      }

      const config = getUnitMaterialConfig({ status: unit.status });

      const material = new THREE.MeshStandardMaterial({
        color: config.baseColor,
        transparent: true,
        opacity: config.baseOpacity,
        emissive: config.emissive,
        emissiveIntensity: 0,
      });

      child.material = material;
      child.userData.status = unit.status;
      child.userData.baseColor = config.baseColor;
      child.userData.hoverColor = config.hoverColor;
      child.userData.baseOpacity = config.baseOpacity;
      child.userData.hoverOpacity = config.hoverOpacity;
    });

    return scene;
  }, [glassHitbox, unitMap]);

  const handlePointerOver = useCallback((e) => {
    e.stopPropagation();

    const mesh = e.object;
    if (!mesh.userData.status) return;

    document.body.style.cursor = "pointer";

    gsap.to(mesh.material.color, {
      r: mesh.userData.hoverColor.r,
      g: mesh.userData.hoverColor.g,
      b: mesh.userData.hoverColor.b,
      duration: 0.25,
    });

    gsap.to(mesh.material, {
      opacity: mesh.userData.hoverOpacity,
      emissiveIntensity: 0.5,
      duration: 0.25,
      ease: "power2.out",
    });
  }, []);

  const handlePointerOut = useCallback((e) => {
    const mesh = e.object;
    if (!mesh.userData.status) return;

    document.body.style.cursor = "default";

    gsap.to(mesh.material.color, {
      r: mesh.userData.baseColor.r,
      g: mesh.userData.baseColor.g,
      b: mesh.userData.baseColor.b,
      duration: 0.25,
    });

    gsap.to(mesh.material, {
      opacity: mesh.userData.baseOpacity,
      emissiveIntensity: 0,
      duration: 0.25,
      ease: "power2.out",
    });
  }, []);

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();

      console.log("e: ", e);
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
  );

  return {
    buildingScene,
    glassScene,
    handlePointerOver,
    handlePointerOut,
    handleClick,
  };
};

export default useBuilding;
