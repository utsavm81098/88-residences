import { jwtDecode } from "jwt-decode";
import { logger } from "./logger";

export const flattenUnitData = (unitDataArray) => {
  const flattened = {};
  unitDataArray.forEach((floor) => {
    floor.units.forEach((unit) => {
      if (unit.name) {
        flattened[unit.name] = unit;
      }
    });
  });
  return flattened;
};

export const capitalize = (value) => {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export const logError = (error) => {
  logger.error(error);
};

export const errorHandler = (handleTry, handleCatch, handleFinally) => {
  try {
    return handleTry();
  } catch (error) {
    logError(error);
    if (typeof handleCatch === "function") {
      return handleCatch(error);
    }
    return null;
  } finally {
    if (typeof handleFinally === "function") {
      handleFinally();
    }
  }
};

export const decodeToken = (token) => {
  if (!token) return null;
  try {
    return jwtDecode(token);
  } catch (error) {
    logError(error);
    return null;
  }
};

export const isTokenActive = (token) => {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return false;

  const now = Math.floor(Date.now() / 1000);
  return decoded.exp > now;
};

export function getLocalizedString(obj, locale, fallback = "en") {
  return obj?.[locale] || obj?.[fallback] || "";
}

export const extractDigit = (str) => {
  if (!str) return "";
  const match = str.match(/\d+/);
  return match ? match[0] : str;
};
