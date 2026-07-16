import { jwtDecode } from "jwt-decode";
import { logger } from "./logger";
import { DASHBOARD_PREFIX, WEBSITE_URL } from "./constant";
import { SUPPORTED_LANGS } from "./languages";

export const getWebsiteRedirectUrl = (i18nOrLang) => {
  const langStr = typeof i18nOrLang === "string" ? i18nOrLang : i18nOrLang?.language;
  const detectedLang = langStr?.split("-")[0].toLowerCase() || "en";
  const isHebrew = detectedLang === "he" || window.location.pathname.includes("dashboard-he");
  return isHebrew ? `${WEBSITE_URL}/?lang=he` : WEBSITE_URL;
};


export const getDashboardRoute = (i18n, pathId = "") => {
  const detectedLang = i18n?.language?.split("-")[0].toLowerCase() || "en";
  const targetLang = SUPPORTED_LANGS.includes(detectedLang)
    ? detectedLang
    : "en";
  const path = pathId === "home" ? "" : pathId;
  return `/${DASHBOARD_PREFIX}-${targetLang}${path ? `/${path}` : ""}`;
};

export const getLanguageSwitchPath = (pathname, langCode) => {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0 && segments[0].startsWith(`${DASHBOARD_PREFIX}-`)) {
    segments[0] = `${DASHBOARD_PREFIX}-${langCode}`;
    return `/${segments.join("/")}`;
  }
  return `/${DASHBOARD_PREFIX}-${langCode}`;
};

export const flattenUnitData = (unitDataArray) => {
  const flattened = {};
  unitDataArray.forEach((floor) => {
    floor.units.forEach((unit) => {
      if (unit.name) {
        flattened[unit.name] = unit;
      }
    });
  });
  return flattened;
};

export const capitalize = (value) => {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export const logError = (error) => {
  logger.error(error);
};

export const errorHandler = (handleTry, handleCatch, handleFinally) => {
  try {
    return handleTry();
  } catch (error) {
    logError(error);
    if (typeof handleCatch === "function") {
      return handleCatch(error);
    }
    return null;
  } finally {
    if (typeof handleFinally === "function") {
      handleFinally();
    }
  }
};

export const decodeToken = (token) => {
  if (!token) return null;
  try {
    return jwtDecode(token);
  } catch (error) {
    logError(error);
    return null;
  }
};

export const isTokenActive = (token) => {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return false;

  const now = Math.floor(Date.now() / 1000);
  return decoded.exp > now;
};

export function getLocalizedString(obj, locale, fallback = "en") {
  return obj?.[locale] || obj?.[fallback] || "";
}

export const extractDigit = (str) => {
  if (!str) return "";
  const match = str.match(/\d+/);
  return match ? match[0] : str;
};

export const pushGtmEvent = (eventName, data = {}) => {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];

  switch (eventName) {
    case "cf7submission": {
      const { formId, formData } = data;
      const response = [];
      if (formData) {
        for (const [name, value] of formData.entries()) {
          // Ignore internal CF7 fields
          if (name.startsWith("_wpcf7")) continue;
          
          // Map 'message' to 'apartment_info' to match GTM expected format
          const keyName = name === "message" ? "apartment_info" : name;
          response.push({ name: keyName, value });
        }
      }

      window.dataLayer.push({
        event: eventName,
        formId: formId ? parseInt(formId, 10) : undefined,
        response: response,
      });
      break;
    }
    default:
      console.warn(`GTM Event '${eventName}' is not specifically handled.`);
      window.dataLayer.push({
        event: eventName,
        ...data,
      });
      break;
  }
};
