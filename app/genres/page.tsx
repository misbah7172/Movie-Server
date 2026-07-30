"use client";

import { useEffect, useState } from "react";
import { Navbar } from "../../components/layout/Navbar";
import { MovieCard } from "../../components/cards/MovieCard";
import { Genre, Movie } from "../../types/database";
import { Grid } from "lucide-react";

export default function GenresPage() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>("sci-fi");

  useEffect(() => {
    async function loadData() {
      try {
        const [gRes, mRes] = await Promise.all([
          fetch("/api/genres").then((r) => r.json()),
          fetch("/api/movies").then((r) => r.json()),
        ]);
        const gList: Genre[] = gRes.genres || [];
        setGenres(gList);
        setMovies(mRes.movies || []);
        if (gList.length > 0) setSelectedGenre(gList[0].slug);
      } catch (err) {
        console.error("Error loading genres:", err);
      }
    }
    loadData();
  }, []);

  const genreMovies = movies.filter((m) =>
    m.genres?.some((g) => g.slug === selectedGenre || g.id === selectedGenre)
  );

  return (
    <div className="min-h-screen bg-[#08080a] text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white uppercase flex items-center space-x-3">
            <Grid className="w-8 h-8 text-[#E50914]" />
            <span>Movie <span className="text-[#E50914]">Genres</span></span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Filter movies by genre category
          </p>
        </div>

        <div className="flex flex-wrap gap-2 py-2">
          {genres.map((g) => {
            const active = selectedGenre === g.slug;
            return (
              <button
                key={g.id}
                onClick={() => setSelectedGenre(g.slug)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? "bg-[#E50914] text-white shadow-lg shadow-[#E50914]/40"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800"
                }`}
              >
                {g.name}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {genreMovies.map((m) => (
            <MovieCard key={m.id} movie={m} />
          ))}
        </div>
      </main>
    </div>
  );
}
