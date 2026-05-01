import { FLAG_SVG } from "@/assets/svg/flags";

export const RTL_LANGS = ["he"];

export const LANGUAGES = [
  { code: "en", label: "English", dir: "ltr", flag: FLAG_SVG.en },
  { code: "he", label: "עברית", dir: "rtl", flag: FLAG_SVG.he },
];

export const SUPPORTED_LANGS = ["en", "he"];
export const DEFAULT_NS = "translation";
export const NAMESPACES = ["translation", "common"];
