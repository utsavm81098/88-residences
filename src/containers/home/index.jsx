import React, { memo } from "react";
import useHome from "./use-home";
import HomeBrandPill from "@/components/ui/home-brand-pill";
import FloatingContactButton from "@/components/ui/floating-contact-button";
import ContactDialogContainer from "@/containers/contact-dialog";

/**
 * HomeContainer - Coordinates the 2D UI for the Home Masterplan route
 * over the single shared 3D Canvas.
 */
export const HomeContainer = memo(({ active = true }) => {
  const {
    redirectUrl,
    handleRedirect,
    isContactOpen,
    setContactOpen,
    handleOpenContact,
  } = useHome();

  return (
    <div className="relative h-full w-full flex-1 overflow-hidden pointer-events-none select-none">
      {/* Top Left: 88 Residences Brand Pill with Home Icon & Website Redirection */}
      <HomeBrandPill
        redirectUrl={redirectUrl}
        onClick={handleRedirect}
      />

      {/* Bottom Right: Floating Email Contact Button */}
      <FloatingContactButton
        onClick={handleOpenContact}
      />

      {/* Contact Enquiry Dialog Modal */}
      <ContactDialogContainer
        isContactOpen={isContactOpen}
        setContactOpen={setContactOpen}
      />
    </div>
  );
});

export default HomeContainer;
