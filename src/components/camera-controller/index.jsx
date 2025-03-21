import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { useControls } from "../../context/ControlsContext";
import { OrbitControls } from "@react-three/drei";

const CameraController = () => {
  const { camera, gl } = useThree();
  const controlsRef = useRef();
  const controlsContext = useControls();
  const initializedRef = useRef(false);

  useFrame(() => {
    if (controlsRef.current) {
      if (!initializedRef.current) {
        camera.lookAt(controlsRef.current.target);
        if (controlsContext) {
          controlsContext.current = controlsRef.current;
        }
        initializedRef.current = true;
      }
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      args={[camera, gl.domElement]}
      minDistance={40}
      maxDistance={100}
      minPolarAngle={Math.PI / 2.5}
      maxPolarAngle={Math.PI / 2}
      maxPan={[Infinity, 10, Infinity]}
      minPan={[Infinity, -10, Infinity]}
      enableDamping
      dampingFactor={0.05}
      target={[0, 10, 0]}
    />
  );
};

export default CameraController;
