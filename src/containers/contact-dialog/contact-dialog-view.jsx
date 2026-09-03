import React, { memo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import logo from "@/assets/logo.png";
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
 * ContactDialogView - Pure UI component for the general contact form.
 * Following SOP Three-Layer Architecture: pure presentational component receiving data via props.
 */
export const ContactDialogView = memo(function ContactDialogView({
  isContactOpen,
  setContactOpen,
  t,
  dir,
  form,
  onSubmit,
  fields,
  isSubmitting,
}) {
  return (
    <Dialog
      open={isContactOpen}
      onOpenChange={(open) => {
        setContactOpen(open);
        if (!open) form.reset();
      }}
    >
      <DialogContent
        dir={dir}
        className="!bg-white backdrop-blur-2xl border border-gray-200 !text-gray-900 rounded-3xl sm:rounded-4xl w-[92vw] max-w-[400px] sm:max-w-md ring-0 shadow-2xl p-5 sm:p-7 overflow-y-auto max-h-[95vh] custom-scrollbar [&>button]:!bg-gray-100 [&>button]:hover:!bg-gray-200 [&>button]:!text-gray-700 [&>button]:hover:!text-gray-900"
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

        <DialogHeader className="text-start flex flex-col gap-1 sm:gap-2">
          <DialogTitle className="text-accent-yellow font-bold text-[14px] sm:text-[16px] tracking-wide leading-tight">
            {t("contact", "Contact Us")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("contact", "Contact Us")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-3 sm:space-y-3.5 mt-2">
            {fields.map((config) => (
              <FormField
                key={config.name}
                control={form.control}
                name={config.name}
                render={({ field }) => {
                  if (config.type === "hidden") {
                    return <Input type="hidden" {...field} />;
                  }

                  if (config.type === "textarea") {
                    return (
                      <FormItem className="space-y-1 sm:space-y-1.5">
                        <FormLabel className="text-[11px] text-gray-800 font-semibold uppercase ms-1">
                          {config.label}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={config.placeholder}
                            {...field}
                            dir={dir}
                            className={cn(
                              "min-h-[75px] sm:min-h-[85px] text-[13px] sm:text-[14px] bg-gray-50/80 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-accent-yellow/60 transition-colors resize-y",
                              dir === "rtl" ? "text-right" : "text-left",
                            )}
                          />
                        </FormControl>
                        <FormMessage className="text-[11px] text-red-500" />
                      </FormItem>
                    );
                  }

                  return (
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
                  );
                }}
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
                t("submit", "Submit")
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
});

export default ContactDialogView;
