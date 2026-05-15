/**
 * Regular expression patterns for form validation.
 */

// Phone number regex: supports +, spaces, and digits (min 6 digits)
export const PHONE_REGEX = /^[+0-9\s]{6,}$/;

// Email regex is handled by Zod's .email(), but if we need a custom one:
export const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
