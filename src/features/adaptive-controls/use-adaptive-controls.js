import { useCallback, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { setDragging } from "@/store/slices/drag-slice";
import { hideTooltip } from "@/store/slices/tooltip-slice";
import useResponsiveConfig from "@/hooks/use-responsive-config";
import { useThree } from "@react-three/fiber";
import gsap from "gsap";

export const useAdaptiveControls = (controlsRef) => {
  const config = useResponsiveConfig();
  const dispatch = useDispatch();
  // const { gl } = useThree();

  // const isDraggingRef = useRef(false);
  // const previousYRef = useRef(0);
  // const targetYRef = useRef(10); // Syncs with TARGET

  const onStart = useCallback(() => {
    dispatch(setDragging(true));
    dispatch(hideTooltip());
  }, [dispatch]);

  const onEnd = useCallback(() => {
    dispatch(setDragging(false));
  }, [dispatch]);

  // Lock the polar angle to force vertical drag into vertical pan
  // const FIXED_ANGLE = Math.PI / 2.2;
  // const POLAR = { min: FIXED_ANGLE, max: FIXED_ANGLE };
  const POLAR = { min: 1.1, max: 1.5 };
  const TARGET = [0, 10, 0];

  // useEffect(() => {
  //   if (!controlsRef) return;

  //   const canvas = gl.domElement;

  //   const onPointerDown = (e) => {
  //     if (e.pointerType === 'mouse' && e.button !== 0) return;
  //     isDraggingRef.current = true;
  //     previousYRef.current = e.clientY;

  //     // Keep our custom target ref strictly synced with the real target
  //     // in case standard panning or resets altered it
  //     if (controlsRef.current) {
  //       targetYRef.current = controlsRef.current.target.y;
  //     }
  //   };

  //   const onPointerMove = (e) => {
  //     if (!isDraggingRef.current) return;

  //     const deltaY = e.clientY - previousYRef.current;
  //     previousYRef.current = e.clientY;

  //     if (controlsRef.current) {
  //       // Adjust this to change how fast the camera pans vertically
  //       const panSpeed = 0.08;

  //       // Calculate the ideal target Y based on drag
  //       const idealY = targetYRef.current + deltaY * panSpeed;

  //       // Restrict vertical panning between ground level and roof
  //       targetYRef.current = Math.max(0, Math.min(40, idealY));

  //       // GSAP manages the ultra-smooth, high-performance continuous damping
  //       // without ANY React re-renders or frame stutter.
  //       gsap.to(controlsRef.current.target, {
  //         y: targetYRef.current,
  //         duration: 0.4,
  //         ease: "power2.out",
  //         overwrite: "auto",
  //       });
  //     }
  //   };

  //   const onPointerUp = () => {
  //     isDraggingRef.current = false;
  //   };

  //   canvas.addEventListener('pointerdown', onPointerDown);
  //   window.addEventListener('pointermove', onPointerMove);
  //   window.addEventListener('pointerup', onPointerUp);

  //   return () => {
  //     canvas.removeEventListener('pointerdown', onPointerDown);
  //     window.removeEventListener('pointermove', onPointerMove);
  //     window.removeEventListener('pointerup', onPointerUp);
  //   };
  // }, [gl, controlsRef]);

  return {
    config,
    onStart,
    onEnd,
    POLAR,
    TARGET,
  };
};

export default useAdaptiveControls;
