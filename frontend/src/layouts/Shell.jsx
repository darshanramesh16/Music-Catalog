import React, { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import LogoutDialog from "../components/LogoutDialog";
import ToastHost from "../components/ToastHost";
import { clearAllSearchStates, decodeJwtEmail } from "../utils/api";

export default function Shell({ children }) {
  const navigate = useNavigate();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const email = decodeJwtEmail();

  useEffect(() => {
    if (!profileOpen) return;
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  const logout = () => {
    clearAllSearchStates();
    localStorage.removeItem("token");
    setLogoutOpen(false);
    setProfileOpen(false);
    navigate("/login", { replace: true });
  };

  return (
    <>
      <header>
        <div className="header-left">
          <NavLink className="brand" to="/search">
            <svg className="brand-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.5 3.5a.75.75 0 0 0-.976-.71l-9 2.25A.75.75 0 0 0 10 5.79v10.36A3.5 3.5 0 1 0 11.5 19V7.65l7.5-1.875V15.36A3.5 3.5 0 1 0 20.5 17V3.5Z" />
            </svg>
            Music Catalog
          </NavLink>
          <nav>
            <NavLink to="/search">Search</NavLink>
            <NavLink to="/library">My Library</NavLink>
            <NavLink to="/analytics">Analytics</NavLink>
          </nav>
        </div>
        <div className="header-right">
          <div className="profile-wrap" ref={profileRef}>
            <button
              className="profile-btn"
              onClick={() => setProfileOpen((p) => !p)}
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              aria-label="Profile menu"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.418 0-8 2.91-8 6.5V22h16v-1.5c0-3.59-3.582-6.5-8-6.5Z" />
              </svg>
            </button>
            {profileOpen && (
              <div className="profile-dropdown" role="menu">
                <div className="profile-info">
                  <div className="profile-avatar" aria-hidden="true">
                    {email ? email.charAt(0).toUpperCase() : "?"}
                  </div>
                  <div className="profile-meta">
                    <p className="profile-email">{email || "Signed in"}</p>
                    <p className="profile-label">Signed in to Music Catalog</p>
                  </div>
                </div>
                <button className="profile-logout" onClick={() => setLogoutOpen(true)}>
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main>{children}</main>
      {logoutOpen && <LogoutDialog onCancel={() => setLogoutOpen(false)} onConfirm={logout} />}
      <ToastHost />
    </>
  );
}
