import { useState, useCallback } from "react";
import { useGLTF } from "@react-three/drei";

export const useHome = (controlsRef) => {
  const [cameraData, setCameraData] = useState(null);
  const [recordedPolar, setRecordedPolar] = useState({ min: 1000, max: -1000 });

  const handleCameraChange = useCallback((data) => {
    setCameraData(data);
    setRecordedPolar((prev) => {
      const current = parseFloat(data.polarAngle);
      return {
        min: Math.min(prev.min, current),
        max: prev.max === -1000 ? current : Math.max(prev.max, current),
      };
    });
  }, []);

  const handleResetCamera = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  }, [controlsRef]);

  const handleResetCache = useCallback(() => {
    useGLTF.clear();
  }, []);

  return {
    cameraData,
    recordedPolar,
    handleCameraChange,
    handleResetCamera,
    handleResetCache,
  };
};

export default useHome;
