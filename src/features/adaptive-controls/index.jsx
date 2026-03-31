import { OrbitControls } from "@react-three/drei";
import useResponsiveConfig from "../../hooks/useResponsiveConfig";
import { useDispatch } from "react-redux";
import { setDragging } from "../../redux/reducers/dragSlice";
import { hideTooltip } from "../../redux/reducers/tooltipSlice";

const POLAR = { min: 1.1, max: 1.5 };
const TARGET = [0, 10, 0];

const AdaptiveControls = ({ controlsRef }) => {
  const config = useResponsiveConfig();
  const dispatch = useDispatch();

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.05}
      target={TARGET}
      enablePan={false}
      enableZoom
      rotateSpeed={0.5}
      minPolarAngle={POLAR.min}
      maxPolarAngle={POLAR.max}
      minDistance={config.orbit.min}
      maxDistance={config.orbit.max}
      onStart={() => {
        dispatch(setDragging(true));
        dispatch(hideTooltip());
      }}
      onEnd={() => dispatch(setDragging(false))}
    />
  );
};

export default AdaptiveControls;
