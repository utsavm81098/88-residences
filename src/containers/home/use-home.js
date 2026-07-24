import { useCallback } from "react";
import { useGLTF } from "@react-three/drei";

export const useHome = () => {
  const handleResetCache = useCallback(() => {
    useGLTF.clear();
  }, []);

  return {
    handleResetCache,
  };
};

export default useHome;

