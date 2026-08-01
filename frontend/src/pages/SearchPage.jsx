import React, { useEffect, useRef, useState } from "react";
import AlbumCard from "../components/AlbumCard";
import { api, errorMessage, loadSearchState, saveSearchState } from "../utils/api";
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

export default function SearchPage() {
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
  const [pendingQuery, setPendingQuery] = useState(saved?.query ?? "");
  const [currentPage, setCurrentPage] = useState(saved?.currentPage ?? 1);
  const debounceTimeout = useRef(null);
  const searchAbortController = useRef(null);
  const hasMounted = useRef(false);

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

  const cancelPendingSearch = () => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
      debounceTimeout.current = null;
    }
    if (searchAbortController.current) {
      searchAbortController.current.abort();
      searchAbortController.current = null;
    }
  };

  const runSearch = async (searchTerm = query) => {
    const trimmedQuery = searchTerm.trim();
    if (trimmedQuery.length < 2) {
      setCurrentPage(1);
      return;
    }

    cancelPendingSearch();
    setCurrentPage(1);
    searchAbortController.current = new AbortController();
    setState("loading");

    try {
      const response = await api.get("/search", {
        params: { query: trimmedQuery, type: "album" },
        signal: searchAbortController.current.signal,
      });
      setItems(response.data);
      setState("done");
    } catch (requestError) {
      if (requestError.name === "CanceledError" || requestError.name === "AbortError") {
        return;
      }
      showToast(errorMessage(requestError), "error");
      setState("error");
    } finally {
      searchAbortController.current = null;
    }
  };

  const search = async (event) => {
    event?.preventDefault();
    cancelPendingSearch();
    await runSearch(query);
  };

  const scheduleSearch = (nextQuery) => {
    cancelPendingSearch();
    setCurrentPage(1);
    if (!nextQuery.trim()) {
      setItems([]);
      setState("idle");
      return;
    }
    if (nextQuery.trim().length < 2) {
      setState("idle");
      return;
    }

    debounceTimeout.current = setTimeout(() => {
      runSearch(nextQuery);
    }, 500);
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
      currentPage,
      inLibrary: Array.from(inLibrary),
    });
  }, [query, items, recommendations, recommendationState, state, currentPage, inLibrary]);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    scheduleSearch(pendingQuery);
    return () => cancelPendingSearch();
  }, [pendingQuery]);

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

  const itemsPerPage = 6;
  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pagedItems = items.slice(startIndex, endIndex);

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
          onChange={(event) => {
            const nextValue = event.target.value;
            setQuery(nextValue);
            setPendingQuery(nextValue);
          }}
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
        <>
          <div className="grid">
            {pagedItems.map((album) => (
              <AlbumCard
                key={album.appleCatalogId}
                album={album}
                action={<AddButton album={album} />}
              />
            ))}
          </div>
          {items.length > itemsPerPage && (
            <div className="pagination" role="navigation" aria-label="Search results pagination">
              <button
                type="button"
                className="pagination-button"
                onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}
                disabled={safeCurrentPage === 1}
              >
                &lt; Previous
              </button>
              {Array.from({ length: totalPages }, (_, index) => {
                const pageNumber = index + 1;
                return (
                  <button
                    key={pageNumber}
                    type="button"
                    className="pagination-page"
                    onClick={() => setCurrentPage(pageNumber)}
                    aria-current={safeCurrentPage === pageNumber ? "page" : undefined}
                    disabled={safeCurrentPage === pageNumber}
                  >
                    {pageNumber}
                  </button>
                );
              })}
              <button
                type="button"
                className="pagination-button"
                onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))}
                disabled={safeCurrentPage === totalPages}
              >
                Next &gt;
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
