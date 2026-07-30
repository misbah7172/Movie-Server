"use client";

import { useState } from "react";
import Link from "next/link";
import { Movie } from "../../types/database";
import { Play, Heart, Star, Clock, Info } from "lucide-react";
import { motion } from "framer-motion";

interface MovieCardProps {
  movie: Movie;
  onFavoriteToggle?: (id: string) => void;
  isFavorite?: boolean;
}

export function MovieCard({ movie, onFavoriteToggle, isFavorite = false }: MovieCardProps) {
  const [hovered, setHovered] = useState(false);
  const [fav, setFav] = useState(isFavorite);

  const handleFavClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFav(!fav);
    if (onFavoriteToggle) {
      onFavoriteToggle(movie.id);
    }
  };

  return (
    <motion.div
      className="group relative flex-none w-44 sm:w-52 lg:w-60 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/80 shadow-lg cursor-pointer transition-all duration-300"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ y: -6, scale: 1.03 }}
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-950">
        <img
          src={
            movie.poster_path ||
            "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop"
          }
          alt={movie.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Quality Badge (4K / 1080p) */}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-bold text-amber-400 tracking-wide uppercase">
          {movie.resolution || "1080p"}
        </div>

        {/* Favorite Action Button */}
        <button
          onClick={handleFavClick}
          className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-md transition-all ${
            fav
              ? "bg-[#E50914] text-white shadow-md shadow-[#E50914]/50"
              : "bg-black/60 text-zinc-300 hover:text-white hover:bg-black/90"
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${fav ? "fill-white" : ""}`} />
        </button>

        {/* Hover Action Overlay */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-4 transition-opacity duration-300 ${
            hovered ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="flex items-center space-x-2 mb-3">
            <Link
              href={`/watch/${movie.id}`}
              className="flex-1 py-2 px-3 bg-[#E50914] hover:bg-[#B81D24] text-white text-xs font-bold rounded-lg flex items-center justify-center space-x-1 shadow-md shadow-[#E50914]/40"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Stream</span>
            </Link>
            <Link
              href={`/movie/${movie.id}`}
              className="p-2 bg-zinc-800/90 hover:bg-zinc-700 text-white rounded-lg"
            >
              <Info className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-300">
            <span className="flex items-center space-x-1 text-amber-400 font-semibold">
              <Star className="w-3 h-3 fill-amber-400" />
              <span>{movie.rating_average || 4.5}</span>
            </span>
            <span className="flex items-center space-x-1 text-zinc-400">
              <Clock className="w-3 h-3" />
              <span>{movie.runtime ? `${movie.runtime}m` : "120m"}</span>
            </span>
            <span className="text-zinc-400 font-medium">{movie.release_year || 2024}</span>
          </div>
        </div>
      </div>

      {/* Card Footer Details */}
      <div className="p-3 bg-zinc-900/90">
        <h3 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#E50914] transition-colors">
          {movie.title}
        </h3>
        <p className="text-[11px] text-zinc-400 truncate mt-0.5">
          {movie.genres?.map((g) => g.name).join(" • ") || movie.language || "English"}
        </p>
      </div>
    </motion.div>
  );
}
