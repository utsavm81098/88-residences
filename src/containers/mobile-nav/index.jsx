import React from "react";
import { useMobileNav } from "./use-mobile-nav";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { useTranslation } from "react-i18next";
import { SvgIcon } from "@/components/ui/svg-icon";
import { cn } from "@/lib/utils";
import { NAV_ITEMS_MOBILE } from "@/utils/constant";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

/**
 * MobileNavBar UI component (formerly src/components/ui/mobile-nav-bar)
 */
const MobileNavBar = ({ activeNavItem, onNavItemClick }) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between bg-sidebar px-6 py-2 shadow-2xl border-t border-white/5 pointer-events-auto w-full">
      {NAV_ITEMS_MOBILE.map((item) => {
        const isActive = activeNavItem === item.id;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            onClick={() => onNavItemClick(item.id)}
            className="relative flex flex-col items-center justify-center gap-0.5 min-w-[60px] outline-none"
          >
            <div
              className={cn(
                "transition-colors duration-300",
                isActive
                  ? "text-accent-yellow"
                  : "text-white/50 hover:text-white/80",
              )}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
            </div>

            <span
              className={cn(
                "text-[10px] font-bold tracking-tight transition-colors duration-300 uppercase",
                isActive ? "text-accent-yellow" : "text-white/40",
              )}
            >
              {t(item.label)}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default function MobileNavContainer() {
  const {
    activeNavItem,
    onNavItemClick,
    isMoreOpen,
    setIsMoreOpen,
    activeLanguage,
    onLanguageChange,
    languages,
    navItems,
  } = useMobileNav();
  const { t } = useTranslation();

  const activeLang = languages.find((l) => l.code === activeLanguage);

  return (
    <>
      <MobileNavBar
        {...{ activeNavItem, onNavItemClick }}
      />

      <Sheet open={isMoreOpen} onOpenChange={setIsMoreOpen}>
        <SheetContent
          side="bottom"
          className="h-full top-0 w-full bg-sidebar border-none p-0 rounded-none overflow-hidden flex flex-col"
        >
          <div className="flex-1 p-6 space-y-8 overflow-y-auto custom-scrollbar">
            {/* ── Navigation Grid ── */}
            <div className="grid grid-cols-3 gap-3">
              {navItems
                .filter((item) => !["home", "inventory"].includes(item.id))
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavItemClick(item.id);
                      setIsMoreOpen(false);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-3 p-4 rounded-2xl transition-all duration-300",
                      activeNavItem === item.id
                        ? "bg-accent-yellow/10 border border-accent-yellow/20 text-accent-yellow"
                        : "bg-white/5 border border-transparent text-white/60 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    <div
                      className={cn(
                        "transition-colors",
                        activeNavItem === item.id
                          ? "text-accent-yellow"
                          : "text-white/40",
                      )}
                    >
                      <item.icon size={24} strokeWidth={1.5} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-center">
                      {t(item.label)}
                    </span>
                  </button>
                ))}
            </div>

            {/* ── Language Selection ── */}
            <div className="space-y-4">
              <h3 className="text-[11px] font-bold text-white/30 uppercase tracking-[0.2em] ltr:pl-1 rtl:pr-1">
                {t("select_language", "Select Language")}
              </h3>

              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "flex items-center w-full gap-4 px-5 py-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-300 outline-none",
                    )}
                  >
                    <span className="shrink-0 flex items-center justify-center w-6 h-6">
                      <SvgIcon
                        svgdata={activeLang?.flag}
                        className="w-full h-full [&>svg]:w-full [&>svg]:h-full"
                      />
                    </span>
                    <span className="text-[14px] font-bold text-white/90 flex-1 text-start">
                      {activeLang?.label || "Language"}
                    </span>
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-yellow shadow-[0_0_8px_rgba(255,184,0,0.5)]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="bottom"
                  align="start"
                  className="w-[calc(100vw-48px)] bg-sidebar border border-white/10 text-white p-2 rounded-2xl shadow-2xl z-[3100]"
                >
                  {languages.map((lang) => (
                    <DropdownMenuItem
                      key={lang.code}
                      onClick={() => onLanguageChange?.(lang.code)}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 focus:bg-white/10 focus:text-white mb-1 last:mb-0",
                        activeLanguage === lang.code &&
                          "bg-white/5 text-accent-yellow",
                      )}
                    >
                      <span className="shrink-0 flex items-center justify-center w-6 h-6">
                        <SvgIcon
                          svgdata={lang.flag}
                          className="w-full h-full [&>svg]:w-full [&>svg]:h-full"
                        />
                      </span>
                      <span className="text-[14px] font-bold">
                        {lang.label}
                      </span>
                      {activeLanguage === lang.code && (
                        <div className="ms-auto w-1.5 h-1.5 rounded-full bg-accent-yellow shadow-[0_0_8px_rgba(255,184,0,0.5)]" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
