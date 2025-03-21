import { useTexture } from "@react-three/drei";
import * as THREE from "three";

const GrassGrid = () => {
  const grassTexture = useTexture("/textures/grass.jpg");

  grassTexture.wrapS = THREE.RepeatWrapping;
  grassTexture.wrapT = THREE.RepeatWrapping;
  grassTexture.repeat.set(20, 20);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
      <planeGeometry args={[300, 300, 128, 128]} />
      <meshStandardMaterial
        map={grassTexture}
        roughness={0.8}
        metalness={0.1}
        depthWrite={true}
        polygonOffset={true}
        polygonOffsetFactor={-1}
      />
    </mesh>
  );
};

export default GrassGrid;
