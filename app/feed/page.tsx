"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@/lib/instantdb";
import { MemeCard } from "@/components/MemeCard";
import Link from "next/link";
import { AuthButton } from "@/components/AuthButton";

type SortOption = "upvotes" | "newest" | "oldest";

export default function FeedPage() {
  const [sortBy, setSortBy] = useState<SortOption>("upvotes");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fullscreenMeme, setFullscreenMeme] = useState<any | null>(null);

  const { data, isLoading, error } = useQuery({ memes: {} });

  useEffect(() => {
    if (error) {
      setErrorMessage(error.message || "Failed to load memes.");
    }
  }, [error]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("posted")) {
      setSuccessMessage("Meme posted successfully!");
      params.delete("posted");
      const newUrl = `${window.location.pathname}${
        params.toString() ? `?${params.toString()}` : ""
      }`;
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  const memes = useMemo(() => {
    const list = data?.memes || [];
    if (sortBy === "upvotes") {
      return [...list].sort((a: any, b: any) => (b.upvotes || 0) - (a.upvotes || 0));
    }
    if (sortBy === "oldest") {
      return [...list].sort((a: any, b: any) => a.createdAt - b.createdAt);
    }
    return list;
  }, [data, sortBy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && fullscreenMeme) {
        setFullscreenMeme(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fullscreenMeme]);

  useEffect(() => {
    if (fullscreenMeme) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [fullscreenMeme]);

  return (
    <div className="app-wrapper">
      <nav className="nav-header">
        <div className="nav-links">
          <Link href="/feed" className="nav-link active">
            Browse Memes
          </Link>
          <Link href="/create" className="nav-link">
            Create Meme
          </Link>
        </div>
        <AuthButton />
      </nav>

      <header className="main-header">
        <div className="header-content">
          <div className="logo">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 17L12 22L22 17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12L12 17L22 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h1>Meme Feed</h1>
          </div>
          <p className="tagline">Discover and upvote the best memes</p>
        </div>
      </header>

      <main className="main-content">
        {successMessage && (
          <div className="alert success">
            <p>{successMessage}</p>
            <button onClick={() => setSuccessMessage(null)}>Dismiss</button>
          </div>
        )}
        {errorMessage && (
          <div className="alert error">
            <p>{errorMessage}</p>
            <button onClick={() => setErrorMessage(null)}>Dismiss</button>
          </div>
        )}
        <div className="sort-controls">
          <button
            className={`sort-btn ${sortBy === "upvotes" ? "active" : ""}`}
            onClick={() => setSortBy("upvotes")}
          >
            Most Upvoted
          </button>
          <button
            className={`sort-btn ${sortBy === "newest" ? "active" : ""}`}
            onClick={() => setSortBy("newest")}
          >
            Newest
          </button>
          <button
            className={`sort-btn ${sortBy === "oldest" ? "active" : ""}`}
            onClick={() => setSortBy("oldest")}
          >
            Oldest
          </button>
        </div>

        {isLoading ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
            Loading memes...
          </div>
        ) : memes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
            <p>No memes yet. Be the first to create one!</p>
            <Link href="/create" className="nav-link" style={{ marginTop: "1rem", display: "inline-block" }}>
              Create Meme
            </Link>
          </div>
        ) : (
          <div className="feed-grid">
            {memes.map((meme: any) => (
              <MemeCard 
                key={meme.id} 
                meme={meme} 
                onImageClick={() => setFullscreenMeme(meme)}
              />
            ))}
          </div>
        )}
      </main>

      {fullscreenMeme && (
        <div className="fullscreen-overlay" onClick={() => setFullscreenMeme(null)}>
          <button 
            className="fullscreen-close" 
            onClick={() => setFullscreenMeme(null)}
            aria-label="Close fullscreen view"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div className="fullscreen-content" onClick={(e) => e.stopPropagation()}>
            <img 
              src={fullscreenMeme.imageData} 
              alt="Meme" 
              className="fullscreen-image"
            />
          </div>
        </div>
      )}
    </div>
  );
}


