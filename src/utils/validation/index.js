import { z } from "zod";
import { PHONE_REGEX } from "./regex";

/**
 * Returns the Zod validation schema for the enquiry form.
 * @param {Function} t - i18next translation function.
 */
export const getEnquirySchema = (t) =>
  z.object({
    firstName: z.string().min(1, t("validation_required")),
    lastName: z.string().min(1, t("validation_required")),
    email: z.string().email(t("validation_email")),
    phone: z.string().regex(PHONE_REGEX, t("validation_phone")),
  });
