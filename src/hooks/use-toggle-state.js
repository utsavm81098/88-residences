import { useState, useCallback } from "react";

/**
 * Custom hook to manage a boolean toggle state.
 * Supports both array and object destructuring.
 * 
 * @example
 * const [isOpen, open, close, toggle] = useToggleState(false);
 * or
 * const { state, open, close, toggle } = useToggleState(false);
 */
const useToggleState = (initialState = false) => {
  const [state, setState] = useState(initialState);

  const close = useCallback(() => {
    setState(false);
  }, []);

  const open = useCallback(() => {
    setState(true);
  }, []);

  const toggle = useCallback(() => {
    setState((s) => !s);
  }, []);

  const hookData = [state, open, close, toggle];
  hookData.state = state;
  hookData.open = open;
  hookData.close = close;
  hookData.toggle = toggle;
  
  // Adding set for compatibility with components expecting a setter function
  hookData.set = setState;
  
  return hookData;
};

export default useToggleState;
