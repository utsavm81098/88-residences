import { Html, useGLTF } from "@react-three/drei";
import { useControls } from "../../context/ControlsContext";
import { useEffect, useRef, useState } from "react";
import { baseMaterials, unitData } from "../../utils/constant";
import gsap from "gsap";
import { Box3, Vector3 } from "three";
import PopUp from "../pop-up";
import PropTypes from "prop-types";
import { flattenUnitData } from "../../utils/helper";
import { useFrame } from "@react-three/fiber";

const flattenedUnitData = flattenUnitData(unitData);

const BuildingModel = ({ onUnitSelect, selectedUnit }) => {
  const { scene } = useGLTF("/models/TYPE-A-HitBox.glb", "/draco/");
  const [selected, setSelected] = useState(null);
  const [hoverInfo, setHoverInfo] = useState(null);
  const controlsRef = useControls();
  const animationFrameRef = useRef(null);
  const initializedRef = useRef(false);

  const handlePointerOver = (e) => {
    e.stopPropagation();
    const unit = flattenedUnitData[e.object.name];
    if (unit) {
      const status = unit.status;
      const materials = baseMaterials({ status });

      if (selected && e.object.name === selected.name) {
        e.object.material = materials.selected;
      } else {
        e.object.material = materials.hover;
      }
      document.body.style.cursor = "pointer";
      const newHoverInfo = {
        unit,
        position: { x: e.clientX, y: e.clientY },
      };
      setHoverInfo(newHoverInfo);
    }
  };

  const handlePointerOut = (e) => {
    e.stopPropagation();
    const unit = flattenedUnitData[e.object.name];
    if (unit) {
      const status = unit.status;
      const materials = baseMaterials({ status });

      if (selected && e.object.name === selected.name) {
        e.object.material = materials.selected;
      } else {
        e.object.material = materials.color || e.object.material;
      }
      document.body.style.cursor = "auto";
      setHoverInfo(null);
    }
  };

  const handleClick = (e) => {
    e.stopPropagation();
    const clickedObject = e.object;
    const unit = flattenedUnitData[e.object.name];
    if (unit) {
      onUnitSelect(unit);

      if (selected && selected !== clickedObject) {
        const prevUnit = flattenedUnitData[selected.name];
        if (prevUnit) {
          const prevMaterials = baseMaterials({ status: prevUnit.status });
          selected.material = prevMaterials.color;
        }
      }

      const status = unit.status;
      const materials = baseMaterials({ status });
      clickedObject.material = materials.selected;
      setSelected(clickedObject);

      if (controlsRef && controlsRef.current) {
        gsap.killTweensOf(controlsRef.current.target);
        gsap.killTweensOf(controlsRef.current.object.position);

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }

        controlsRef.current.enabled = true;

        const worldPosition = new Vector3();
        clickedObject.getWorldPosition(worldPosition);

        const startPosition = controlsRef.current.object.position.clone();
        const startTarget = controlsRef.current.target.clone();

        const buildingCenter = new Vector3(0, 0, 0);

        const flatStartPosition = new Vector3(
          startPosition.x,
          0,
          startPosition.z
        );
        const flatWorldPosition = new Vector3(
          worldPosition.x,
          0,
          worldPosition.z
        );

        const initialDistanceToCenter =
          flatStartPosition.distanceTo(buildingCenter);

        const endTarget = new Vector3(
          worldPosition.x,
          controlsRef.current.target.y,
          worldPosition.z
        );

        const objectToCenterDir = new Vector3(
          worldPosition.x - buildingCenter.x,
          0, // Ignore Y component
          worldPosition.z - buildingCenter.z
        ).normalize();

        const objectDistanceFromCenter =
          flatWorldPosition.distanceTo(buildingCenter);

        const endPosition = new Vector3(
          worldPosition.x +
            objectToCenterDir.x *
              (initialDistanceToCenter - objectDistanceFromCenter),
          startPosition.y,
          worldPosition.z +
            objectToCenterDir.z *
              (initialDistanceToCenter - objectDistanceFromCenter)
        );

        const originalSettings = {
          enabled: controlsRef.current.enabled,
          minDistance: controlsRef.current.minDistance,
          maxDistance: controlsRef.current.maxDistance,
        };

        controlsRef.current.enabled = false;

        const animationProxy = {
          targetX: startTarget.x,
          targetY: startTarget.y,
          targetZ: startTarget.z,
          positionX: startPosition.x,
          positionY: startPosition.y,
          positionZ: startPosition.z,
          progress: 0,
        };

        gsap.to(animationProxy, {
          targetX: endTarget.x,
          targetY: endTarget.y,
          targetZ: endTarget.z,
          positionX: endPosition.x,
          positionY: endPosition.y,
          positionZ: endPosition.z,
          progress: 1,
          duration: 1.2,
          ease: "power3.out",
          onUpdate: () => {
            if (!controlsRef.current) return;

            controlsRef.current.target.set(
              animationProxy.targetX,
              animationProxy.targetY,
              animationProxy.targetZ
            );

            controlsRef.current.object.position.set(
              animationProxy.positionX,
              animationProxy.positionY,
              animationProxy.positionZ
            );

            controlsRef.current.object.lookAt(controlsRef.current.target);
            controlsRef.current.object.updateMatrixWorld(true);

            controlsRef.current.update();
          },
          onComplete: () => {
            if (!controlsRef.current) return;

            controlsRef.current.enabled = originalSettings.enabled;
            controlsRef.current.minDistance = originalSettings.minDistance;
            controlsRef.current.maxDistance = originalSettings.maxDistance;

            controlsRef.current.update();
          },
        });
      }
    }
  };

  useFrame(() => {
    if (scene && !initializedRef.current) {
      const box = new Box3().setFromObject(scene);
      const center = box.getCenter(new Vector3());
      scene.position.sub(center);
      scene.position.y = box.min.y * -1.1;

      scene.traverse((object) => {
        if (object.type === "Mesh") {
          const unitName = object.name;
          const unit = flattenedUnitData[unitName];

          if (unit) {
            const status = unit.status;
            const materials = baseMaterials({ status });

            object.material = materials.color || object.material;
            object.userData = { status: unit.status };
          }
        }
      });

      // Mark as initialized so we don't run this code every frame
      initializedRef.current = true;
    }
  });

  useEffect(() => {
    const controls = controlsRef?.current;
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        if (controls) controls.enabled = true;
      }
    };
  }, [controlsRef]);

  useEffect(() => {
    if (!selectedUnit && selected) {
      const prevUnit = flattenedUnitData[selected.name];
      if (prevUnit) {
        const prevMaterials = baseMaterials({ status: prevUnit.status });
        selected.material = prevMaterials.color;
      }
      setSelected(null);
    }
  }, [selectedUnit, selected]);

  return (
    <>
      <primitive
        object={scene}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />
      {hoverInfo && (
        <Html>
          <PopUp unit={hoverInfo.unit} position={hoverInfo.position} />
        </Html>
      )}
    </>
  );
};

BuildingModel.propTypes = {
  onUnitSelect: PropTypes.func.isRequired,
  selectedUnit: PropTypes.object,
};

export default BuildingModel;
