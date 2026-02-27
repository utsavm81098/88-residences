import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

useGLTF.setDecoderPath("/draco/");

useGLTF.preload("/models/Type-F-optimized.glb");
useGLTF.preload("/models/Glass-HitBox.glb");

const BuildingModel = ({ position = [], renderOrder = 0 }) => {
  // const { scene } = useGLTF("/models/TYPE-A-HitBox.glb");
  // const building = useGLTF("/models/type-f-optimized.glb");

  const building = useGLTF("/models/type-f-compressed.glb");
  const glassHitbox = useGLTF("/models/glass-hitbox.glb");

  const glassScene = useMemo(() => {
    const scene = glassHitbox.scene.clone();

    scene.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshBasicMaterial({
          color: "#ffffff",
          transparent: true,
          opacity: 0,
          depthWrite: false,
          polygonOffset: true, // ⭐ added
          polygonOffsetFactor: -1, // ⭐ pull forward (toward camera) so hover works
          polygonOffsetUnits: -1,
        });
      }
    });

    return scene;
  }, [glassHitbox]);

  const buildingScene = useMemo(() => {
    const scene = building.scene.clone();

    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.metalness = 0;
        child.material.roughness = 0.9;
      }
    });

    return scene;
  }, [building]);

  const onPointerOver = (e) => {
    e.stopPropagation();
    e.object.material.opacity = 0.4;
    e.object.material.color.set("#0080ff");
  };

  const onPointerOut = (e) => {
    e.stopPropagation();
    e.object.material.opacity = 0;
  };

  const onClick = (e) => {
    console.log("Clicked:", e.object.name);
  };

  return (
    <>
      <primitive
        object={buildingScene}
        position={position}
        renderOrder={renderOrder}
      />
      <primitive
        object={glassScene}
        position={position}
        renderOrder={renderOrder + 1} // glass above building
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        onClick={onClick}
      />
    </>
  );
};

export default BuildingModel;
