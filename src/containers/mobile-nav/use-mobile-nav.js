import { useState, useCallback, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { setActivePanel } from "@/store/slices/sidebar-slice";
import { WEB_ROUTES } from "@/routes/routes";
import { LANGUAGES } from "@/utils/languages";
import { logger } from "@/utils/logger";
import { NAV_ITEMS } from "@/utils/constant";
import useToggleState from "@/hooks/use-toggle-state";

export function useMobileNav() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n, t } = useTranslation();

  const activePanel = useSelector((state) => state.sidebar.activePanel);
  const {
    state: isMoreOpen,
    open: openMore,
    close: closeMore,
    set: setIsMoreOpen,
  } = useToggleState(false);

  // Nav is active on inventory page
  const normalizedPath = location.pathname.replace(/\/$/, "") || "/";
  const isInventoryPage = normalizedPath.endsWith("/inventory");

  // Sync Redux state with route
  useEffect(() => {
    if (isInventoryPage) {
      if (activePanel !== "inventory") {
        dispatch(setActivePanel("inventory"));
      }
    } else {
      if (activePanel !== null) {
        dispatch(setActivePanel(null));
      }
    }
  }, [isInventoryPage, activePanel, dispatch]);

  const onNavItemClick = useCallback(
    (id) => {
      if (id === "more") {
        openMore();
        return;
      }

      const lang = i18n.language?.split("-")[0].toLowerCase() || "en";
      const path = id === "home" ? "" : id;
      const targetPath = `/${lang}${path ? `/${path}` : ""}`;

      if (
        location.pathname !== targetPath &&
        location.pathname !== `${targetPath}/`
      ) {
        navigate(targetPath);
      }

      dispatch(setActivePanel(id === "home" ? null : id));
    },
    [dispatch, navigate, i18n.language, location.pathname, openMore],
  );

  const onLanguageChange = useCallback(
    (langCode) => {
      i18n.changeLanguage(langCode);
      const segments = location.pathname.split("/").filter(Boolean);
      if (
        segments.length > 0 &&
        LANGUAGES.some((l) => l.code === segments[0])
      ) {
        segments[0] = langCode;
        navigate(`/${segments.join("/")}`, { replace: true });
      } else {
        navigate(`/${langCode}`, { replace: true });
      }
      closeMore();
      logger.info("Language changed to:", langCode);
    },
    [i18n, location.pathname, navigate],
  );

  const currentActiveId = isInventoryPage ? "inventory" : "home";

  return {
    activeNavItem: currentActiveId,
    onNavItemClick,
    isMoreOpen,
    setIsMoreOpen,
    languages: LANGUAGES,
    activeLanguage: i18n.language?.split("-")[0].toLowerCase() || "en",
    onLanguageChange,
    navItems: NAV_ITEMS,
  };
}
