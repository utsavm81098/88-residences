const GrassGrid = ({ position = [], renderOrder = 0 }) => {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={position} // under grid
      receiveShadow
      renderOrder={renderOrder}
    >
      <planeGeometry args={[300, 300]} />
      <meshStandardMaterial
        color="#0a0a0a" // elegant black
        roughness={0.9}
        metalness={0.05}
        depthWrite={false}
        polygonOffset={true} // ⭐ added
        polygonOffsetFactor={1} // ⭐ push back in depth buffer
        polygonOffsetUnits={1} // ⭐
      />
    </mesh>
  );
};

export default GrassGrid;
