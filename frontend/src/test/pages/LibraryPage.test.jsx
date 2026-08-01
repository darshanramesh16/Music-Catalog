import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LibraryPage from "../../pages/LibraryPage";
import * as apiModule from "../../utils/api";

vi.mock("../../utils/api", async () => {
  const original = await vi.importActual("../../utils/api");
  return {
    ...original,
    api: {
      get: vi.fn().mockResolvedValue({ data: [] }),
      post: vi.fn(),
      put: vi.fn().mockResolvedValue({ data: {} }),
      delete: vi.fn().mockResolvedValue({ data: {} }),
    },
    errorMessage: original.errorMessage,
  };
});

vi.mock("../../hooks/useToasts", () => ({
  showToast: vi.fn(),
  useToasts: () => [],
}));

describe("LibraryPage", () => {
  beforeEach(() => {
    apiModule.api.get.mockClear();
    apiModule.api.put.mockClear();
    apiModule.api.delete.mockClear();
  });

  it("renders the My Library heading and fetches /library", async () => {
    render(<LibraryPage />);
    await waitFor(() =>
      expect(apiModule.api.get).toHaveBeenCalledWith("/library"),
    );
    expect(screen.getByRole("heading", { name: /my library/i })).toBeInTheDocument();
  });

  it("shows an empty library message when there are no albums", async () => {
    apiModule.api.get.mockResolvedValue({ data: [] });
    render(<LibraryPage />);
    await waitFor(() =>
      expect(
        screen.getByText(/your library is empty/i),
      ).toBeInTheDocument(),
    );
  });

  it("renders albums returned from the library endpoint", async () => {
    const albums = [
      {
        id: 1,
        title: "Blue Album",
        artistName: "The Band",
        genre: "Rock",
        releaseDate: "2020-06-01",
        trackCount: 12,
        artworkUrl: "https://example.com/blue.jpg",
        appleCatalogId: 100,
        userRating: 5,
        userNotes: "Great stuff",
      },
    ];
    apiModule.api.get.mockResolvedValue({ data: albums });
    render(<LibraryPage />);

    await waitFor(() =>
      expect(screen.getByText("Blue Album")).toBeInTheDocument(),
    );
    expect(screen.getByText("The Band")).toBeInTheDocument();
    expect(screen.getByText(/Great stuff/)).toBeInTheDocument();
    expect(
      document.body.textContent.includes("Rating:") &&
      document.body.textContent.includes(" 5"),
    ).toBe(true);
  });

  it("opens the edit modal when edit button is clicked and saves", async () => {
    const album = {
      id: 42,
      title: "Edit Me",
      artistName: "Writer",
      genre: "Pop",
      releaseDate: "2023-01-01",
      trackCount: 10,
      artworkUrl: "https://example.com/e.jpg",
      appleCatalogId: 99,
      userRating: null,
      userNotes: "",
    };
    apiModule.api.get.mockResolvedValue({ data: [album] });
    render(<LibraryPage />);

    await waitFor(() =>
      expect(screen.getByText("Edit Me")).toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("heading", { name: /edit rating and notes/i }),
    ).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /edit rating & notes/i }),
    );
    expect(
      screen.getByRole("heading", { name: /edit rating and notes/i }),
    ).toBeInTheDocument();

    const ratingInput = screen.getByLabelText(/Rating \(1–5\)/);
    await userEvent.clear(ratingInput);
    await userEvent.type(ratingInput, "4");
    const notesInput = screen.getByLabelText(/^Notes$/i);
    await userEvent.clear(notesInput);
    await userEvent.type(notesInput, "Really good");
    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(apiModule.api.put).toHaveBeenCalledWith(
      "/library/42",
      expect.objectContaining({ userRating: 4, userNotes: "Really good" }),
    );
  });

  it("opens the delete dialog and calls delete API on confirm", async () => {
    const album = {
      id: 77,
      title: "Delete Me",
      artistName: "Eraser",
      genre: "Rock",
      releaseDate: "2010-01-01",
      trackCount: 1,
      artworkUrl: "https://example.com/d.jpg",
      appleCatalogId: 77,
    };
    apiModule.api.get.mockResolvedValue({ data: [album] });
    render(<LibraryPage />);

    await waitFor(() =>
      expect(screen.getByText("Delete Me")).toBeInTheDocument(),
    );
    await userEvent.click(
      screen.getByRole("button", { name: /delete/i }),
    );
    expect(
      screen.getByRole("heading", { name: /remove album from library/i }),
    ).toBeInTheDocument();

    const modal = screen.getByRole("dialog");
    const modalDelete = modal.querySelector("button.danger");
    await userEvent.click(modalDelete);
    expect(apiModule.api.delete).toHaveBeenCalledWith("/library/77");
  });
});
