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
    dir,
  } = useHome();

  return (
    <div
      dir={dir}
      className="relative h-full w-full flex-1 overflow-hidden pointer-events-none select-none"
    >
      {/* Top Start: 88 Residences Brand Pill with Home Icon & Website Redirection */}
      <HomeBrandPill
        redirectUrl={redirectUrl}
        onClick={handleRedirect}
        dir={dir}
      />

      {/* Bottom End: Floating Email Contact Button */}
      {active && (
        <FloatingContactButton
          onClick={handleOpenContact}
          dir={dir}
        />
      )}

      {/* Contact Enquiry Dialog Modal */}
      <ContactDialogContainer
        isContactOpen={isContactOpen}
        setContactOpen={setContactOpen}
      />
    </div>
  );
});

export default HomeContainer;
