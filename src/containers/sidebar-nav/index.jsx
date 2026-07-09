import React from "react";
import { cn } from "@/lib/utils";
import { SvgIcon } from "@/components/ui/svg-icon";
import { useTranslation } from "react-i18next";
import { NAV_ITEMS } from "@/utils/constant";
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
        "absolute top-0 bottom-0 bg-background z-[100] flex flex-col transition-all duration-300 ease-in-out overflow-hidden",
        "start-0 border-e border-white/10",
        isExpanded ? "w-[225px]" : "w-[55px]",
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* ── Logo ── */}
      <div
        className={cn(
          "flex items-center shrink-0 transition-all duration-300 pt-6 pb-4",
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
      <nav className="flex-1 px-2 py-2 space-y-4 overflow-y-auto custom-scrollbar overflow-x-hidden">
        {NAV_ITEMS.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            onClick={() => onNavItemClick?.(item.id)}
            className={cn(
              "w-full flex items-center rounded-lg transition-all duration-300 group relative h-11 justify-start",
              !isExpanded && "justify-center px-0",
              isExpanded && "px-3 gap-4",
              activeNavItem === item.id
                ? "text-accent-yellow bg-white/5"
                : "text-white/40 hover:bg-white/5 hover:text-white",
            )}
          >
            {/* Icon Wrapper */}
            <div
              className={cn(
                "flex items-center justify-center shrink-0 transition-colors",
                isExpanded ? "w-5 h-5" : "w-8 h-8",
                activeNavItem === item.id
                  ? "text-accent-yellow"
                  : "text-white/40 group-hover:text-white",
              )}
            >
              {item.icon && (
                <item.icon
                  size={isExpanded ? 20 : 22}
                  strokeWidth={activeNavItem === item.id ? 2.5 : 1.5}
                />
              )}
            </div>

            {/* Label */}
            {isExpanded && (
              <span
                className={cn(
                  "text-[13px] font-bold tracking-wide transition-all duration-500 whitespace-nowrap overflow-hidden text-start",
                )}
              >
                {t(item.label)}
              </span>
            )}
          </Button>
        ))}
      </nav>

      {/* ── Bottom Section (Lang + Chat) ── */}
      <div
        className={cn(
          "flex justify-center border-t border-white/5 space-y-4 mb-6 shrink-0",
          isExpanded ? "p-3" : "p-0 py-4",
        )}
      >
        {/* Language Switcher */}
        <Button
          variant="ghost"
          onClick={() => onLanguageChange?.(targetLang.code)}
          className={cn(
            "flex items-center transition-all duration-300 group/lang h-11 outline-none justify-start",
            isExpanded
              ? "w-full gap-4 px-3 bg-white/5 hover:bg-white/10 rounded-lg"
              : "w-11 justify-center rounded-full hover:bg-white/5 p-0",
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
                "text-[11px] font-bold transition-all duration-500 whitespace-nowrap overflow-hidden text-start text-white/90",
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
