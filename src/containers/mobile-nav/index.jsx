import React from "react";
import { useMobileNav } from "./use-mobile-nav";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { NAV_ITEMS_MOBILE } from "@/utils/constant";

import { Link } from "react-router";
import { getDashboardRoute } from "@/utils/helper";
import logo from "@/assets/logo.png";
import { SvgIcon } from "@/components/ui/svg-icon";

/**
 * MobileNavBar UI component (formerly src/components/ui/mobile-nav-bar)
 */
const MobileNavBar = ({ activeNavItem, onNavItemClick }) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between bg-sidebar px-6 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))] border-t border-white/5 w-full opacity-100">
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
  const { t, i18n } = useTranslation();

  const targetLang =
    languages.find((l) => l.code !== activeLanguage) || languages[0];

  return (
    <>
      <MobileNavBar {...{ activeNavItem, onNavItemClick }} />

      <Sheet open={isMoreOpen} onOpenChange={setIsMoreOpen}>
        <SheetContent
          side="bottom"
          className="h-full top-0 w-full bg-sidebar border-none p-0 rounded-none overflow-hidden flex flex-col"
        >
          <div className="flex-1 p-6 space-y-4 overflow-y-auto custom-scrollbar">
            {/* ── Logo ── */}
            <div className="flex justify-start pb-2">
              <Link
                to={getDashboardRoute(i18n)}
                onClick={() => setIsMoreOpen(false)}
                className="outline-none active:scale-95 transition-transform"
              >
                <img
                  src={logo}
                  alt="88 Residences"
                  className="h-8 w-auto object-contain"
                />
              </Link>
            </div>

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

              <button
                onClick={() => onLanguageChange?.(targetLang.code)}
                className={cn(
                  "flex items-center w-full gap-4 px-5 py-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-300 outline-none",
                )}
              >
                <span className="shrink-0 flex items-center justify-center w-6 h-6">
                  <SvgIcon
                    svgdata={targetLang?.flag}
                    className="w-full h-full [&>svg]:w-full [&>svg]:h-full"
                  />
                </span>
                <span className="text-[14px] font-bold text-white/90 flex-1 text-start">
                  {targetLang?.label}
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-accent-yellow shadow-[0_0_8px_rgba(255,184,0,0.5)]" />
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
