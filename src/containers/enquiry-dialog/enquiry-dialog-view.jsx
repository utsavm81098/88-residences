import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import logo from "@/assets/logo.png";
import { getLocalizedString } from "@/utils/helper";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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

/**
 * EnquiryDialogView - Pure UI component for the property enquiry form.
 * Following SOP: Pure presentational component that receives all data via props.
 */
const EnquiryDialogView = ({
  isEnquiryOpen,
  setEnquiryOpen,
  unit,
  selectedBuilding,
  t,
  lang,
  dir,
  form,
  onSubmit,
  fields,
  isSubmitting,
}) => {
  return (
    <Dialog
      open={isEnquiryOpen}
      onOpenChange={(open) => {
        setEnquiryOpen(open);
        if (!open) form.reset();
      }}
    >
      <DialogContent
        dir={dir}
        className="!bg-white backdrop-blur-2xl border border-gray-200 !text-gray-900 rounded-3xl sm:rounded-4xl w-[92vw] max-w-[400px] sm:max-w-md ring-0 shadow-2xl p-5 sm:p-8 overflow-y-auto max-h-[95vh] sm:max-h-none custom-scrollbar [&>button]:!bg-gray-100 [&>button]:hover:!bg-gray-200 [&>button]:!text-gray-700 [&>button]:hover:!text-gray-900"
      >
        <div className="flex items-center justify-start mb-2 pe-10">
          <img
            src={logo}
            alt="88 Residences"
            className="h-6 sm:h-7 w-auto object-contain"
            loading="eager"
            fetchPriority="high"
          />
        </div>
        <DialogHeader className="text-start flex flex-col gap-2 sm:gap-3">
          <DialogTitle className="text-[15px] sm:text-[17px] font-semibold text-gray-900 leading-relaxed">
            {t(
              "enquiry_greeting",
              "Please get back to me regarding this apartment:",
            )}
          </DialogTitle>
          <DialogDescription className="text-accent-yellow font-bold text-[13px] sm:text-[14px] tracking-wide leading-tight">
            {`${t("apartment")} ${unit?.apartment_number} | ${t("building")} ${selectedBuilding?.name} | ${getLocalizedString(unit?.property_direction?.name, lang)} | ${getLocalizedString(unit?.bedrooms?.name, lang)}`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-3 sm:space-y-4">
            {fields.map((config) => (
              <FormField
                key={config.name}
                control={form.control}
                name={config.name}
                render={({ field }) =>
                  config.type === "hidden" ? (
                    <Input type="hidden" {...field} />
                  ) : (
                    <FormItem className="space-y-1 sm:space-y-1.5">
                      <FormLabel className="text-[11px] text-gray-800 font-semibold uppercase ms-1">
                        {config.label}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={config.placeholder}
                          type={config.type || "text"}
                          {...field}
                          dir={config.dir || dir}
                          className={cn(
                            "h-9 sm:h-11 text-[13px] sm:text-[14px] bg-gray-50/80 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-accent-yellow/60 transition-colors",
                            dir === "rtl" ? "text-right" : "text-left",
                          )}
                        />
                      </FormControl>
                      <FormMessage className="text-[11px] text-red-500" />
                    </FormItem>
                  )
                }
              />
            ))}

            <Button
              type="submit"
              variant="brand"
              disabled={isSubmitting}
              className="w-full font-bold h-9 sm:h-11 rounded-lg text-[13px] sm:text-[14px] transition-colors mt-3 sm:mt-4"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner />
                  {t("submitting", "loading...")}
                </span>
              ) : (
                t("submit")
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EnquiryDialogView;
