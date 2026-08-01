import React from "react";

export default function LogoutDialog({ onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-title"
      >
        <div className="modal-icon" aria-hidden="true">
          ↪
        </div>
        <h2 id="logout-title">Log out of Music Catalog?</h2>
        <p>
          You can log back in anytime to continue exploring your personal album
          library.
        </p>
        <div className="modal-actions">
          <button className="secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="danger" onClick={onConfirm}>
            Log out
          </button>
        </div>
      </section>
    </div>
  );
}
