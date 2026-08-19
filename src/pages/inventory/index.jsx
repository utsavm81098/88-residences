import InventoryContainer from "@/containers/inventory";

/**
 * Inventory Page Component.
 * Acts as a pure entry point to render the InventoryContainer.
 *
 * `active` is supplied by containers/keep-alive-outlet: this page stays mounted
 * after its first visit and is hidden rather than unmounted, so the container
 * needs to know when to stop its render loop. It MUST be forwarded.
 */
export default function Inventory({ active = true }) {
  return <InventoryContainer active={active} />;
}
