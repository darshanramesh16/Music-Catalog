import React from "react";
import { useToasts } from "../hooks/useToasts";

export default function ToastHost() {
  const toasts = useToasts();
  return (
    <div className="toast-host" aria-live="polite" aria-atomic="true">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.variant}`}>
          <span className="toast-icon" aria-hidden="true">
            {t.variant === "success" ? "✓" : "!"}
          </span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
