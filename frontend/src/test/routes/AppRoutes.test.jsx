import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import AppRoutes from "../../routes/AppRoutes";
import * as apiModule from "../../utils/api";

vi.mock("../../utils/api", async () => {
  const original = await vi.importActual("../../utils/api");
  return {
    ...original,
    api: {
      get: vi.fn().mockResolvedValue({
        data:
          // Analytics path returns chart data; others return empty arrays
          null,
      }),
      post: vi.fn().mockResolvedValue({ data: {} }),
      put: vi.fn().mockResolvedValue({ data: {} }),
      delete: vi.fn().mockResolvedValue({ data: {} }),
    },
    errorMessage: original.errorMessage,
    loadSearchState: () => null,
    saveSearchState: vi.fn(),
    clearAllSearchStates: vi.fn(),
    decodeJwtEmail: () => "me@example.com",
  };
});

vi.mock("../../hooks/useToasts", () => ({
  showToast: vi.fn(),
  useToasts: () => [],
}));

const renderAt = (path) =>
  render(<MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter>);

describe("AppRoutes", () => {
  beforeEach(() => {
    localStorage.clear();
    apiModule.api.get.mockImplementation((url) => {
      if (url === "/analytics") {
        return Promise.resolve({
          data: {
            totalAlbums: 0,
            genres: [],
            artists: [],
            releasesByYear: [],
            trackDistribution: [],
          },
        });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it("/login renders the login page when no token exists", () => {
    renderAt("/login");
    expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
  });

  it("/register renders the register page when no token exists", () => {
    renderAt("/register");
    expect(
      screen.getByRole("heading", { name: /create your account/i }),
    ).toBeInTheDocument();
  });

  it("/ redirects to /search by default (and then to /login without a token)", async () => {
    renderAt("/");
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /welcome back/i }),
      ).toBeInTheDocument();
    });
  });

  it("/search renders Discover albums heading when a token is present", async () => {
    localStorage.setItem("token", "t.o.k");
    renderAt("/search");
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /discover albums/i }),
      ).toBeInTheDocument(),
    );
  });

  it("/library renders My Library heading when a token is present", async () => {
    localStorage.setItem("token", "t.o.k");
    renderAt("/library");
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /my library/i })).toBeInTheDocument(),
    );
  });

  it("/analytics renders Analytics heading when a token is present", async () => {
    localStorage.setItem("token", "t.o.k");
    renderAt("/analytics");
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /analytics/i })).toBeInTheDocument(),
    );
  });

  it("/search redirects to /login when there is no token", async () => {
    localStorage.removeItem("token");
    renderAt("/search");
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument(),
    );
  });
});
