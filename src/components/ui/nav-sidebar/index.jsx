import React from "react";
import { cn } from "@/lib/utils";
import { ICONS } from "@/assets/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SvgIcon } from "@/components/ui/svg-icon";

export default function NavSidebar({
  isExpanded,
  onMouseEnter,
  onMouseLeave,
  onOpenChange,
  projectName = "CYPRUS VALLEY",
  languages = [],
  activeLanguage = "en",
  onLanguageChange,
  navItems = [],
  activeNavItem,
  onNavItemClick,
  chatStatus = "online",
  onChatClick,
}) {
  const activeLang = languages.find((l) => l.code === activeLanguage);

  return (
    <aside
      className={cn(
        "absolute top-0 bottom-0 bg-background z-[100] flex flex-col transition-all duration-300 ease-in-out overflow-hidden",
        "ltr:left-0 ltr:border-r rtl:right-0 rtl:border-l border-white/10",
        isExpanded ? "w-[225px]" : "w-[55px]",
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* ── Logo Section ── */}
      {/* <div className="h-20 flex items-center justify-center pt-4 overflow-hidden shrink-0">
        <div className="w-10 h-10 bg-accent-yellow rounded-xl flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
          <ICONS.Balcony size={24} className="text-black" strokeWidth={2.5} />
        </div>
      </div> */}

      {/* ── Navigation Items ── */}
      <nav className="flex-1 px-2 py-8 space-y-4 overflow-y-auto custom-scrollbar overflow-x-hidden">
        {navItems.map((item) => (
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
              {item.label}
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
            side={isExpanded ? "bottom" : "right"}
            align={isExpanded ? "start" : "end"}
            className="w-48 border-white/10 text-white"
          >
            {languages.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => onLanguageChange?.(lang.code)}
                className={cn(
                  "flex items-center gap-3 cursor-pointer focus:bg-white/10 focus:text-white",
                  activeLanguage === lang.code && "bg-white/10 text-accent-yellow"
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

        {/* Support/Chat Button */}
        {/* <button
          onClick={onChatClick}
          className={cn(
            "flex items-center transition-all group h-11",
            isExpanded 
              ? "w-full gap-4 px-3 rounded-lg hover:bg-white/5" 
              : "w-11 justify-center rounded-full hover:bg-white/5 self-center"
          )}
        >
          <div className="relative shrink-0 flex items-center justify-center">
            <ICONS.MessageCircle size={22} className={cn(
              "transition-colors",
              isExpanded ? "text-white/40 group-hover:text-white" : "text-white/60"
            )} />
            {chatStatus === "online" && (
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
            )}
          </div>
          <span
            className={cn(
              "text-[11px] font-bold text-white/40 group-hover:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-start",
              isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
            )}
          >
            SUPPORT
          </span>
        </button> */}
      </div>
    </aside>
  );
}
