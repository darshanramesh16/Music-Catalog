import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LogoutDialog from "../../components/LogoutDialog";

describe("LogoutDialog", () => {
  it("renders the logout prompt with correct heading and buttons", () => {
    render(<LogoutDialog onCancel={vi.fn()} onConfirm={vi.fn()} />);
    expect(
      screen.getByRole("heading", { name: /log out of music catalog/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^log out$/i })).toBeInTheDocument();
  });

  it("calls onCancel when the Cancel button is clicked", async () => {
    const onCancel = vi.fn();
    render(<LogoutDialog onCancel={onCancel} onConfirm={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onConfirm when the Log out button is clicked", async () => {
    const onConfirm = vi.fn();
    render(<LogoutDialog onCancel={vi.fn()} onConfirm={onConfirm} />);
    await userEvent.click(screen.getByRole("button", { name: /^log out$/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("renders a dialog with aria-modal=true", () => {
    const { container } = render(
      <LogoutDialog onCancel={vi.fn()} onConfirm={vi.fn()} />,
    );
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog.getAttribute("aria-modal")).toBe("true");
  });
});
