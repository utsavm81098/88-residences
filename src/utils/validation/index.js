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
    // Optional tracking fields
    utm_source: z.string().optional(),
    utm_medium: z.string().optional(),
    utm_campaign: z.string().optional(),
    facebookfbc: z.string().optional(),
    facebookfbp: z.string().optional(),
    facebookUserID: z.string().optional(),
    fullPageUrl: z.string().optional(),
    userAgent: z.string().optional(),
    userIP: z.string().optional(),
    sid: z.string().optional(),
    cid: z.string().optional(),
  });
