import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchInventory } from "@/store/slices/building-slice";
import ParentBridge from "@/containers/parent-bridge";
import SceneCanvasContainer from "@/containers/scene-canvas";
import KeepAliveOutlet from "@/containers/keep-alive-outlet";

/**
 * MainLayout provides the global shell for the application.
 * Hosts the single persistent 3D Canvas and overlays 2D routed UI views.
 */
export default function MainLayout() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchInventory());
  }, [dispatch]);

  return (
    <div className="flex h-screen w-screen bg-background text-white font-open-sans overflow-hidden relative">
      {/* Synchronization bridge with parent iframe / WordPress host */}
      <ParentBridge />

      {/* Unified Persistent 3D Canvas across the entire application */}
      <div className="absolute inset-0 z-0">
        <SceneCanvasContainer />
      </div>

      {/* Main 2D UI viewport area */}
      <div className="relative z-10 flex-1 flex flex-col h-full overflow-hidden pointer-events-none">
        <main className="flex-1 relative overflow-auto custom-scrollbar pointer-events-none">
          <div className="w-full h-full pointer-events-none">
            <KeepAliveOutlet />
          </div>
        </main>
      </div>
    </div>
  );
}
