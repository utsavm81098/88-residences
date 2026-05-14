import React from "react";
import { useTranslation } from "react-i18next";
import { ICONS } from "@/assets/icons";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import { getLocalizedString, extractDigit } from "@/utils/helper";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

/**
 * EnquiryDialog - UI component for the property enquiry form.
 * Following SOP: Pure UI building block.
 */
const EnquiryDialog = ({
  isEnquiryOpen,
  setEnquiryOpen,
  unit,
  selectedBuilding,
}) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  return (
    <Dialog open={isEnquiryOpen} onOpenChange={setEnquiryOpen}>
      <DialogContent className="bg-card-bg/90 backdrop-blur-2xl border-white/10 text-white rounded-[2rem] max-w-sm ring-1 ring-white/10 shadow-2xl p-6">
        <div className="flex flex-col items-start mb-6">
          <img
            src={logo}
            alt="88 Residences"
            className="h-12 w-auto object-contain"
          />
        </div>
        <DialogHeader className="text-start space-y-3">
          <DialogTitle className="text-[15px] font-medium text-white/80 leading-relaxed">
            {t(
              "enquiry_greeting",
              "Please get back to me regarding this apartment:",
            )}
          </DialogTitle>
          <div className="text-accent-yellow font-bold text-[13px] tracking-wide uppercase">
            {`${t("apt")} ${unit?.apartment_number} | ${selectedBuilding?.name} | ${getLocalizedString(unit?.property_direction?.name, lang) || "Front"} | ${extractDigit(unit?.bedrooms?.slug) || "1"} ${t("bedrooms")}`}
          </div>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {/* Form placeholder - Logic to be added in future enhancement */}
          <div className="space-y-3">
            <Button
              variant="brand"
              className="w-full font-bold h-10 rounded-lg text-[13px] transition-colors"
            >
              {t("contact_us")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnquiryDialog;
