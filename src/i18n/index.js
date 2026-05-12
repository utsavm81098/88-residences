import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";
import {
  DEFAULT_NS,
  NAMESPACES,
  RTL_LANGS,
  SUPPORTED_LANGS,
} from "@/utils/languages";

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
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    supportedLngs: [...SUPPORTED_LANGS],
    fallbackLng: "en",
    load: "languageOnly", // 'en-US' → 'en', prevents region mismatches
    nonExplicitSupportedLngs: true,
    lowerCaseLng: true,
    defaultNS: DEFAULT_NS,
    ns: [...NAMESPACES],
    debug: import.meta.env.DEV,
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      lookupLocalStorage: "i18nextLng",
      caches: ["localStorage"],
    },
    backend: {
      loadPath: `${
        import.meta.env.BASE_URL.endsWith("/")
          ? import.meta.env.BASE_URL.slice(0, -1)
          : import.meta.env.BASE_URL
      }/locales/{{lng}}/{{ns}}.json`,
    },
    react: {
      useSuspense: false, // We await init before rendering — no Suspense needed
    },
  });

export { initPromise, getDirection, SUPPORTED_LANGS, NAMESPACES, DEFAULT_NS };
export default i18n;
