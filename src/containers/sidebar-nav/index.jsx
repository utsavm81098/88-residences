import React from "react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SvgIcon } from "@/components/ui/svg-icon";
import { useTranslation } from "react-i18next";
import { NAV_ITEMS } from "@/utils/constant";
import { useSidebarNav } from "./use-sidebar-nav";

/**
 * NavSidebar UI component (formerly src/components/ui/nav-sidebar)
 */
const NavSidebar = ({
  isExpanded,
  onMouseEnter,
  onMouseLeave,
  onOpenChange,
  languages = [],
  activeLanguage = "en",
  onLanguageChange,
  activeNavItem,
  onNavItemClick,
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";
  const activeLang = languages.find((l) => l.code === activeLanguage);

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
      {/* ── Navigation Items ── */}
      <nav className="flex-1 px-2 py-8 space-y-4 overflow-y-auto custom-scrollbar overflow-x-hidden">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavItemClick?.(item.id)}
            className={cn(
              "w-full flex items-center rounded-lg transition-all duration-300 group relative h-11",
              isExpanded ? "gap-4 px-3" : "justify-center",
              activeNavItem === item.id
                ? "text-accent-yellow"
                : "text-white/40 hover:bg-white/5 hover:text-white",
            )}
          >
            {/* Icon Wrapper */}
            <div
              className={cn(
                "w-8 h-8 flex items-center justify-center shrink-0 transition-colors",
                activeNavItem === item.id
                  ? "text-accent-yellow"
                  : "text-white/40 group-hover:text-white",
              )}
            >
              {item.icon && (
                <item.icon
                  size={22}
                  strokeWidth={activeNavItem === item.id ? 2.5 : 1.5}
                />
              )}
            </div>

            {/* Label */}
            <span
              className={cn(
                "text-[13px] font-bold tracking-wide transition-all duration-500 whitespace-nowrap overflow-hidden text-start",
                isExpanded ? "opacity-100 max-w-[200px]" : "opacity-0 max-w-0",
              )}
            >
              {t(item.label)}
            </span>
          </button>
        ))}
      </nav>

      {/* ── Bottom Section (Lang + Chat) ── */}
      <div
        className={cn(
          "border-t border-white/5 space-y-4 mb-6 shrink-0",
          isExpanded ? "p-3" : "p-0 py-4",
        )}
      >
        {/* Language Switcher */}
        <DropdownMenu onOpenChange={onOpenChange} modal={false}>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex items-center transition-all duration-300 group/lang h-11 outline-none",
                isExpanded
                  ? "w-full gap-4 px-3 rounded-lg bg-white/5 hover:bg-white/10"
                  : "w-11 justify-center rounded-full hover:bg-white/5",
              )}
            >
              <span className="shrink-0 flex items-center justify-center w-[18px] h-[18px]">
                <SvgIcon
                  svgdata={activeLang?.flag}
                  className="w-full h-full [&>svg]:w-full [&>svg]:h-full"
                />
              </span>
              <span
                className={cn(
                  "text-[11px] font-bold transition-all duration-500 whitespace-nowrap overflow-hidden text-start text-white/90",
                  isExpanded
                    ? "opacity-100 max-w-[150px]"
                    : "opacity-0 max-w-0",
                )}
              >
                {activeLang?.label || "Language"}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side={isExpanded ? "bottom" : isRTL ? "left" : "right"}
            align={isExpanded ? (isRTL ? "end" : "start") : "end"}
            className="w-48 border-white/10 text-white"
          >
            {languages.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => onLanguageChange?.(lang.code)}
                className={cn(
                  "flex items-center gap-3 cursor-pointer focus:bg-white/10 focus:text-white",
                  activeLanguage === lang.code &&
                    "bg-white/10 text-accent-yellow",
                )}
              >
                <span className="shrink-0 flex items-center justify-center w-[18px] h-[18px]">
                  <SvgIcon
                    svgdata={lang.flag}
                    className="w-full h-full [&>svg]:w-full [&>svg]:h-full"
                  />
                </span>
                <span className="text-[13px] font-medium">{lang.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
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
        onOpenChange,
        activeNavItem,
        onNavItemClick,
        languages,
        activeLanguage,
        onLanguageChange,
      }}
    />
  );
}
