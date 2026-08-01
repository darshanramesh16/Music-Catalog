import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AlbumCard from "../../components/AlbumCard";

const album = {
  title: "Test Album",
  artistName: "Test Artist",
  genre: "Pop",
  releaseDate: "2024-01-01",
  trackCount: 10,
  artworkUrl: "https://example.com/art.jpg",
  appleCatalogId: 123,
};

describe("AlbumCard", () => {
  it("renders the album title and artist name", () => {
    render(<AlbumCard album={album} />);
    expect(screen.getByText("Test Album")).toBeInTheDocument();
    expect(screen.getByText("Test Artist")).toBeInTheDocument();
  });

  it("renders genre, date and track count", () => {
    render(<AlbumCard album={album} />);
    expect(screen.getByText(/Pop · 2024-01-01/)).toBeInTheDocument();
    expect(screen.getByText("10 tracks")).toBeInTheDocument();
  });

  it("falls back to placeholder text when fields are missing", () => {
    render(
      <AlbumCard
        album={{
          title: "Minimal",
          artistName: "Solo",
        }}
      />,
    );
    expect(screen.getByText(/Unknown genre · Unknown date/)).toBeInTheDocument();
    expect(screen.getByText("— tracks")).toBeInTheDocument();
  });

  it("renders children passed through the component", () => {
    render(
      <AlbumCard album={album}>
        <p>Hello I am extra content</p>
      </AlbumCard>,
    );
    expect(screen.getByText("Hello I am extra content")).toBeInTheDocument();
  });

  it("renders the action prop and calls its click handler", async () => {
    const onAdd = vi.fn();
    render(
      <AlbumCard
        album={album}
        action={
          <button onClick={onAdd}>Add to Library</button>
        }
      />,
    );
    const button = screen.getByRole("button", { name: /add to library/i });
    await userEvent.click(button);
    expect(onAdd).toHaveBeenCalledTimes(1);
  });
});
