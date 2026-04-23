import { useState, useCallback, useMemo, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { setActivePanel } from "@/store/slices/sidebar-slice";
import { ICONS } from "@/assets/icons";
import { logger } from "@/utils/logger";
import { LANGUAGES } from "@/utils/languages";

export function useSidebarNav() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n, t } = useTranslation();

  const activePanel = useSelector((state) => state.sidebar.activePanel);
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  // Nav is collapsible only on the inventory page (root path)
  const isInventoryPage = location.pathname === `/${i18n.language}` || location.pathname === `/${i18n.language}/`;
  const isCollapsible = isInventoryPage;

  // Sync Redux state with route
  useEffect(() => {
    const targetPanel = isInventoryPage ? "inventory" : "home";
    if (activePanel !== targetPanel) {
      dispatch(setActivePanel(targetPanel));
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
      dispatch(setActivePanel(id));
      if (id === "home") {
        navigate(`/${i18n.language}/home`);
      } else if (id === "inventory") {
        navigate(`/${i18n.language}`);
      }
    },
    [dispatch, navigate, i18n.language],
  );

  const navItems = useMemo(
    () => [
      { id: "home", label: t("home"), icon: ICONS.Home },
      { id: "inventory", label: t("inventory"), icon: ICONS.Search },
    ],
    [t],
  );

  const currentActiveId = isInventoryPage ? "inventory" : "home";

  const onLanguageChange = useCallback(
    (langCode) => {
      i18n.changeLanguage(langCode);
      const segments = location.pathname.split('/').filter(Boolean);
      if (segments.length > 0 && LANGUAGES.some(l => l.code === segments[0])) {
        segments[0] = langCode;
        navigate(`/${segments.join('/')}`, { replace: true });
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
    navItems,
    activeNavItem: currentActiveId,
    onNavItemClick,
    languages: LANGUAGES,
    activeLanguage: i18n.language,
    onLanguageChange,
  };
}
