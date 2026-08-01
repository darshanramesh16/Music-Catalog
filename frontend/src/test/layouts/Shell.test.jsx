import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Shell from "../../layouts/Shell";
import * as apiModule from "../../utils/api";

vi.mock("../../utils/api", async () => {
  const original = await vi.importActual("../../utils/api");
  return {
    ...original,
    clearAllSearchStates: vi.fn(),
    decodeJwtEmail: () => "tester@example.com",
  };
});

vi.mock("../../hooks/useToasts", () => ({
  showToast: vi.fn(),
  useToasts: () => [],
}));

const renderAt = (children, path) =>
  render(<MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>);

describe("Shell", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("token", "a.b.c");
    apiModule.clearAllSearchStates.mockClear();
  });

  it("renders the brand, nav links, and profile button", () => {
    renderAt(<Shell>Hello shell</Shell>, "/search");
    expect(screen.getByText(/Music Catalog/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /search/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /my library/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /analytics/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /profile menu/i })).toBeInTheDocument();
  });

  it("renders children in the <main> region", () => {
    renderAt(<Shell><p>Inside shell content</p></Shell>, "/search");
    expect(screen.getByText("Inside shell content")).toBeInTheDocument();
  });

  it("opens the profile dropdown when the profile button is clicked", async () => {
    renderAt(<Shell>x</Shell>, "/search");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /profile menu/i }));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByText(/tester@example.com/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log out/i })).toBeInTheDocument();
  });

  it("opens the logout confirm dialog from profile and logs out on confirm", async () => {
    renderAt(<Shell>x</Shell>, "/search");
    await userEvent.click(screen.getByRole("button", { name: /profile menu/i }));
    await userEvent.click(screen.getByRole("button", { name: /log out/i }));

    expect(
      screen.getByRole("heading", { name: /log out of music catalog/i }),
    ).toBeInTheDocument();

    const dialog = screen.getByRole("dialog");
    await userEvent.click(dialog.querySelector("button.danger"));

    await waitFor(() => {
      expect(localStorage.getItem("token")).toBeNull();
    });
    expect(apiModule.clearAllSearchStates).toHaveBeenCalled();
  });

  it("dismisses the logout dialog when Cancel is clicked", async () => {
    renderAt(<Shell>x</Shell>, "/search");
    await userEvent.click(screen.getByRole("button", { name: /profile menu/i }));
    await userEvent.click(screen.getByRole("button", { name: /log out/i }));
    expect(
      screen.getByRole("heading", { name: /log out of music catalog/i }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(
      screen.queryByRole("heading", { name: /log out of music catalog/i }),
    ).not.toBeInTheDocument();
    expect(localStorage.getItem("token")).toBeTruthy();
  });
});
