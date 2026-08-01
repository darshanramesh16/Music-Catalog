import { renderHook, act } from "@testing-library/react";

const loadFreshModule = async () => {
  vi.resetModules();
  return await import("../../hooks/useToasts");
};

describe("useToasts / showToast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("initially returns an empty array of toasts", async () => {
    const { useToasts } = await loadFreshModule();
    const { result } = renderHook(() => useToasts());
    expect(result.current).toEqual([]);
  });

  it("adds a toast when showToast is called and the hook subscriber sees it", async () => {
    const { useToasts, showToast } = await loadFreshModule();
    const { result } = renderHook(() => useToasts());
    expect(result.current).toHaveLength(0);

    act(() => {
      showToast("First message", "success");
    });

    expect(result.current).toHaveLength(1);
    expect(result.current[0].message).toBe("First message");
    expect(result.current[0].variant).toBe("success");
  });

  it("gives subsequent toasts unique ids", async () => {
    const { useToasts, showToast } = await loadFreshModule();
    const { result } = renderHook(() => useToasts());
    act(() => {
      showToast("A", "success");
      showToast("B", "error");
    });
    expect(result.current).toHaveLength(2);
    expect(result.current[0].id).not.toEqual(result.current[1].id);
  });

  it("removes the toast after its 3-second timeout", async () => {
    const { useToasts, showToast } = await loadFreshModule();
    const { result } = renderHook(() => useToasts());

    act(() => {
      showToast("Going away", "success");
    });
    expect(result.current).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current).toEqual([]);
  });
});
