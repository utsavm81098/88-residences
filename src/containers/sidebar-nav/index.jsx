import React from "react";
import NavSidebar from "@/components/ui/nav-sidebar";
import { useSidebarNav } from "./use-sidebar-nav";

export default function SidebarNavContainer() {
  const {
    isExpanded,
    onMouseEnter,
    onMouseLeave,
    onOpenChange,
    navItems,
    activeNavItem,
    onNavItemClick,
    languages,
    activeLanguage,
    onLanguageChange,
  } = useSidebarNav();

  return (
    <NavSidebar
      isExpanded={isExpanded}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onOpenChange={onOpenChange}
      navItems={navItems}
      activeNavItem={activeNavItem}
      onNavItemClick={onNavItemClick}
      languages={languages}
      activeLanguage={activeLanguage}
      onLanguageChange={onLanguageChange}
    />
  );
}

