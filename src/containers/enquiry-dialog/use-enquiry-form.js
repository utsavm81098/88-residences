import { useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getEnquirySchema } from "@/utils/validation";
import client from "@/services/api-client";
import { IP_CHECK_URL, ERROR_MESSAGES, GA_ID } from "@/utils/app-constants";
import { logger } from "@/utils/logger";
import { toast } from "sonner";
import api from "@/services";
import { getLocalizedString, pushGtmEvent } from "@/utils/helper";

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

  // Helper to extract tracking data (matches 88-custom.js implementation)
  const trackingData = useMemo(() => {
    if (typeof window === "undefined") return {};

    const urlParams = new URLSearchParams(window.location.search);
    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(";").shift();
      return "";
    };

    const hasFbclid = urlParams.has("fbclid");
    const facebookfbc = hasFbclid ? getCookie("_fbc") : "";
    const facebookfbp = hasFbclid ? getCookie("_fbp") : "";
    const facebookUserID = facebookfbp ? facebookfbp.split(".").pop() : "";

    return {
      utm_source: urlParams.get("utm_source") || "88residences site",
      utm_medium: urlParams.get("utm_medium") || "",
      utm_campaign: urlParams.get("utm_campaign") || "",
      facebookfbc,
      facebookfbp,
      facebookUserID,
      fullPageUrl: window.location.href,
      userAgent: navigator.userAgent,
    };
  }, []);

  const formSchema = useMemo(() => getEnquirySchema(t), [t]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      sid: "",
      cid: "",
      userIP: "",
      ...trackingData,
    },
  });

  // Async tracking data (IP, SID, CID)
  useEffect(() => {
    // 1. Get IP Address (Matches 88-custom.js, using axios client)
    client({ url: IP_CHECK_URL, method: "get" })
      .then((ip) =>
        form.setValue("userIP", typeof ip === "string" ? ip.trim() : ip),
      )
      .catch(() =>
        logger.warn("Failed to fetch user IP from checkip.amazonaws.com"),
      );

    // 2. Get Google Analytics Session/Client IDs
    // Since GTM loads gtag asynchronously, we retry until it's available

    let attempts = 0;
    const maxAttempts = 10;

    const fetchGAIds = () => {
      if (typeof window.gtag === "function") {
        window.gtag("get", GA_ID, "session_id", (sid) => {
          if (sid) form.setValue("sid", sid);
        });
        window.gtag("get", GA_ID, "client_id", (cid) => {
          if (cid) form.setValue("cid", cid);
        });
        return true;
      }
      return false;
    };

    if (!fetchGAIds()) {
      const interval = setInterval(() => {
        attempts++;
        if (fetchGAIds() || attempts >= maxAttempts) {
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [form]);

  const onSubmit = async (values) => {
    try {
      const formData = new FormData();
      formData.append("firstname", values.firstName || "");
      formData.append("lastname", values.lastName || "");
      formData.append("email", values.email || "");
      formData.append("phone", values.phone || "");
      const messageText = `${t("apartment", "Apartment")} ${unit?.apartment_number || ""} | ${t("building", "Building")} ${selectedBuilding?.name || ""} | ${getLocalizedString(unit?.property_direction?.name, lang) || ""} | ${getLocalizedString(unit?.bedrooms?.name, lang) || ""}`;
      formData.append("message", messageText);
      formData.append("facebookUserID", values.facebookUserID || "");
      formData.append("facebookfbc", values.facebookfbc || "");
      formData.append("facebookfbp", values.facebookfbp || "");
      formData.append("utm_source", values.utm_source || "");
      formData.append("utm_campaign", values.utm_campaign || "");
      formData.append("utm_medium", values.utm_medium || "");
      formData.append("fullPageLink", values.fullPageUrl || "");
      formData.append("currUSerIP", values.userIP || "");
      formData.append("currUSerAgent", values.userAgent || "");
      formData.append("sid", values.sid || "");
      formData.append("cid", values.cid || "");
      const isHe = lang === "he";
      const formId = isHe ? "9360" : "9311";
      formData.append("_wpcf7", formId);
      formData.append("_wpcf7_unit_tag", `wpcf7-f${formId}-o1`);

      const response = isHe
        ? await api.enquiry.postHe(formData)
        : await api.enquiry.postEn(formData);

      if (response && response.status === "mail_sent") {
        pushGtmEvent("cf7submission", { formId, formData });
        toast.success(
          response.message ||
            t(
              "enquiry_success_message",
              "Your message has been sent successfully. Thank you!",
            ),
        );
        setEnquiryOpen(false);
        form.reset();
      } else {
        const errorStatus =
          response?.status === "validation_failed" ? 422 : response?.status;
        const errMsg =
          ERROR_MESSAGES[errorStatus] ||
          (response && response.message) ||
          ERROR_MESSAGES.common;
        toast.error(errMsg);
      }
    } catch (error) {
      logger.error("Enquiry submission failed:", error);
      const errMsg =
        ERROR_MESSAGES[error?.status] ||
        error?.message ||
        ERROR_MESSAGES.common;
      toast.error(errMsg);
    }
  };

  // Field configuration for dynamic rendering
  const fields = useMemo(
    () => [
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
        dir: "ltr",
      },
      {
        name: "phone",
        label: t("phone"),
        placeholder: "+1 234 567 890",
        type: "tel",
        dir: "ltr",
      },
      // Tracking Hidden Fields
      { name: "utm_source", type: "hidden" },
      { name: "utm_medium", type: "hidden" },
      { name: "utm_campaign", type: "hidden" },
      { name: "facebookfbc", type: "hidden" },
      { name: "facebookfbp", type: "hidden" },
      { name: "facebookUserID", type: "hidden" },
      { name: "fullPageUrl", type: "hidden" },
      { name: "userAgent", type: "hidden" },
      { name: "userIP", type: "hidden" },
      { name: "sid", type: "hidden" },
      { name: "cid", type: "hidden" },
    ],
    [t],
  );

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    fields,
    isSubmitting: form.formState.isSubmitting,
  };
};
