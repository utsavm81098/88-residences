import { useState } from 'react';
import { errorHandler } from '@/utils/helper';

/**
 * Custom hook to persist state in localStorage.
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    return errorHandler(
      () => {
        if (typeof window === 'undefined') return initialValue;
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
      },
      () => initialValue,
    );
  });

  const setValue = (value) => {
    errorHandler(() => {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    });
  };

  const removeValue = () => {
    errorHandler(() => {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
      setStoredValue(initialValue);
    });
  };

  return { storedValue, setValue, removeValue };
}
