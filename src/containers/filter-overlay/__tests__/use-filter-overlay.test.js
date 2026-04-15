import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useFilterOverlay } from "../use-filter-overlay";

// Mock constant data to ensure stable test environment
vi.mock("@/utils/constant", () => ({
  unitData: {
    "Type F": [
      { name: "Box001", type: "1BHK", price: "€150,000", floor: 0, direction: "Pool" },
      { name: "Box002", type: "2BHK", price: "€350,000", floor: 1, direction: "Valley" },
    ],
  },
  BUILDING_CONFIG: [{ name: "Type F" }],
}));

describe("useFilterOverlay", () => {
  it("should initialize with default empty filters", () => {
    const { result } = renderHook(() => useFilterOverlay({ isOpen: true, onClose: vi.fn() }));
    
    expect(result.current.selectedFilters).toEqual({
      rooms: [],
      budget: null,
      type: [],
      exposure: [],
      buildings: [],
    });
  });

  it("should toggle room filters", () => {
    const { result } = renderHook(() => useFilterOverlay({ isOpen: true, onClose: vi.fn() }));
    
    act(() => {
      result.current.toggleFilter("rooms", "1");
    });
    expect(result.current.selectedFilters.rooms).toContain("1");

    act(() => {
      result.current.toggleFilter("rooms", "1");
    });
    expect(result.current.selectedFilters.rooms).not.toContain("1");
  });

  it("should filter units by budget correctly", () => {
    const { result } = renderHook(() => useFilterOverlay({ isOpen: true, onClose: vi.fn() }));
    
    act(() => {
      result.current.toggleFilter("budget", "0 - 199K");
    });
    // Total units in mock is 2, Box001 is 150k (matches), Box002 is 350k (doesn't match)
    expect(result.current.filteredCount).toBe(1);
  });

  it("should clear all filters", () => {
    const { result } = renderHook(() => useFilterOverlay({ isOpen: true, onClose: vi.fn() }));
    
    act(() => {
      result.current.toggleFilter("rooms", "1");
      result.current.toggleFilter("budget", "0 - 199K");
      result.current.handleClearAll();
    });
    
    expect(result.current.selectedFilters.rooms).toEqual([]);
    expect(result.current.selectedFilters.budget).toBeNull();
  });
});
