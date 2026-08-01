import React, { useEffect, useState } from "react";
import AlbumCard from "../components/AlbumCard";
import { api, errorMessage } from "../utils/api";
import { showToast } from "../hooks/useToasts";

function SkeletonCard() {
  return (
    <article className="card card-skeleton" aria-hidden="true">
      <div className="skeleton skeleton-art" />
      <div className="skeleton-body">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-artist" />
        <div className="skeleton skeleton-meta" />
        <div className="skeleton skeleton-meta-sm" />
        <div className="skeleton skeleton-btn" />
      </div>
    </article>
  );
}

export default function LibraryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editAlbum, setEditAlbum] = useState(null);
  const [deleteAlbum, setDeleteAlbum] = useState(null);
  const [editRating, setEditRating] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const load = () => {
    setLoading(true);
    api
      .get("/library")
      .then((response) => setItems(response.data))
      .catch((requestError) => setError(errorMessage(requestError)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openEditor = (album) => {
    setEditAlbum(album);
    setEditRating(album.userRating != null ? String(album.userRating) : "");
    setEditNotes(album.userNotes || "");
  };

  const saveEdit = async () => {
    if (!editAlbum) return;
    try {
      await api.put(`/library/${editAlbum.id}`, {
        userRating: editRating.trim() === "" ? null : Number(editRating.trim()),
        userNotes: editNotes.trim(),
      });
      setEditAlbum(null);
      load();
      showToast("Library item saved.", "success");
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  };

  const openDelete = (album) => setDeleteAlbum(album);
  const cancelDelete = () => setDeleteAlbum(null);
  const confirmDelete = async () => {
    if (!deleteAlbum) return;
    try {
      await api.delete(`/library/${deleteAlbum.id}`);
      setItems(items.filter((item) => item.id !== deleteAlbum.id));
      setDeleteAlbum(null);
      showToast("Album removed from your library.", "success");
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  };

  if (loading)
    return (
      <section>
        <h1>My Library</h1>
        <div className="grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </section>
    );

  return (
    <section>
      <h1>My Library</h1>
      {error && <div className="error">{error}</div>}
      {!items.length ? (
        <p className="empty">
          Your library is empty. Find an album on the Search page.
        </p>
      ) : (
        <div className="grid">
          {items.map((album) => (
            <AlbumCard
              key={album.id}
              album={album}
              action={
                <div className="card-actions">
                  <button onClick={() => openEditor(album)}>
                    Edit rating & notes
                  </button>
                  <button className="danger" onClick={() => openDelete(album)}>
                    Delete
                  </button>
                </div>
              }
            >
              <p>
                <strong>Rating:</strong> {album.userRating || "Not rated"}
              </p>
              <p>
                <strong>Notes:</strong> {album.userNotes || "None"}
              </p>
            </AlbumCard>
          ))}
        </div>
      )}

      {editAlbum && (
        <div className="modal-backdrop" role="presentation">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-album-title"
          >
            <div className="modal-icon" aria-hidden="true">
              ✍️
            </div>
            <h2 id="edit-album-title">Edit rating and notes</h2>
            <p>
              {editAlbum.title} · {editAlbum.artistName}
            </p>
            <label className="modal-label">
              Rating (1–5)
              <input
                type="number"
                min="1"
                max="5"
                value={editRating}
                onChange={(event) => setEditRating(event.target.value)}
              />
            </label>
            <label className="modal-label">
              Notes
              <textarea
                rows="4"
                value={editNotes}
                onChange={(event) => setEditNotes(event.target.value)}
              />
            </label>
            <div className="modal-actions">
              <button className="secondary" onClick={() => setEditAlbum(null)}>
                Cancel
              </button>
              <button onClick={saveEdit}>Save</button>
            </div>
          </section>
        </div>
      )}

      {deleteAlbum && (
        <div className="modal-backdrop" role="presentation">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-album-title"
          >
            <div className="modal-icon" aria-hidden="true">
              🗑️
            </div>
            <h2 id="delete-album-title">Remove album from library?</h2>
            <p>
              {deleteAlbum.title} by {deleteAlbum.artistName}
            </p>
            <div className="modal-actions">
              <button className="secondary" onClick={cancelDelete}>
                Cancel
              </button>
              <button className="danger" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
