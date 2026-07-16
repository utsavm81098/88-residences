import { useState, useCallback } from "react";
import { useGLTF } from "@react-three/drei";

export const useHome = (controlsRef) => {
  const [cameraData, setCameraData] = useState(null);

  const handleCameraChange = useCallback((data) => {
    setCameraData(data);
  }, []);

  const handleResetCache = useCallback(() => {
    useGLTF.clear();
  }, []);

  return {
    cameraData,
    handleCameraChange,
    handleResetCache,
  };
};

export default useHome;
