import React from "react";
import { useNavigate } from "react-router";
import { useMobileNav } from "./use-mobile-nav";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { NAV_ITEMS_MOBILE } from "@/utils/constant";
import { getDashboardRoute } from "@/utils/helper";
import logo from "@/assets/logo.png";
import { SvgIcon } from "@/components/ui/svg-icon";

/**
 * MobileNavBar UI component (formerly src/components/ui/mobile-nav-bar)
 */
const MobileNavBar = ({ activeNavItem, onNavItemClick }) => {
  const { t } = useTranslation();
  return (
    <div
      id="bottomMenu"
      className="flex items-center justify-between !bg-white px-4 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))] border-t border-gray-200 w-full opacity-100"
    >
      {NAV_ITEMS_MOBILE.map((item) => {
        const isActive = activeNavItem === item.id;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            onClick={() => onNavItemClick(item.id)}
            className={cn(
              "relative flex flex-col items-center justify-center gap-0.5 min-w-[64px] py-1 px-3 rounded-xl outline-none cursor-pointer transition-all duration-200",
              isActive
                ? "bg-accent-yellow/10 text-accent-yellow"
                : "hover:bg-gray-100 active:bg-gray-200 text-gray-800",
            )}
          >
            <div
              className={cn(
                "transition-colors duration-300 flex items-center justify-center",
                isActive ? "text-accent-yellow" : "text-gray-800",
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            </div>

            <span
              className={cn(
                "text-[10px] tracking-tight transition-colors duration-300 uppercase whitespace-nowrap",
                isActive ? "text-accent-yellow font-bold" : "text-gray-800 font-bold",
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

  const navigate = useNavigate();

  const targetLang =
    languages.find((l) => l.code !== activeLanguage) || languages[0];

  return (
    <>
      <MobileNavBar {...{ activeNavItem, onNavItemClick }} />

      <Sheet {...{ open: isMoreOpen, onOpenChange: setIsMoreOpen }}>
        <SheetContent
          {...{
            side: "bottom",
            className:
              "h-full top-0 w-full !bg-white border-none p-0 rounded-none overflow-hidden flex flex-col !text-gray-900 [&>button]:!bg-gray-100 [&>button]:hover:!bg-gray-200 [&>button]:!text-gray-700 [&>button]:hover:!text-gray-900",
          }}
        >
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SheetDescription className="sr-only">Mobile Navigation Menu</SheetDescription>
          <div className="flex-1 p-6 space-y-4 overflow-y-auto custom-scrollbar">
            {/* ── Logo ── */}
            <div className="flex justify-start pb-2">
              <a
                href={getDashboardRoute(i18n)}
                onClick={(e) => {
                  e.preventDefault();
                  setIsMoreOpen(false);
                  navigate(getDashboardRoute(i18n));
                }}
                className="outline-none active:scale-95 transition-transform cursor-pointer"
              >
                <img
                  src={logo}
                  alt="88 Residences"
                  className="h-6 w-auto object-contain"
                  loading="eager"
                  fetchPriority="high"
                />
              </a>
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
                      "flex flex-col items-center gap-3 p-4 rounded-2xl transition-all duration-300 cursor-pointer",
                      activeNavItem === item.id
                        ? "bg-accent-yellow/10 border border-accent-yellow/30 text-accent-yellow font-bold shadow-xs"
                        : "bg-gray-50 border border-gray-100 text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                    )}
                  >
                    <div
                      className={cn(
                        "transition-colors",
                        activeNavItem === item.id
                          ? "text-accent-yellow"
                          : "text-gray-400",
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
              <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em] ltr:pl-1 rtl:pr-1">
                {t("select_language", "Select Language")}
              </h3>

              <button
                onClick={() => onLanguageChange?.(targetLang.code)}
                className={cn(
                  "flex items-center w-full gap-4 px-5 py-4 rounded-2xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all duration-300 outline-none cursor-pointer",
                )}
              >
                <span className="shrink-0 flex items-center justify-center w-6 h-6">
                  <SvgIcon
                    svgdata={targetLang?.flag}
                    className="w-full h-full [&>svg]:w-full [&>svg]:h-full"
                  />
                </span>
                <span className="text-[14px] font-bold text-gray-800 flex-1 text-start">
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
