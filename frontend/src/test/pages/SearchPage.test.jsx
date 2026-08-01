import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchPage from "../../pages/SearchPage";
import * as apiModule from "../../utils/api";

vi.mock("../../utils/api", async () => {
  const original = await vi.importActual("../../utils/api");
  return {
    ...original,
    api: {
      get: vi.fn().mockResolvedValue({ data: [] }),
      post: vi.fn().mockResolvedValue({ data: {} }),
      put: vi.fn().mockResolvedValue({ data: {} }),
      delete: vi.fn().mockResolvedValue({ data: {} }),
    },
    errorMessage: original.errorMessage,
    loadSearchState: () => null,
    saveSearchState: vi.fn(),
    clearAllSearchStates: vi.fn(),
    decodeJwtEmail: () => "tester@example.com",
  };
});

vi.mock("../../hooks/useToasts", () => ({
  showToast: vi.fn(),
  useToasts: () => [],
}));

const searchInput = () =>
  screen.getByRole("textbox", {
    name: /search by album title or artist name/i,
  });

describe("SearchPage", () => {
  it("renders the search input and heading", async () => {
    render(<SearchPage />);
    expect(screen.getByRole("heading", { name: /discover albums/i })).toBeInTheDocument();
    await waitFor(() => expect(searchInput()).toBeInTheDocument());
  });

  it("lets the user type into the search input", async () => {
    render(<SearchPage />);
    const input = await waitFor(searchInput);
    await userEvent.type(input, "Coldplay");
    expect(input).toHaveValue("Coldplay");
  });

  it("clears the search input when backspace is used", async () => {
    render(<SearchPage />);
    const input = await waitFor(searchInput);
    await userEvent.type(input, "AB");
    await userEvent.clear(input);
    expect(input).toHaveValue("");
  });

  it("renders the search submit button", async () => {
    render(<SearchPage />);
    await waitFor(searchInput);
    expect(
      screen.getByRole("button", { name: /search/i }),
    ).toBeInTheDocument();
  });

  it("renders the recommendations section heading on idle", async () => {
    render(<SearchPage />);
    await waitFor(searchInput);
    expect(
      screen.getByRole("heading", { name: /recommended for you/i }),
    ).toBeInTheDocument();
  });

  it("calls the api at least once after typing then waiting", async () => {
    render(<SearchPage />);
    const input = await waitFor(searchInput);
    await userEvent.type(input, "Radiohead");
    await userEvent.click(
      screen.getByRole("button", { name: /search/i }),
    );
    const urls = apiModule.api.get.mock.calls.map(([u]) => u);
    expect(urls).toContain("/library");
    expect(urls).toContain("/recommendations");
  });

  it("paginates search results into pages of six albums", async () => {
    const albums = Array.from({ length: 8 }, (_, index) => ({
      appleCatalogId: index + 1,
      title: `Album ${index + 1}`,
      artistName: "Test Artist",
      genre: "Rock",
      releaseDate: "2024-01-01",
      trackCount: 10,
      artworkUrl: "",
    }));

    apiModule.api.get.mockImplementation((url) => {
      if (url === "/search") {
        return Promise.resolve({ data: albums });
      }
      return Promise.resolve({ data: [] });
    });

    render(<SearchPage />);
    const input = await waitFor(searchInput);
    await userEvent.type(input, "Coldplay");
    await userEvent.click(screen.getByRole("button", { name: /search/i }));

    await waitFor(() => expect(screen.getByText("Album 1")).toBeInTheDocument());
    expect(screen.getByText("Album 6")).toBeInTheDocument();
    expect(screen.queryByText("Album 7")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
  });
});
