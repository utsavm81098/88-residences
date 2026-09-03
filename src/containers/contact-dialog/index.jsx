import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { useContactForm } from "./use-contact-form";
import ContactDialogView from "./contact-dialog-view";
import { getDirection } from "@/i18n";

/**
 * ContactDialogContainer - Smart container for the general contact form.
 * Connects the contact form logic (validation, tracking, submission) to the UI view.
 */
export const ContactDialogContainer = memo(function ContactDialogContainer({
  isContactOpen,
  setContactOpen,
}) {
  const { t, i18n } = useTranslation();
  const { form, onSubmit, fields, isSubmitting } = useContactForm({
    setContactOpen,
  });

  const dir = getDirection(i18n.language);

  return (
    <ContactDialogView
      {...{
        isContactOpen,
        setContactOpen,
        t,
        dir,
        form,
        onSubmit,
        fields,
        isSubmitting,
      }}
    />
  );
});

export default ContactDialogContainer;
