import { memo } from "react";
import { useParentBridge } from "./use-parent-bridge";

/**
 * ParentBridge — Invisible bridge component communicating route/view state to the parent window/WordPress iframe.
 * Wrapped in React.memo to guarantee zero re-render overhead when parent components re-render.
 */
const ParentBridge = memo(function ParentBridge() {
  useParentBridge();
  return null;
});

export default ParentBridge;
