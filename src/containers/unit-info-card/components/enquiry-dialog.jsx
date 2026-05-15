import React from "react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import { getLocalizedString, extractDigit } from "@/utils/helper";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useEnquiryForm } from "../use-enquiry-form";

/**
 * EnquiryDialog - UI component for the property enquiry form.
 * Following SOP: Pure UI building block.
 */
const EnquiryDialog = ({
  isEnquiryOpen,
  setEnquiryOpen,
  unit,
  selectedBuilding,
  t,
  lang,
}) => {
  const { form, onSubmit, fields } = useEnquiryForm({
    unit,
    selectedBuilding,
    setEnquiryOpen,
  });

  return (
    <Dialog
      open={isEnquiryOpen}
      onOpenChange={(open) => {
        setEnquiryOpen(open);
        if (!open) form.reset();
      }}
    >
      <DialogContent className="bg-card-bg/90 backdrop-blur-2xl border-white/10 text-white rounded-[2rem] max-w-sm ring-1 ring-white/10 shadow-2xl p-6">
        <div className="flex items-center justify-start mb-2 pr-10">
          <img
            src={logo}
            alt="88 Residences"
            className="h-7 w-auto object-contain"
          />
        </div>
        <DialogHeader className="text-start flex flex-col gap-3">
          <DialogTitle className="text-[17px] font-medium text-white/90 leading-relaxed">
            {t(
              "enquiry_greeting",
              "Please get back to me regarding this apartment:",
            )}
          </DialogTitle>
          <div className="text-accent-yellow font-bold text-[14px] tracking-wide uppercase">
            {`${t("apt")} ${unit?.apartment_number} | ${selectedBuilding?.name} | ${getLocalizedString(unit?.property_direction?.name, lang) || "Front"} | ${extractDigit(unit?.bedrooms?.slug) || "1"} ${t("bedrooms")}`}
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            {fields.map((config) => (
              <FormField
                key={config.name}
                control={form.control}
                name={config.name}
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[11px] text-white/60 uppercase ml-1">
                      {config.label}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={config.placeholder}
                        type={config.type || "text"}
                        {...field}
                        className="h-11 text-[14px] bg-white/5 border-white/10"
                      />
                    </FormControl>
                    <FormMessage className="text-[11px] text-red-400" />
                  </FormItem>
                )}
              />
            ))}

            <Button
              type="submit"
              variant="brand"
              className="w-full font-bold h-11 rounded-lg text-[14px] transition-colors mt-4"
            >
              {t("submit")}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EnquiryDialog;
