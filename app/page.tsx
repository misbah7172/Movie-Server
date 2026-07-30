"use client";

import { useEffect, useState } from "react";
import { Navbar } from "../components/layout/Navbar";
import { HeroBanner } from "../components/hero/HeroBanner";
import { HorizontalScrollRow } from "../components/rows/HorizontalScrollRow";
import { ContinueWatchingCard } from "../components/cards/ContinueWatchingCard";
import { AuthService } from "../lib/auth";
import { Movie, WatchHistory, Collection } from "../types/database";
import { Layers, History, Dices, Film } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [continueWatching, setContinueWatching] = useState<WatchHistory[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [moviesRes, colsRes] = await Promise.all([
          fetch("/api/movies").then((r) => r.json()),
          fetch("/api/collections").then((r) => r.json()),
        ]);

        const allMovies: Movie[] = moviesRes.movies || [];
        const allCols: Collection[] = colsRes.collections || [];

        setMovies(allMovies);
        if (allMovies.length > 0) {
          setFeaturedMovie(allMovies[0]);
        }
        setCollections(allCols);

        const user = AuthService.getCurrentUserSync();
        if (user) {
          const histRes = await fetch(`/api/history?userId=${user.id}`).then((r) => r.json());
          const hist: WatchHistory[] = histRes.history || [];
          const inProgress = hist.filter((h) => !h.completed && h.progress_seconds > 5);
          setContinueWatching(inProgress);
        }
      } catch (err) {
        console.error("Error loading home page data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadHomeData();
  }, []);

  const handleRandomRecommendation = () => {
    if (movies.length > 0) {
      const randomMovie = movies[Math.floor(Math.random() * movies.length)];
      window.location.href = `/movie/${randomMovie.id}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08080a] flex items-center justify-center text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#E50914] border-t-transparent animate-spin" />
          <p className="text-sm font-semibold tracking-wider text-zinc-400">Connecting to PostgreSQL database...</p>
        </div>
      </div>
    );
  }

  const sciFiMovies = movies.filter((m) => m.genres?.some((g) => g.slug === "sci-fi"));
  const actionMovies = movies.filter((m) => m.genres?.some((g) => g.slug === "action"));

  return (
    <div className="min-h-screen bg-[#08080a] text-white">
      <Navbar />

      <HeroBanner movie={featuredMovie} />

      <main className="relative z-20 max-w-7xl mx-auto space-y-8 pb-20 -mt-10 sm:-mt-16">
        {movies.length > 0 && (
          <div className="px-4 sm:px-6 lg:px-8 flex justify-end">
            <button
              onClick={handleRandomRecommendation}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-[#E50914] hover:from-amber-600 hover:to-[#B81D24] text-white font-bold text-xs rounded-full shadow-lg flex items-center space-x-2 transition-transform transform hover:scale-105"
            >
              <Dices className="w-4 h-4" />
              <span>Random Pick</span>
            </button>
          </div>
        )}

        {continueWatching.length > 0 && (
          <div className="px-4 sm:px-6 lg:px-8 space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
              <History className="w-6 h-6 text-[#E50914]" />
              <span>Continue Watching</span>
            </h2>
            <div className="flex space-x-4 overflow-x-auto no-scrollbar py-2">
              {continueWatching.map((item) => (
                <ContinueWatchingCard key={item.id} history={item} />
              ))}
            </div>
          </div>
        )}

        {movies.length > 0 ? (
          <>
            <HorizontalScrollRow
              title="Recently Added"
              subtitle="Latest media in PostgreSQL storage"
              movies={movies}
            />

            {collections.length > 0 && (
              <div className="px-4 sm:px-6 lg:px-8 space-y-4 my-8">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
                  <Layers className="w-6 h-6 text-[#E50914]" />
                  <span>Curated Collections</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {collections.map((col) => (
                    <Link
                      key={col.id}
                      href={`/collections?col=${col.slug}`}
                      className="group relative h-40 rounded-2xl overflow-hidden glass-panel border border-zinc-800 p-6 flex flex-col justify-end"
                    >
                      <img
                        src={col.cover_path || ""}
                        alt={col.name}
                        className="absolute inset-0 w-full h-full object-cover filter brightness-50 group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                      <div className="relative z-10">
                        <h3 className="text-lg font-extrabold text-white group-hover:text-[#E50914] transition-colors">
                          {col.name}
                        </h3>
                        <p className="text-xs text-zinc-300 mt-1">{col.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {sciFiMovies.length > 0 && (
              <HorizontalScrollRow
                title="Sci-Fi & Space Exploration"
                subtitle="Futuristic sagas & space odysseys"
                movies={sciFiMovies}
              />
            )}

            {actionMovies.length > 0 && (
              <HorizontalScrollRow
                title="High-Octane Action"
                subtitle="Thrillers, battles & heists"
                movies={actionMovies}
              />
            )}
          </>
        ) : (
          <div className="px-4 sm:px-6 lg:px-8 py-12 text-center glass-panel rounded-2xl border border-zinc-800 max-w-2xl mx-auto space-y-3">
            <Film className="w-12 h-12 text-zinc-600 mx-auto" />
            <h3 className="text-xl font-bold text-white">PostgreSQL Database Empty</h3>
            <p className="text-sm text-zinc-400">
              No movies currently in database. Upload movies via Admin Dashboard to start streaming!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
