import { render, screen } from "@testing-library/react";
import ToastHost from "../../components/ToastHost";
import { showToast } from "../../hooks/useToasts";

describe("ToastHost", () => {
  it("renders a live region even when there are no toasts", () => {
    const { container } = render(<ToastHost />);
    const host = container.querySelector('[aria-live="polite"]');
    expect(host).not.toBeNull();
    expect(host.classList.contains("toast-host")).toBe(true);
  });

  it("renders a success toast with a check icon after showToast is called", async () => {
    render(<ToastHost />);
    showToast("Saved successfully", "success");
    await screen.findByText("Saved successfully");
    expect(screen.getByText("Saved successfully")).toBeInTheDocument();
  });

  it("renders an error toast with an exclamation icon after showToast", async () => {
    render(<ToastHost />);
    showToast("Oops that failed", "error");
    await screen.findByText("Oops that failed");
    expect(document.querySelector(".toast-error")).not.toBeNull();
  });

  it("renders multiple toasts at the same time", async () => {
    render(<ToastHost />);
    showToast("One", "success");
    showToast("Two", "error");
    await screen.findByText("One");
    expect(screen.getByText("Two")).toBeInTheDocument();
  });
});
