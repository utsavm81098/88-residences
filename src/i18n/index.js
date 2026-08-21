import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import {
  DEFAULT_NS,
  NAMESPACES,
  RTL_LANGS,
  SUPPORTED_LANGS,
} from "@/utils/languages";

import enTranslation from "../../public/locales/en/translation.json";
import enCommon from "../../public/locales/en/common.json";
import heTranslation from "../../public/locales/he/translation.json";
import heCommon from "../../public/locales/he/common.json";

const resources = {
  en: {
    translation: enTranslation,
    common: enCommon,
  },
  he: {
    translation: heTranslation,
    common: heCommon,
  },
};

/**
 * Determine text direction from a language code.
 */
function getDirection(lang) {
  return RTL_LANGS.includes(lang) ? "rtl" : "ltr";
}

/**
 * Sync `dir` and `lang` attributes on <html> whenever the language changes.
 * Fires during init (for the detected/fallback language) and on every
 * subsequent `i18n.changeLanguage()` call.
 */
function syncDocumentDirection(lang) {
  const dir = getDirection(lang);
  document.documentElement.setAttribute("dir", dir);
  document.documentElement.setAttribute("lang", lang);
}

i18n.on("languageChanged", syncDocumentDirection);

const initPromise = i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: [...SUPPORTED_LANGS],
    fallbackLng: "en",
    load: "languageOnly", // 'en-US' → 'en', prevents region mismatches
    nonExplicitSupportedLngs: true,
    lowerCaseLng: true,
    defaultNS: DEFAULT_NS,
    ns: [...NAMESPACES],
    debug: false,
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      lookupLocalStorage: "i18nextLng",
      caches: ["localStorage"],
    },
    react: {
      useSuspense: false,
    },
  });

export { initPromise, getDirection, SUPPORTED_LANGS, NAMESPACES, DEFAULT_NS };
export default i18n;
