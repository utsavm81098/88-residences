import { useCallback, useMemo, useRef } from "react";
import gsap from "gsap";
import * as THREE from "three";
import { unitData, getUnitMaterialConfig } from "../../utils/constant";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";

useGLTF.preload("/models/type-f.glb");
const _Y_AXIS = new THREE.Vector3(0, 1, 0);
const _hitPoint = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _temp = new THREE.Vector3();

const useBuilding = ({ controlsRef, modelRef }) => {
  const building = useGLTF("/models/type-f.glb");
  const glassHitbox = useGLTF("/models/hitbox.glb");
  const rotationTween = useRef(null);
  const { invalidate } = useThree();

  const unitMap = useMemo(() => {
    const map = {};

    unitData.forEach((unit) => {
      map[unit.name] = unit;
    });

    return map;
  }, [unitData]);

  const buildingScene = useMemo(() => {
    const buildingClone = building.scene.clone();

    const clonedMaterials = new Map();

    buildingClone.traverse((child) => {
      if (!child.isMesh || !child.material) return;

      const originalMat = child.material;
      const matUuid = originalMat.uuid;

      if (!clonedMaterials.has(matUuid)) {
        const cloned = originalMat.clone();

        if (cloned.transmission > 0) {
          cloned.side = THREE.DoubleSide;

          if (cloned.thickness === 0) cloned.thickness = 0.3;
          cloned.needsUpdate = true;
        } else {
          cloned.side = THREE.DoubleSide;
          cloned.needsUpdate = true;
        }

        clonedMaterials.set(matUuid, cloned);
      }

      child.material = clonedMaterials.get(matUuid);
    });

    return buildingClone;
  }, [building]); //

  const glassScene = useMemo(() => {
    const scene = glassHitbox.scene.clone();

    scene.traverse((child) => {
      if (!child.isMesh) return;

      const unit = unitMap[child.name];

      if (!unit) {
        // ✅ FIX 5: Unknown boxes → fully invisible, not 0.5.
        // They still intercept raycasts but won't show as grey blobs.
        child.material = new THREE.MeshStandardMaterial({
          transparent: true,
          opacity: 0,
          depthWrite: false, // ✅ FIX 2: must not occlude building behind
          side: THREE.DoubleSide,
        });
        // No userData.status so pointer handlers will early-return
        return;
      }

      const config = getUnitMaterialConfig({ status: unit.status });

      // ✅ FIX 1: Fully replace the hitbox MeshPhysicalMaterial (which GLTFLoader
      // auto-created from KHR_materials_transmission: 0.9) with a plain
      // MeshStandardMaterial. We want a flat colour overlay, not physical glass.
      child.material = new THREE.MeshStandardMaterial({
        color: config.baseColor,
        transparent: true,
        opacity: config.baseOpacity, // 0 — invisible until hover
        depthWrite: false, // ✅ FIX 2: transparent overlay must not
        //    write depth or it hides building glass
        depthTest: true,
        side: THREE.DoubleSide, // ✅ FIX 3: visible from all camera angles
        emissive: config.emissive,
        emissiveIntensity: 0,
      });

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
