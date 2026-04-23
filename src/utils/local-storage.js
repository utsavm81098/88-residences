import { logger } from "./logger";

/**
 * Save a value to localStorage with JSON stringification.
 */
const setLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    logger.error("Error saving to localStorage:", error);
  }
};

/**
 * Retrieve and parse a value from localStorage.
 */
const getLocalStorage = (key) => {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return null;

    return JSON.parse(item);
  } catch (error) {
    logger.error("Error reading from localStorage:", error);
    return null;
  }
};

/**
 * Remove a specific item from localStorage.
 */
const removeLocalStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    logger.error("Error removing from localStorage:", error);
  }
};

/**
 * Clear all localStorage data.
 */
const clearLocalStorage = () => {
  try {
    localStorage.clear();
  } catch (error) {
    logger.error("Error clearing localStorage:", error);
  }
};

export {
  setLocalStorage,
  getLocalStorage,
  removeLocalStorage,
  clearLocalStorage,
};
