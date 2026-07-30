import { useState, useCallback, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { setActivePanel } from "@/store/slices/sidebar-slice";
import { logger } from "@/utils/logger";
import { LANGUAGES } from "@/utils/languages";
import { getDashboardRoute, getLanguageSwitchPath, getWebsiteRedirectUrl } from "@/utils/helper";

export function useSidebarNav() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n, t } = useTranslation();

  const activePanel = useSelector((state) => state.sidebar.activePanel);
  const [isHovered, setIsHovered] = useState(false);
  const normalizedPath = location.pathname.replace(/\/$/, "") || "/";
  const langPath = `/${i18n.language}`;
  const isInventoryPage = normalizedPath.endsWith("/inventory");

  // Home: never collapses, always w-[225px].
  // Inventory: w-[55px], expands to w-[225px] on hover, collapses on leave.
  //
  // The aside is position:absolute (sidebar-nav/index.jsx:31), so it does NOT
  // reserve its own space — main-layout must reserve a matching width per route
  // or the rail paints over the page. See SIDEBAR_WIDTH in utils/constant.js.
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
      if (id === "home") {
        window.location.href = getWebsiteRedirectUrl(i18n);
        return;
      }
      const targetPath = getDashboardRoute(i18n, id);

      if (
        location.pathname !== targetPath &&
        location.pathname !== `${targetPath}/`
      ) {
        navigate(targetPath);
      }

      dispatch(setActivePanel(id === "home" ? null : id));
    },
    [navigate, dispatch, i18n, location.pathname],
  );

  const currentActiveId = isInventoryPage ? "inventory" : "home";

  const onLanguageChange = useCallback(
    (langCode) => {
      i18n.changeLanguage(langCode);
      const targetPath = getLanguageSwitchPath(location.pathname, langCode);
      navigate(`${targetPath}${location.search}${location.hash}`, {
        replace: true,
      });

      setIsHovered(false);
      logger.info("Language changed to:", langCode);
    },
    [i18n, location.pathname, location.search, location.hash, navigate],
  );

  return {
    isExpanded: !isCollapsible || isHovered,
    onMouseEnter,
    onMouseLeave,
    activeNavItem: currentActiveId,
    onNavItemClick,
    languages: LANGUAGES,
    activeLanguage: i18n.language?.split("-")[0].toLowerCase() || "en",
    onLanguageChange,
  };
}
