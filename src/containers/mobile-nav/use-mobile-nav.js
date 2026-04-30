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

  // Nav is active on inventory page (root path) or home
  const isInventoryPage =
    location.pathname === `/${i18n.language}` ||
    location.pathname === `/${i18n.language}/` ||
    location.pathname === `/${i18n.language}/${WEB_ROUTES.landing.path}`;

  // Sync Redux state with route
  useEffect(() => {
    const targetPanel = isInventoryPage ? "inventory" : activePanel || "home";
    if (activePanel !== targetPanel) {
      dispatch(setActivePanel(targetPanel));
    }
  }, [isInventoryPage, activePanel, dispatch]);

  const onNavItemClick = useCallback(
    (id) => {
      dispatch(setActivePanel(id));
      if (id === "home") {
        navigate(`/${i18n.language}/${WEB_ROUTES.home.path}`);
      } else if (id === "inventory") {
        navigate(`/${i18n.language}/${WEB_ROUTES.landing.path}`);
      } else if (id === "more") {
        openMore();
      }
    },
    [dispatch, navigate, i18n.language],
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

  const currentActiveId = isInventoryPage ? "inventory" : activePanel || "home";

  return {
    activeNavItem: currentActiveId,
    onNavItemClick,
    isMoreOpen,
    setIsMoreOpen,
    languages: LANGUAGES,
    activeLanguage: i18n.language,
    onLanguageChange,
    navItems: NAV_ITEMS,
  };
}
