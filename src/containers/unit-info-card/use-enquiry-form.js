import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getEnquirySchema } from "@/utils/validation";

/**
 * Custom hook to handle enquiry form logic, state, and validation.
 * @param {Object} props - Hook properties.
 * @param {Object} props.unit - The selected unit data.
 * @param {Object} props.selectedBuilding - The active building data.
 * @param {Function} props.setEnquiryOpen - State setter to close the dialog.
 */
export const useEnquiryForm = ({ unit, selectedBuilding, setEnquiryOpen }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const formSchema = useMemo(() => getEnquirySchema(t), [t]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
  });

  const onSubmit = (values) => {
    // Mimicking CF7 submission logic (placeholder for actual API call)
    console.info("Enquiry submitted:", {
      ...values,
      unit: unit?.apartment_number,
      building: selectedBuilding?.name,
    });

    // Reset and close
    setEnquiryOpen(false);
    form.reset();
  };

  // Field configuration for dynamic rendering
  const fields = [
    {
      name: "firstName",
      label: t("first_name"),
      placeholder: "John",
    },
    {
      name: "lastName",
      label: t("last_name"),
      placeholder: "Doe",
    },
    {
      name: "email",
      label: t("email"),
      placeholder: "john@example.com",
      type: "email",
    },
    {
      name: "phone",
      label: t("phone"),
      placeholder: "+1 234 567 890",
      type: "tel",
    },
  ];

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    fields,
  };
};
