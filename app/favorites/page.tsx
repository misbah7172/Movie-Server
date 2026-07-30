"use client";

import { useEffect, useState } from "react";
import { Navbar } from "../../components/layout/Navbar";
import { MovieCard } from "../../components/cards/MovieCard";
import { Movie } from "../../types/database";
import { Heart } from "lucide-react";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Movie[]>([]);

  useEffect(() => {
    async function loadFavs() {
      try {
        const res = await fetch("/api/movies").then((r) => r.json());
        const all: Movie[] = res.movies || [];
        setFavorites(all.slice(0, 2));
      } catch (err) {
        console.error("Error loading favorites:", err);
      }
    }
    loadFavs();
  }, []);

  return (
    <div className="min-h-screen bg-[#08080a] text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white uppercase flex items-center space-x-3">
            <Heart className="w-8 h-8 text-[#E50914] fill-[#E50914]" />
            <span>My <span className="text-[#E50914]">Favorites</span></span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Your bookmarked personal movie collection
          </p>
        </div>

        {favorites.length === 0 ? (
          <div className="p-16 text-center glass-panel rounded-2xl border border-zinc-800 space-y-3">
            <Heart className="w-12 h-12 text-zinc-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">No favorite movies added yet</h3>
            <p className="text-sm text-zinc-400">Click the heart icon on any movie card to add it here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {favorites.map((m) => (
              <MovieCard key={m.id} movie={m} isFavorite={true} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
