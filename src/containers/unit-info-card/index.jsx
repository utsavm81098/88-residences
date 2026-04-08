import React from "react";
import { useDispatch } from "react-redux";
import { clearSelectedUnit } from "../../store/slices/building-slice";
import UnitInfoCardUI from "../../components/ui/unit-info-card";

const UnitInfoCardContainer = ({ unit }) => {
  const dispatch = useDispatch();

  const onClose = () => {
    dispatch(clearSelectedUnit());
  };

  return <UnitInfoCardUI unit={unit} onClose={onClose} />;
};

export default UnitInfoCardContainer;
