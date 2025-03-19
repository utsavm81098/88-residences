import { createContext, useContext, useRef } from "react";
import PropTypes from "prop-types";

// Create the context
const ControlsContext = createContext(null);

export const useControls = () => useContext(ControlsContext);

// Create the provider component
export const ControlsProvider = ({ children }) => {
  const controlsRef = useRef(null);

  return (
    <ControlsContext.Provider value={controlsRef}>
      {children}
    </ControlsContext.Provider>
  );
};

// Add prop types validation
ControlsProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
