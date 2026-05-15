import React from "react";
import { useEnquiryForm } from "./use-enquiry-form";
import EnquiryDialogView from "./enquiry-dialog-view";
import { getDirection } from "@/i18n";

/**
 * EnquiryDialogContainer - Smart container for the property enquiry form.
 * Connects the enquiry form logic (validation, submission, tracking) to the UI.
 */
const EnquiryDialogContainer = ({
  isEnquiryOpen,
  setEnquiryOpen,
  unit,
  selectedBuilding,
  t,
  lang,
}) => {
  const { form, onSubmit, fields } = useEnquiryForm({
    unit,
    selectedBuilding,
    setEnquiryOpen,
  });

  const dir = getDirection(lang);

  return (
    <EnquiryDialogView
      {...{
        isEnquiryOpen,
        setEnquiryOpen,
        unit,
        selectedBuilding,
        t,
        lang,
        dir,
        form,
        onSubmit,
        fields,
      }}
    />
  );
};

export default EnquiryDialogContainer;
