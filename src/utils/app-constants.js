import { format, isValid } from "date-fns";

export const APP_TITLE = "88 Residence – Building Your Dreams";
export const APP_FAVICON_URL = "/favicon-32x32.png";
export const LOCAL_STORAGE_KEY = "88-residences-auth";
export const CACHED_URL_LOCAL_STORAGE_KEY = "cached-redirect-url";

export const USER_ROLES = {
  ADMIN: "admin",
  USER: "user",
  MANAGER: "manager",
};

export const METHODS = {
  POST: "post",
  GET: "get",
  DELETE: "delete",
  PUT: "put",
  PATCH: "patch",
  HEAD: "head",
  OPTIONS: "options",
};

export const DEFAULT_STALE_TIME = 1000 * 60 * 5;

export const IP_CHECK_URL = "https://checkip.amazonaws.com";

export const AUTH_MESSAGES = {
  loginSuccess: "Login successful.",
  invalidLogin: "Invalid email or password.",
  forgotPassword: "Password reset link has been sent to your email.",
  resetPassword: "Your password has been reset successfully.",
  createPassword: "Your password has been created successfully.",
  logout: "You have been logged out.",
  sessionExpired: "Your session has expired. Please log in again.",
  emailVerificationSent: "Verification email sent. Please check your inbox.",
  verificationLinkExpired: "The verification link has expired.",
};

export const ERROR_MESSAGES = {
  400: "Invalid request. Please try again.",
  401: "You must be logged in to continue.",
  403: "You do not have permission to perform this action.",
  404: "The requested resource was not found.",
  408: "The request timed out. Please try again.",
  422: "Invalid input. Please check your details.",
  500: "Something went wrong on our end. Please try again later.",
  502: "Server connection issue. Please try again later.",
  503: "Service is temporarily unavailable. Please try again later.",
  504: "Server response took too long. Please try again.",
  network: "Network error. Please check your connection.",
  common: "Something went wrong. Please try again.",
};

const capitalize = (value) => {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export const VALIDATION_MESSAGES = {
  required: (field) => `${capitalize(field)} is required.`,
  minLength: (field, length) =>
    `${capitalize(field)} must be at least ${length} characters.`,
  maxLength: (field, length) =>
    `${capitalize(field)} must be at most ${length} characters.`,
  invalid: (field) => `${capitalize(field)} is invalid.`,
  passwordUppercase: "Password must contain at least one uppercase letter.",
  passwordLowercase: "Password must contain at least one lowercase letter.",
  passwordNumber: "Password must contain at least one number.",
  passwordSpecialChar: "Password must contain at least one special character.",
  passwordsDoNotMatch: "Passwords do not match.",
};

export const PLACEHOLDER_MESSAGES = {
  default: (field) => `Enter ${field}`,
  select: (field) => `Select ${field}`,
  filter: (field) => `Filter by ${field}`,
  search: "Search…",
};

export const DATE_FORMAT = {
  date: (date) => {
    if (!date) return "-";
    const parsed = new Date(date);
    if (!isValid(parsed)) return "-";
    return format(parsed, "dd/MM/yyyy");
  },
  dateTime: (date) => {
    if (!date) return "-";
    const parsed = new Date(date);
    if (!isValid(parsed)) return "-";
    return format(parsed, "dd/MM/yyyy, h:mm a");
  },
};
