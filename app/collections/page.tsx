"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { MovieCard } from "@/components/cards/MovieCard";
import { MovieService } from "@/services/movie-service";
import { Collection, Movie } from "@/types/database";
import { Layers } from "lucide-react";

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);

  useEffect(() => {
    async function loadData() {
      const cols = await MovieService.getAllCollections();
      const allMovies = await MovieService.getAllMovies();
      setCollections(cols);
      setMovies(allMovies);
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-[#08080a] text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 space-y-12">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white uppercase flex items-center space-x-3">
            <Layers className="w-8 h-8 text-[#E50914]" />
            <span>Curated <span className="text-[#E50914]">Collections</span></span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Explore themed movie collections and sagas
          </p>
        </div>

        <div className="space-y-10">
          {collections.map((col) => (
            <div key={col.id} className="space-y-4">
              <div className="border-l-4 border-[#E50914] pl-4">
                <h2 className="text-2xl font-bold text-white">{col.name}</h2>
                <p className="text-xs text-zinc-400 mt-1">{col.description}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {movies.map((m) => (
                  <MovieCard key={m.id} movie={m} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
