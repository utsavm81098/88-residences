import { useDispatch } from "react-redux";
import { clearSelectedUnit } from "@/store/slices/building-slice";

/**
 * Hook for UnitInfoCard logic.
 * Handles selection clearing and localization strings.
 */
export const useUnitInfoCard = ({ unit }) => {
  const dispatch = useDispatch();

  const handleClose = () => {
    dispatch(clearSelectedUnit());
  };

  const status = unit.status || (unit.apartment_sold ? "sold" : "available");

  return {
    status,
    handleClose,
  };
};
