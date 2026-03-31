const GrassGrid = ({ position = [], renderOrder = 0 }) => {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={position}
      receiveShadow
      renderOrder={renderOrder}
    >
      <planeGeometry args={[300, 300]} />
      <meshStandardMaterial
        color="#000000"
        roughness={0.9}
        metalness={0.05}
        polygonOffset={true}
        polygonOffsetFactor={4}
        polygonOffsetUnits={4}
        depthWrite={true}
      />
    </mesh>
  );
};

export default GrassGrid;
