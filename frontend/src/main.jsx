import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  NavLink,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import axios from "axios";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./styles.css";
import "./recommendations.css";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api",
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const errorMessage = (error) =>
  error.response?.data?.message || "Something went wrong. Please try again.";

const SEARCH_STATE_KEY = (token) => `search_state_${token || "guest"}`;

const saveSearchState = (state) => {
  const token = localStorage.getItem("token");
  if (!token) return;
  try {
    localStorage.setItem(SEARCH_STATE_KEY(token), JSON.stringify(state));
  } catch (_) {}
};

const loadSearchState = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const raw = localStorage.getItem(SEARCH_STATE_KEY(token));
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
};

const clearAllSearchStates = () => {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("search_state_"))
      .forEach((k) => localStorage.removeItem(k));
  } catch (_) {}
};

const decodeJwtEmail = () => {
  const token = localStorage.getItem("token");
  if (!token) return "";
  try {
    const payload = token.split(".")[1];
    if (!payload) return "";
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return decoded.sub || "";
  } catch (_) {
    return "";
  }
};

let toastIdSeq = 0;
const toastSubscribers = new Set();
let toastSnapshot = [];
const publishToasts = () => {
  toastSubscribers.forEach((fn) => fn(toastSnapshot));
};
const showToast = (message, variant = "success") => {
  const id = ++toastIdSeq;
  toastSnapshot = [...toastSnapshot, { id, message, variant }];
  publishToasts();
  setTimeout(() => {
    toastSnapshot = toastSnapshot.filter((t) => t.id !== id);
    publishToasts();
  }, 3000);
};
const useToasts = () => {
  const [toasts, setToasts] = useState(toastSnapshot);
  useEffect(() => {
    const fn = (snap) => setToasts(snap);
    toastSubscribers.add(fn);
    return () => toastSubscribers.delete(fn);
  }, []);
  return toasts;
};

function ToastHost() {
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

function LogoutDialog({ onCancel, onConfirm }) {
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

function Shell({ children }) {
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
      {logoutOpen && (
        <LogoutDialog
          onCancel={() => setLogoutOpen(false)}
          onConfirm={logout}
        />
      )}
      <ToastHost />
    </>
  );
}

function Protected({ children }) {
  return localStorage.getItem("token") ? (
    <Shell>{children}</Shell>
  ) : (
    <Navigate to="/login" replace />
  );
}

function Auth({ register = false }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (register && password !== confirmPassword) {
      setError("Passwords do not match. Please enter the same password twice.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await api.post(
        `/auth/${register ? "register" : "login"}`,
        { email, password },
      );
      localStorage.setItem("token", response.data.token);
      navigate("/search", { replace: true });
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <form onSubmit={submit}>
        <h1>{register ? "Create your account" : "Welcome back"}</h1>
        <p>
          {register
            ? "Create an account to build your personal album library."
            : "Log in to explore your music library."}
        </p>
        {error && <div className="error">{error}</div>}
        <label>
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            minLength="8"
            autoComplete={register ? "new-password" : "current-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {register && (
          <label>
            Confirm password
            <input
              type="password"
              required
              minLength="8"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>
        )}
        <button disabled={busy}>
          {busy ? "Please wait…" : register ? "Create account" : "Login"}
        </button>
        <p>
          {register ? "Already registered? " : "New here? "}
          <NavLink to={register ? "/login" : "/register"}>
            {register ? "Login" : "Create an account"}
          </NavLink>
        </p>
      </form>
    </div>
  );
}

function AlbumCard({ album, action, children }) {
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
          {album.genre || "Unknown genre"} ·{" "}
          {album.releaseDate || "Unknown date"}
        </p>
        <p>{album.trackCount ?? "—"} tracks</p>
        {children}
        {action}
      </div>
    </article>
  );
}

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

function SkeletonChart() {
  return (
    <div className="chart card-skeleton" aria-hidden="true">
      <div className="skeleton skeleton-chart-title" />
      <div className="skeleton skeleton-chart-body" />
    </div>
  );
}

function SkeletonInsights() {
  return (
    <div className="insights card-skeleton" aria-hidden="true">
      <div className="skeleton skeleton-chart-title" />
      <div className="skeleton skeleton-insights-line" />
      <div className="skeleton skeleton-insights-line" style={{ width: "85%" }} />
      <div className="skeleton skeleton-insights-line" style={{ width: "60%" }} />
      <div className="skeleton skeleton-btn" style={{ marginTop: "14px" }} />
    </div>
  );
}

function Search() {
  const saved = loadSearchState();
  const [query, setQuery] = useState(saved?.query ?? "");
  const [items, setItems] = useState(saved?.items ?? []);
  const [recommendations, setRecommendations] = useState(saved?.recommendations ?? []);
  const [recommendationState, setRecommendationState] = useState(
    saved?.recommendationState ?? "loading",
  );
  const [state, setState] = useState(saved?.state ?? "idle");
  const [inLibrary, setInLibrary] = useState(() => new Set(saved?.inLibrary ?? []));
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    if (saved && saved?.inLibrary?.length) return;
    api
      .get("/library")
      .then((response) => {
        const ids = new Set(response.data.map((a) => a.appleCatalogId));
        setInLibrary((prev) => {
          const merged = new Set(prev);
          ids.forEach((id) => merged.add(id));
          return merged;
        });
      })
      .catch(() => {});
  }, []);

  const runSearch = async () => {
    if (!query.trim()) return;
    setState("loading");
    try {
      const response = await api.get("/search", {
        params: { query, type: "album" },
      });
      setItems(response.data);
      setState("done");
    } catch (requestError) {
      showToast(errorMessage(requestError), "error");
      setState("error");
    }
  };

  const search = async (event) => {
    event?.preventDefault();
    await runSearch();
  };

  const loadRecommendations = async () => {
    setRecommendationState("loading");
    try {
      const response = await api.get("/recommendations");
      setRecommendations(response.data);
      setRecommendationState("done");
    } catch (_) {
      setRecommendationState("error");
    }
  };

  useEffect(() => {
    if (saved && recommendationState !== "loading") return;
    loadRecommendations();
  }, []);

  useEffect(() => {
    saveSearchState({
      query,
      items,
      recommendations,
      recommendationState,
      state,
      inLibrary: Array.from(inLibrary),
    });
  }, [query, items, recommendations, recommendationState, state, inLibrary]);

  const add = async (album) => {
    if (inLibrary.has(album.appleCatalogId) || addingId === album.appleCatalogId) return;
    setAddingId(album.appleCatalogId);
    try {
      await api.post("/library", album);
      setInLibrary((prev) => new Set(prev).add(album.appleCatalogId));
      setRecommendations((current) =>
        current.filter((item) => item.album.appleCatalogId !== album.appleCatalogId),
      );
      showToast(`✓ ${album.title} added to your library`, "success");
    } catch (requestError) {
      showToast(errorMessage(requestError), "error");
    } finally {
      setAddingId(null);
    }
  };

  const AddButton = ({ album }) => {
    const id = album.appleCatalogId;
    const saved = inLibrary.has(id);
    const adding = addingId === id;
    if (saved) {
      return (
        <button className="in-library" disabled>
          ✓ In Library
        </button>
      );
    }
    return (
      <button onClick={() => add(album)} disabled={adding}>
        {adding ? "Adding…" : "Add to Library"}
      </button>
    );
  };

  return (
    <section>
      <h1>Discover albums</h1>
      <p className="search-help">
        Search by album title or artist name. Every result is an album.
      </p>
      <form className="search" onSubmit={search}>
        <input
          placeholder="Search album title or artist…"
          aria-label="Search by album title or artist name"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button>Search</button>
      </form>

      {state === "idle" && (
        <section className="recommendation-section">
          <div className="section-heading">
            <div>
              <h2>Recommended for you</h2>
              <p>Suggestions are based on genres in your saved library.</p>
            </div>
          </div>
          {recommendationState === "loading" && (
            <div className="grid">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}
          {recommendationState === "error" && (
            <div className="state-card state-card--error">
              <div className="state-icon" aria-hidden="true">⚠</div>
              <div>
                <h3>Couldn't load recommendations.</h3>
                <p>Check your connection and try again.</p>
              </div>
              <button onClick={loadRecommendations}>Try Again</button>
            </div>
          )}
          {recommendationState === "done" && !recommendations.length && (
            <div className="state-card state-card--empty">
              <div className="state-icon" aria-hidden="true">♪</div>
              <div>
                <h3>No recommendations yet.</h3>
                <p>Add albums to your library to get personalized recommendations.</p>
              </div>
            </div>
          )}
          {recommendationState === "done" && recommendations.length > 0 && (
            <div className="grid">
              {recommendations.map((item) => (
                <AlbumCard
                  key={item.album.appleCatalogId}
                  album={item.album}
                  action={<AddButton album={item.album} />}
                >
                  <p className="recommendation-reason">{item.reason}</p>
                </AlbumCard>
              ))}
            </div>
          )}
        </section>
      )}

      {state === "loading" && (
        <>
          <p className="state-loading-label">Searching albums…</p>
          <div className="grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </>
      )}

      {state === "error" && (
        <div className="state-card state-card--error">
          <div className="state-icon" aria-hidden="true">⚠</div>
          <div>
            <h3>Couldn't load albums.</h3>
            <p>Something went wrong while searching. Please try again.</p>
          </div>
          <button onClick={runSearch}>Try Again</button>
        </div>
      )}

      {state === "done" && items.length === 0 && (
        <div className="state-card state-card--empty">
          <div className="state-icon" aria-hidden="true">🔍</div>
          <div>
            <h3>No albums found for "{query.trim()}".</h3>
            <p>Try another album or artist.</p>
          </div>
        </div>
      )}

      {state === "done" && items.length > 0 && (
        <div className="grid">
          {items.map((album) => (
            <AlbumCard
              key={album.appleCatalogId}
              album={album}
              action={<AddButton album={album} />}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function Library() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = () => {
    setLoading(true);
    api
      .get("/library")
      .then((response) => setItems(response.data))
      .catch((requestError) => setError(errorMessage(requestError)))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);
  const edit = async (album) => {
    const rating = prompt(
      "Rating (1–5; leave blank to clear):",
      album.userRating || "",
    );
    if (rating === null) return;
    const notes = prompt("Personal notes:", album.userNotes || "");
    if (notes === null) return;
    try {
      await api.put(`/library/${album.id}`, {
        userRating: rating === "" ? null : Number(rating),
        userNotes: notes,
      });
      load();
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  };
  const remove = async (album) => {
    if (!confirm(`Remove “${album.title}” from your library?`)) return;
    try {
      await api.delete(`/library/${album.id}`);
      setItems(items.filter((item) => item.id !== album.id));
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
                  <button onClick={() => edit(album)}>
                    Edit rating & notes
                  </button>
                  <button className="danger" onClick={() => remove(album)}>
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
    </section>
  );
}

const COLORS = [
  "#6366f1",
  "#14b8a6",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#06b6d4",
];
function Chart({ title, children }) {
  return (
    <div className="chart">
      <h2>{title}</h2>
      <ResponsiveContainer width="100%" height={260}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}

function Analytics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [insight, setInsight] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api
      .get("/analytics")
      .then((response) => setData(response.data))
      .catch((requestError) => setError(errorMessage(requestError)));
  }, []);
  const generate = async () => {
    setBusy(true);
    setError("");
    try {
      setInsight((await api.post("/ai/insights")).data.summary);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };
  if (error && !data) return <div className="error">{error}</div>;
  if (!data)
    return (
      <section>
        <h1>Analytics</h1>
        <div className="charts">
          <SkeletonChart />
          <SkeletonChart />
          <SkeletonChart />
          <SkeletonChart />
        </div>
        <SkeletonInsights />
      </section>
    );
  if (!data.totalAlbums)
    return (
      <section>
        <h1>Analytics</h1>
        <p className="empty">
          Add a few albums to your library to see your personal insights.
        </p>
      </section>
    );
  return (
    <section>
      <h1>Analytics</h1>
      {error && <div className="error">{error}</div>}
      <div className="charts">
        <Chart title="Albums by genre">
          <PieChart>
            <Pie
              data={data.genres}
              dataKey="count"
              nameKey="name"
              innerRadius={55}
              outerRadius={95}
            >
              {data.genres.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </Chart>
        <Chart title="Top artists">
          <BarChart data={data.artists} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={110} />
            <Tooltip />
            <Bar dataKey="count" fill="#6366f1" />
          </BarChart>
        </Chart>
        <Chart title="Release-year distribution">
          <BarChart data={data.releasesByYear} barCategoryGap="8%">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#f59e0b" />
          </BarChart>
        </Chart>
        <Chart title="Library growth">
          <LineChart data={data.growth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#14b8a6"
              strokeWidth={3}
            />
          </LineChart>
        </Chart>
      </div>
      <div className="insights">
        <h2>AI Insights</h2>
        {insight ? (
          <p>{insight}</p>
        ) : (
          <p>Generate a concise trend summary from your saved albums.</p>
        )}
        <button onClick={generate} disabled={busy}>
          {busy ? "Generating…" : "Generate Insights"}
        </button>
      </div>
    </section>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/register" element={<Auth register />} />
      <Route
        path="/search"
        element={
          <Protected>
            <Search />
          </Protected>
        }
      />
      <Route
        path="/library"
        element={
          <Protected>
            <Library />
          </Protected>
        }
      />
      <Route
        path="/analytics"
        element={
          <Protected>
            <Analytics />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
