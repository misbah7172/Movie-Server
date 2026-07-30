"use client";

import { useState, useEffect } from "react";
import { Navbar } from "../../components/layout/Navbar";
import { MovieCard } from "../../components/cards/MovieCard";
import { Movie, Genre } from "../../types/database";
import { Film, Filter, ArrowUpDown } from "lucide-react";

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedResolution, setSelectedResolution] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [mRes, gRes] = await Promise.all([
          fetch("/api/movies").then((r) => r.json()),
          fetch("/api/genres").then((r) => r.json()),
        ]);
        setMovies(mRes.movies || []);
        setGenres(gRes.genres || []);
      } catch (err) {
        console.error("Error loading movies page data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredMovies = movies
    .filter((m) => {
      const matchGenre =
        selectedGenre === "all" || m.genres?.some((g) => g.slug === selectedGenre || g.id === selectedGenre);
      const matchRes =
        selectedResolution === "all" || m.resolution.toLowerCase().includes(selectedResolution.toLowerCase());
      const matchYear = selectedYear === "all" || m.release_year === parseInt(selectedYear, 10);
      return matchGenre && matchRes && matchYear;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return (b.release_year || 0) - (a.release_year || 0);
      if (sortBy === "oldest") return (a.release_year || 0) - (b.release_year || 0);
      if (sortBy === "alpha") return a.title.localeCompare(b.title);
      if (sortBy === "rating") return (b.rating_average || 0) - (a.rating_average || 0);
      return 0;
    });

  return (
    <div className="min-h-screen bg-[#08080a] text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white uppercase flex items-center space-x-3">
              <Film className="w-8 h-8 text-[#E50914]" />
              <span>Movie <span className="text-[#E50914]">Catalog</span></span>
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Browse and stream your entire personal movie library
            </p>
          </div>
          <span className="text-xs text-zinc-400 font-medium bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 self-start sm:self-auto">
            Showing {filteredMovies.length} of {movies.length} movies
          </span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-zinc-800 flex flex-wrap items-center gap-4 text-xs font-medium">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-[#E50914]" />
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-[#E50914]"
            >
              <option value="all">All Genres</option>
              {genres.map((g) => (
                <option key={g.id} value={g.slug}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={selectedResolution}
              onChange={(e) => setSelectedResolution(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-[#E50914]"
            >
              <option value="all">All Resolutions</option>
              <option value="4k">4K Ultra HD</option>
              <option value="1080p">1080p Full HD</option>
              <option value="720p">720p HD</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-[#E50914]"
            >
              <option value="all">All Release Years</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 ml-auto">
            <ArrowUpDown className="w-4 h-4 text-zinc-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-[#E50914]"
            >
              <option value="newest">Sort: Release Year (Newest)</option>
              <option value="oldest">Sort: Release Year (Oldest)</option>
              <option value="alpha">Sort: Alphabetical (A-Z)</option>
              <option value="rating">Sort: Highest Rating</option>
            </select>
          </div>
        </div>

        {filteredMovies.length === 0 ? (
          <div className="p-12 text-center glass-panel rounded-2xl border border-zinc-800">
            <p className="text-zinc-400 text-base">No movies found matching selected filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {filteredMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
