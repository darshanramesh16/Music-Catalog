import React from "react";

export default function AlbumCard({ album, action, children }) {
  return (
    <article className="card">
      <img
        src={album.artworkUrl || "https://via.placeholder.com/160?text=Album"}
        alt=""
      />
      <div>
        <h3>{album.title}</h3>
        <b>{album.artistName}</b>
        <p>
          {album.genre || "Unknown genre"} · {album.releaseDate || "Unknown date"}
        </p>
        <p>{album.trackCount ?? "—"} tracks</p>
        {children}
        {action}
      </div>
    </article>
  );
}
