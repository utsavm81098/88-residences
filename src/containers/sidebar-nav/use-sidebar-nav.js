import { useState, useCallback, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { setActivePanel } from "@/store/slices/sidebar-slice";
import useToggleState from "@/hooks/use-toggle-state";
import { logger } from "@/utils/logger";
import { LANGUAGES } from "@/utils/languages";
import { WEB_ROUTES } from "@/routes/routes";

export function useSidebarNav() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n, t } = useTranslation();

  const activePanel = useSelector((state) => state.sidebar.activePanel);
  const [isHovered, setIsHovered] = useState(false);
  const {
    state: isMenuOpen,
    set: setIsMenuOpen,
    open,
    close,
  } = useToggleState(false);

  // Sequential transition: Menu closes first, then sidebar collapses
  const onOpenChange = useCallback((open) => {
    if (open) {
      setIsMenuOpen(true);
    } else {
      // Small delay to let the dropdown menu closing animation finish
      // before the sidebar starts its collapse transition
      setTimeout(() => {
        setIsMenuOpen(false);
      }, 150);
    }
  }, []);

  // Nav is collapsible only on the inventory page
  const normalizedPath = location.pathname.replace(/\/$/, "") || "/";
  const langPath = `/${i18n.language}`;
  const isInventoryPage = normalizedPath.endsWith("/inventory");
  const isCollapsible = isInventoryPage;

  // Sync Redux state with route - Automatically open inventory panel on inventory page
  useEffect(() => {
    if (isInventoryPage) {
      if (activePanel !== "inventory") {
        dispatch(setActivePanel("inventory"));
      }
    } else {
      // Close panels when returning to home page
      if (activePanel !== null) {
        dispatch(setActivePanel(null));
      }
    }
  }, [isInventoryPage, activePanel, dispatch]);

  const onMouseEnter = useCallback(() => {
    if (isCollapsible) {
      setIsHovered(true);
    }
  }, [isCollapsible]);

  const onMouseLeave = useCallback(() => {
    if (isCollapsible) {
      setIsHovered(false);
    }
  }, [isCollapsible]);

  const onNavItemClick = useCallback(
    (id) => {
      const lang = i18n.language?.split("-")[0].toLowerCase() || "en";
      // "home" -> "/en", "inventory" -> "/en/inventory"
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
    [navigate, dispatch, i18n.language, location.pathname],
  );

  const currentActiveId = isInventoryPage ? "inventory" : "home";

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
      setIsHovered(false);
      setIsMenuOpen(false);
      logger.info("Language changed to:", langCode);
    },
    [i18n, location.pathname, navigate],
  );

  return {
    isExpanded: !isCollapsible || isHovered || isMenuOpen,
    onMouseEnter,
    onMouseLeave,
    onOpenChange,
    activeNavItem: currentActiveId,
    onNavItemClick,
    languages: LANGUAGES,
    activeLanguage: i18n.language?.split("-")[0].toLowerCase() || "en",
    onLanguageChange,
  };
}
