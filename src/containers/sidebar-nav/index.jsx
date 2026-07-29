import React from "react";
import { cn } from "@/lib/utils";
import { SvgIcon } from "@/components/ui/svg-icon";
import { useTranslation } from "react-i18next";
import { NAV_ITEMS } from "@/utils/constant";
import { ICONS } from "@/assets/icons";
import { getWebsiteRedirectUrl } from "@/utils/helper";
import { useSidebarNav } from "./use-sidebar-nav";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

/**
 * NavSidebar UI component (formerly src/components/ui/nav-sidebar)
 */
const NavSidebar = ({
  isExpanded,
  onMouseEnter,
  onMouseLeave,
  languages = [],
  activeLanguage = "en",
  onLanguageChange,
  activeNavItem,
  onNavItemClick,
}) => {
  const { t, i18n } = useTranslation();
  const targetLang =
    languages.find((l) => l.code !== activeLanguage) || languages[0];

  return (
    <aside
      className={cn(
        "absolute top-0 bottom-0 bg-white z-[100] flex flex-col transition-all duration-300 ease-in-out overflow-hidden border-e-2 border-e-gray-200",
        "start-0",
        isExpanded ? "w-[225px]" : "w-[55px]",
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* ── Logo ── */}
      <div
        className={cn(
          "flex items-center shrink-0 transition-all duration-300 pt-5 pb-4",
          isExpanded ? "px-6" : "px-0 justify-center",
        )}
      >
        <a
          href={getWebsiteRedirectUrl(i18n)}
          onClick={(e) => {
            e.preventDefault();
            window.location.href = getWebsiteRedirectUrl(i18n);
          }}
          className="flex items-center gap-3 transition-transform hover:scale-105 active:scale-95"
        >
          {isExpanded ? (
            <img
              src={logo}
              alt="88 Residences"
              className="h-8 w-auto object-contain transition-all duration-300"
              loading="eager"
              fetchPriority="high"
            />
          ) : (
            <Logo className="h-8 w-8 transition-all duration-300" />
          )}
        </a>
      </div>

      {/* ── Navigation Items ── */}
      <nav className="flex-1 px-2.5 py-4 space-y-3 overflow-y-auto custom-scrollbar overflow-x-hidden flex flex-col items-center">
        {NAV_ITEMS.map((item) => {
          const isActive =
            activeNavItem === item.id ||
            (item.id === "inventory" && activeNavItem === "inventory");

          return (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => onNavItemClick?.(item.id)}
              className={cn(
                "w-full flex items-center rounded-xl transition-all duration-200 group relative h-10 justify-start cursor-pointer outline-none",
                !isExpanded && "justify-center px-0 w-10 h-10",
                isExpanded && "px-3 gap-3.5",
                isActive
                  ? "bg-accent-yellow/10 border border-accent-yellow/40 text-accent-yellow shadow-2xs font-semibold hover:!bg-accent-yellow/20 hover:!text-accent-yellow"
                  : "text-gray-400 border border-transparent hover:!bg-accent-yellow/10 hover:!border-accent-yellow/30 hover:!text-accent-yellow",
              )}
            >
              {/* Icon Wrapper */}
              <div
                className={cn(
                  "flex items-center justify-center shrink-0 transition-colors",
                  isExpanded ? "w-5 h-5" : "w-6 h-6",
                  isActive
                    ? "text-accent-yellow"
                    : "text-gray-400 group-hover:text-accent-yellow",
                )}
              >
                {item.icon && (
                  <item.icon size={20} strokeWidth={isActive ? 2 : 1.75} />
                )}
              </div>

              {/* Label */}
              {isExpanded && (
                <span
                  className={cn(
                    "text-[14px] tracking-wide transition-all duration-300 whitespace-nowrap overflow-hidden text-start",
                    isActive
                      ? "font-bold text-gray-800"
                      : "font-medium text-gray-600 group-hover:text-gray-900",
                  )}
                >
                  {t(item.label)}
                </span>
              )}
            </Button>
          );
        })}
      </nav>

      {/* ── Bottom Section (Lang + Chat) ── */}
      <div
        className={cn(
          "flex justify-center border-t border-gray-100 space-y-4 mb-4 shrink-0",
          isExpanded ? "p-3" : "p-0 py-3",
        )}
      >
        {/* Language Switcher */}
        <Button
          variant="ghost"
          onClick={() => onLanguageChange?.(targetLang.code)}
          className={cn(
            "flex items-center transition-all duration-200 group/lang h-10 outline-none justify-start cursor-pointer",
            isExpanded
              ? "w-full gap-3 px-3 bg-gray-50 hover:!bg-gray-100 text-gray-800 rounded-xl border border-gray-100 hover:!border-gray-200"
              : "w-10 h-10 justify-center rounded-xl hover:!bg-gray-100 text-gray-800 p-0 border border-transparent hover:!border-gray-200",
          )}
        >
          <span className="shrink-0 flex items-center justify-center w-[18px] h-[18px]">
            <SvgIcon
              svgdata={targetLang?.flag}
              className="w-full h-full [&>svg]:w-full [&>svg]:h-full"
            />
          </span>
          {isExpanded && (
            <span
              className={cn(
                "text-[13px] font-semibold transition-all duration-300 whitespace-nowrap overflow-hidden text-start text-gray-800 group-hover/lang:text-gray-900",
              )}
            >
              {targetLang?.label}
            </span>
          )}
        </Button>
      </div>
    </aside>
  );
};

export default function SidebarNavContainer() {
  const {
    isExpanded,
    onMouseEnter,
    onMouseLeave,
    onOpenChange,
    activeNavItem,
    onNavItemClick,
    languages,
    activeLanguage,
    onLanguageChange,
  } = useSidebarNav();

  return (
    <NavSidebar
      {...{
        isExpanded,
        onMouseEnter,
        onMouseLeave,
        activeNavItem,
        onNavItemClick,
        languages,
        activeLanguage,
        onLanguageChange,
      }}
    />
  );
}
