import * as THREE from "three";

const GrassGrid = () => {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.05, 0]} // under grid
      receiveShadow
      renderOrder={0}
    >
      <planeGeometry args={[300, 300]} />
      <meshStandardMaterial
        color="#0a0a0a" // elegant black
        roughness={0.9}
        metalness={0.05}
        depthWrite={true}
      />
    </mesh>
  );
};

export default GrassGrid;
