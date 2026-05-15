import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { clearSelectedUnit } from "@/store/slices/building-slice";
import useToggleState from "@/hooks/use-toggle-state";

/**
 * Hook for UnitInfoCard logic.
 * Handles selection clearing, localization, and enquiry state.
 */
export const useUnitInfoCard = ({ unit }) => {
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "en";

  const {
    state: isEnquiryOpen,
    open: openEnquiry,
    set: setEnquiryOpen,
  } = useToggleState(false);

  const handleClose = () => {
    dispatch(clearSelectedUnit());
  };

  const status = unit?.status || (unit?.apartment_sold ? "sold" : "available");

  return {
    t,
    lang,
    status,
    handleClose,
    isEnquiryOpen,
    openEnquiry,
    setEnquiryOpen,
  };
};
