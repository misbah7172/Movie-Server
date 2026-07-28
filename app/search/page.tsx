"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { MovieCard } from "@/components/cards/MovieCard";
import { MovieService } from "@/services/movie-service";
import { Movie } from "@/types/database";
import { Search, Film, Sparkles } from "lucide-react";

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function performSearch() {
      setLoading(true);
      const res = await MovieService.searchMovies(query);
      setResults(res);
      setLoading(false);
    }

    const timer = setTimeout(performSearch, 200);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 space-y-8">
      {/* Search Input Box */}
      <div className="relative max-w-2xl mx-auto">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, actor, director, genre, year..."
          className="w-full pl-12 pr-4 py-4 bg-zinc-900/90 border border-zinc-700 rounded-2xl text-white placeholder-zinc-400 focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] text-lg shadow-xl transition-all"
          autoFocus
        />
        <Search className="w-6 h-6 text-zinc-400 absolute left-4 top-4.5" />
      </div>

      {/* Search Results Summary */}
      <div className="flex items-center justify-between text-sm text-zinc-400 border-b border-zinc-800 pb-3">
        <span>
          {query ? `Search results for "${query}"` : "All Library Movies"}
        </span>
        <span>{results.length} movies found</span>
      </div>

      {/* Grid Results */}
      {loading ? (
        <div className="p-12 text-center text-zinc-400">Searching library...</div>
      ) : results.length === 0 ? (
        <div className="p-16 text-center glass-panel rounded-2xl border border-zinc-800 space-y-3">
          <Film className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No movies found</h3>
          <p className="text-sm text-zinc-400">Try adjusting your search terms or keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {results.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </main>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-[#08080a] text-white">
      <Navbar />
      <Suspense fallback={<div className="pt-28 text-center text-zinc-400">Loading search...</div>}>
        <SearchContent />
      </Suspense>
    </div>
  );
}
