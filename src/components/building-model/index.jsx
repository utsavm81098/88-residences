import { useGLTF } from "@react-three/drei";
import { useEffect } from "react";
import * as THREE from "three";

export default function BuildingModel() {
  // const { scene } = useGLTF("/models/Type-F-compressed.glb");
  // const { scene } = useGLTF("/models/Glass-HitBox.glb");
  // const { scene } = useGLTF("/models/TYPE-A-HitBox.glb");

  const building = useGLTF("/models/Type-F-compressed.glb");
  const glassHitbox = useGLTF("/models/Glass-HitBox.glb");

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

  useEffect(() => {
    glassHitbox.scene.traverse((child) => {
      // console.log("child: ", child);
      if (child.isMesh) {
        child.material = new THREE.MeshBasicMaterial({
          color: "#ffffff", // your plain color
          transparent: true,
          opacity: 0,
          depthWrite: false,
        });
        child.material = child.material.clone();
        // child.material.color.set("#ff0000");
        console.log("Mesh Name:", child.name);
      }
    });
  }, [glassHitbox]);

  return (
    <>
      <primitive object={building.scene} />
      <primitive
        object={glassHitbox.scene}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        onClick={onClick}
      />
    </>
  );
}
