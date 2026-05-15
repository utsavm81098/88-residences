import { useTranslation } from "react-i18next";

/**
 * Simplified translation hook.
 *
 * - Without arguments → uses the default namespace (`translation`)
 * - With a namespace   → scopes `t()` keys to that namespace
 */
const useT = (ns) => {
  const { t } = useTranslation(ns);
  return t;
};

export default useT;
