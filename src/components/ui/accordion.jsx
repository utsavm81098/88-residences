import * as React from "react";
import { Accordion as AccordionPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "lucide-react";

function Accordion({ className, ...props }) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn("flex w-full flex-col", className)}
      {...props}
    />
  );
}

function AccordionItem({ className, ...props }) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      // No open-state background: --muted is a dark slate in this theme, so
      // bg-muted/50 renders as a heavy gray wash over the white cards.
      className={cn("[&:not(:last-child)]:border-b", className)}
      {...props}
    />
  );
}

function AccordionTrigger({ className, headerClassName, children, ...props }) {
  return (
    <AccordionPrimitive.Header className={cn("flex", headerClassName)}>
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group/accordion-trigger relative flex flex-1 items-start justify-between gap-6 border border-transparent p-4 text-start text-sm font-medium transition-all outline-none hover:underline disabled:pointer-events-none disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
        {/* Single rotating chevron. Rotation is direction-agnostic, so RTL is unaffected. */}
        <ChevronDownIcon
          data-slot="accordion-trigger-icon"
          className="pointer-events-none ms-auto size-4 shrink-0 text-muted-foreground transition-transform duration-300 ease-out group-data-[state=open]/accordion-trigger:rotate-180"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({ className, children, ...props }) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="overflow-hidden text-sm data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up"
      {...props}
    >
      {/* No fixed height here on purpose — pinning this div to
          --radix-accordion-content-height would freeze it against content reflow. */}
      <div
        className={cn(
          "pt-0 pb-4 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
          className,
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
