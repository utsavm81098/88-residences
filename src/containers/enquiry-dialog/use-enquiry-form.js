import { useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getEnquirySchema } from "@/utils/validation";
import client from "@/services/api-client";
import { IP_CHECK_URL } from "@/utils/app-constants";
import { logger } from "@/utils/logger";

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
    const GA_ID = import.meta.env.VITE_GA_ID;

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

  const onSubmit = (values) => {
    // Mimicking CF7 submission logic (placeholder for actual API call)
    logger.info("Enquiry submitted:", {
      ...values,
      unit: unit?.apartment_number,
      building: selectedBuilding?.name,
    });

    // Reset and close
    setEnquiryOpen(false);
    form.reset();
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
  };
};
