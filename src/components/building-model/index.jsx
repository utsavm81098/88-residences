import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

useGLTF.setDecoderPath("/draco/");

useGLTF.preload("/models/Type-F-optimized.glb");
useGLTF.preload("/models/Glass-HitBox.glb");

export default function BuildingModel() {
  // const { scene } = useGLTF("/models/Type-F-compressed.glb");
  // const { scene } = useGLTF("/models/Glass-HitBox.glb");
  // const { scene } = useGLTF("/models/TYPE-A-HitBox.glb");

  const building = useGLTF("/models/Type-F-optimized.glb");
  const glassHitbox = useGLTF("/models/Glass-HitBox.glb");

  const glassScene = useMemo(() => {
    const scene = glassHitbox.scene.clone();

    scene.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshBasicMaterial({
          color: "#ffffff",
          transparent: true,
          opacity: 0,
          depthWrite: false,
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
      <primitive object={buildingScene} position={[0, 0, 0]} renderOrder={2} />
      <primitive
        object={glassScene}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        onClick={onClick}
      />
    </>
  );
}
