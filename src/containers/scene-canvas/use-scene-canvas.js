import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import useKeepAliveKey from "@/hooks/use-keep-alive-key";
import { useIsMobile } from "@/hooks/use-mobile";
import useSceneLoadingProgress from "@/hooks/use-scene-loading-progress";
import useHome from "@/containers/home/use-home";
import useInventory from "@/containers/inventory/use-inventory";
import { SIDEBAR_WIDTH as INVENTORY_SIDEBAR_WIDTH } from "@/features/adaptive-controls";

import { HOME_EXPOSURE } from "@/utils/constant";

// Peak veil opacity — deliberately NEVER 1 (fully solid). The whole app
// theme is dark, so any fully-opaque cover reads as "the screen went black"
// rather than a transition (reported and confirmed). Capping it here means
// the outgoing scene stays faintly visible right through the dip and the
// swap underneath is softened, not hidden behind a solid card.
export const VEIL_PEAK_OPACITY = 0.35;
// Must reach VEIL_PEAK_OPACITY BEFORE the 3D scene actually swaps beneath
// it — see the effect below for why the swap is deliberately deferred until
// this elapses. Exported so index.jsx's veil <div> can use the exact same
// value as its CSS transition-duration, rather than a second hardcoded copy
// that could silently drift out of sync with the timers actually gating the
// swap.
export const VEIL_FADE_IN_MS = 150;
// Small grace period once at peak dim, letting the swapped-in scene's own
// activation effects (camera reset, lighting) settle for a frame or two
// before the veil starts lifting — otherwise the reveal could catch the
// tail of that settling instead of the finished frame.
const VEIL_SETTLE_MS = 70;
// Cosmetic only; not on the timing-critical path like the two above.
export const VEIL_FADE_OUT_MS = 320;

/**
 * useSceneCanvas - Coordinates the single shared 3D Canvas across the entire app.
 */
export const useSceneCanvas = () => {
  const activeKey = useKeepAliveKey();
  const isMobile = useIsMobile();

  // Immediate — NOT delayed by the veil below. Drives only the Inventory
  // container hook's own activation-edge logic (?building= read, tooltip
  // teardown); the 3D canvas's own box (height/width/left, further down)
  // no longer depends on activeKey AT ALL, veiled or not — see that
  // constant's own comment for the two rounds of bugs that came from
  // letting it vary with navigation state.
  const rawIsInventory = activeKey === "inventory";

  // `displayedKey` is what actually drives the 3D scene's `active`/`visible`
  // flags below — deliberately one step behind `activeKey` (the router's
  // real, immediate value). Home and Inventory each hard-reset camera
  // position/FOV, tone mapping and lighting the instant they activate (see
  // features/scene-environment/index.jsx and features/home-scene/camera-
  // rig.jsx) — necessary so each scene always looks the same regardless of
  // where the other one left the shared camera/renderer, but visually it is
  // an instant pop with nothing to smooth it, which read as the reported
  // "jittering" cut on every navigation. Routing the swap through a brief
  // opaque veil (rendered in index.jsx) hides that pop entirely: the veil
  // fades in over the STALE frame, the swap happens once it is fully
  // opaque, then it fades out onto the settled new frame.
  const [displayedKey, setDisplayedKey] = useState(activeKey);
  const [isVeiled, setIsVeiled] = useState(false);
  const pendingTimersRef = useRef([]);
  // Tracks which activeKey this effect has already started a transition
  // for. Deliberately NOT React state and NOT `displayedKey` — see below.
  const lastHandledKeyRef = useRef(activeKey);

  useEffect(() => {
    // Initial resolution (activeKey arriving from null on first render) or
    // a route change that lands back on the key already shown — nothing to
    // transition, and the very first paint must never be delayed by a veil.
    if (!activeKey || activeKey === lastHandledKeyRef.current) return undefined;
    lastHandledKeyRef.current = activeKey;

    pendingTimersRef.current.forEach(clearTimeout);
    pendingTimersRef.current = [];

    setIsVeiled(true);

    const swapTimer = setTimeout(() => {
      setDisplayedKey(activeKey);
      const settleTimer = setTimeout(() => {
        setIsVeiled(false);
      }, VEIL_SETTLE_MS);
      pendingTimersRef.current.push(settleTimer);
    }, VEIL_FADE_IN_MS);

    pendingTimersRef.current.push(swapTimer);

    return () => {
      pendingTimersRef.current.forEach(clearTimeout);
      pendingTimersRef.current = [];
    };
    // REAL BUG FIXED HERE, confirmed by tracing it: this effect used to also
    // depend on `displayedKey` and guard on `activeKey === displayedKey`.
    // But `setDisplayedKey(activeKey)` inside swapTimer's callback above
    // changes `displayedKey` — which re-ran THIS SAME EFFECT as a dependency
    // change, and React runs a re-triggered effect's CLEANUP first. That
    // cleanup cancelled `settleTimer`, which had just been scheduled a line
    // earlier and had not fired yet — so `setIsVeiled(false)` never ran, on
    // every single navigation, on every device (deterministic, not a timing
    // race, which is exactly why it reproduced identically on desktop,
    // tablet and mobile alike). The veil faded in once and then never faded
    // back out. `lastHandledKeyRef` breaks the loop: it is a ref this effect
    // itself owns and updates synchronously at the top, so it can track
    // "have I started handling this activeKey" without ever appearing in
    // this effect's own dependency array and re-triggering itself.
  }, [activeKey]);

  const isHome = displayedKey === "home";
  const isInventory = displayedKey === "inventory";

  const home = useHome();
  const inventory = useInventory({ active: rawIsInventory });

  // REAL BUG FOUND HERE, and fully removed rather than just fixed: the
  // shared canvas's own box (height, and previously width/marginLeft for
  // the desktop sidebar) used to be dynamically sized off home/inventory's
  // canvasHeight — which shrank on mobile by `snapHeight` (the bottom
  // sheet's current open height). But features/adaptive-controls/index.jsx
  // now applies a camera.setViewOffset() shift keyed off that exact same
  // `snapHeight` (and, on desktop, off the sidebar width) to recenter the
  // 3D content within whatever region is actually visible — and both the
  // bottom sheet (containers/mobile-menu/index.jsx, `fixed ... z-[1000]`)
  // and the sidebar (containers/inventory/index.jsx) are opaque overlays
  // that cover the canvas via z-index regardless of the canvas's own size.
  // With the canvas ALSO resizing, the view-offset math ran against a
  // `size` that was already reduced by roughly the same amount it was then
  // offsetting by — a double compensation. Resizing the canvas element was
  // the leftover assumption from before the view-offset technique existed;
  // the shared canvas's own box is now permanently full-bleed (h-full
  // w-full in index.jsx's JSX directly — no style prop, nothing to compute
  // here), so there is no canvasHeight/canvasLeft/canvasWidth to return
  // from this hook any more. containers/home/use-home.js's and
  // containers/inventory/use-inventory.js's OWN canvasHeight are unrelated
  // and untouched — those size each route's 2D UI container (TopNavigation,
  // BuildingTooltip, the bottom-sheet's own layout math), not this shared
  // WebGL canvas.

  // Unified WebGL2 Renderer Configuration
  const glConfig = useMemo(
    () => ({
      antialias: true,
      powerPreference: "high-performance",
      stencil: false,
      depth: true,
      toneMapping: THREE.NeutralToneMapping,
      toneMappingExposure: Math.pow(2, HOME_EXPOSURE),
      outputColorSpace: THREE.SRGBColorSpace,
    }),
    [],
  );

  const dpr = useMemo(() => {
    if (typeof window === "undefined") return 1;
    return isMobile
      ? [1, Math.min(window.devicePixelRatio, 1.5)]
      : [1, Math.min(window.devicePixelRatio, 2)];
  }, [isMobile]);

  const handleResetAllCaches = useCallback(() => {
    home.handleResetCache();
    inventory.handleResetCache();
  }, [home, inventory]);

  // Feedback for switching to a building whose GLB hasn't been downloaded
  // yet (accordion click in the inventory sidebar) — see
  // components/ui/scene-loading-indicator for why this can't just be
  // Suspense's own fallback. Gated on `inventory.isReady` so this never
  // doubles up with the initial-load cover (containers/global-loader,
  // z-[200]) or Inventory's own SceneReadyGate reveal — it only ever
  // appears for a SUBSEQUENT building switch, once the first real reveal
  // has already happened.
  const { isLoading: isStreamingAssets } = useSceneLoadingProgress();
  const showBuildingLoadingIndicator =
    isInventory && inventory.isReady && isStreamingAssets;

  // Where the indicator needs to sit so it lands in the middle of the
  // actually-visible canvas, not the middle of the raw full-screen <canvas>
  // box. The Inventory sidebar (desktop, containers/inventory/index.jsx's
  // `w-[380px]` panel) and the mobile bottom sheet (`snapHeight` tall) are
  // both opaque DOM overlays painted OVER the canvas, not reductions of the
  // canvas's own size — see this file's own canvasHeight comment further up
  // for why the canvas itself stays permanently full-bleed. A plain
  // `inset-0` center in components/ui/scene-loading-indicator would sit
  // partly or fully underneath one of those overlays instead of in the
  // middle of what the visitor can actually see.
  //
  // Deliberately mirrors features/adaptive-controls's own
  // camera.setViewOffset() compensation instead of introducing separate
  // math: same breakpoint (isMobile, 1024px), same constant
  // (INVENTORY_SIDEBAR_WIDTH), same RTL side-flip, same snapHeight source
  // (state.building.snapHeight) — that hook already solved "where is the
  // visible region's center" for the 3D camera; this reuses that answer for
  // the 2D DOM indicator instead of re-deriving it.
  const { i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const snapHeight = useSelector((state) => state.building.snapHeight);
  const loadingIndicatorOffset = useMemo(() => {
    if (!isMobile) {
      return { x: (isRtl ? -1 : 1) * (INVENTORY_SIDEBAR_WIDTH / 2), y: 0 };
    }
    if (snapHeight > 0) {
      return { x: 0, y: -(snapHeight / 2) };
    }
    return { x: 0, y: 0 };
  }, [isMobile, isRtl, snapHeight]);

  return {
    activeKey,
    isHome,
    isInventory,
    isVeiled,
    glConfig,
    dpr,
    homeControlsRef: home.controlsRef,
    handleHomeReady: home.handleReady,
    inventoryControlsRef: inventory.controlsRef,
    inventoryModelRef: inventory.modelRef,
    handleInventoryReady: inventory.handleReady,
    handleResetAllCaches,
    showBuildingLoadingIndicator,
    loadingIndicatorOffset,
  };
};

export default useSceneCanvas;
