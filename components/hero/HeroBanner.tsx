"use client";

import { useState } from "react";
import Link from "next/link";
import { Movie } from "../../types/database";
import { Play, Info, Star, Volume2, VolumeX, UploadCloud } from "lucide-react";
import { motion } from "framer-motion";

interface HeroBannerProps {
  movie?: Movie | null;
}

export function HeroBanner({ movie }: HeroBannerProps) {
  const [muted, setMuted] = useState(true);

  if (!movie) {
    return (
      <div className="relative w-full h-[60vh] min-h-[400px] overflow-hidden bg-[#08080a] flex items-center justify-center border-b border-zinc-800">
        <div className="relative z-10 max-w-xl text-center px-4 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#E50914]/20 border border-[#E50914]/40 text-[#E50914] flex items-center justify-center mx-auto shadow-xl">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tight">
            Welcome to <span className="text-[#E50914]">CineStream</span>
          </h2>
          <p className="text-sm text-zinc-400">
            Your personal PostgreSQL-backed movie streaming server. Upload legally owned movies via the Admin Dashboard to build your library.
          </p>
          <Link
            href="/admin"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-[#E50914] hover:bg-[#B81D24] text-white font-bold text-sm rounded-xl shadow-lg shadow-[#E50914]/40 transition-all"
          >
            <span>Go to Admin Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[75vh] sm:h-[85vh] min-h-[500px] overflow-hidden bg-[#08080a]">
      <div className="absolute inset-0 w-full h-full">
        <img
          src={
            movie.backdrop_path ||
            movie.poster_path ||
            "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1920&auto=format&fit=crop"
          }
          alt={movie.title}
          className="w-full h-full object-cover object-center filter brightness-90 transform scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 hero-vignette" />
        <div className="absolute inset-0 hero-vignette-left" />
      </div>

      <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-16 sm:pb-24 z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-2xl space-y-4 sm:space-y-5"
        >
          <div className="flex items-center space-x-3 text-xs sm:text-sm font-semibold text-zinc-300">
            <span className="px-2.5 py-1 rounded-md bg-[#E50914] text-white text-xs font-black tracking-wider uppercase shadow-md shadow-[#E50914]/40">
              Featured Stream
            </span>
            <span className="flex items-center space-x-1 text-amber-400">
              <Star className="w-4 h-4 fill-amber-400" />
              <span>{movie.rating_average || 4.8}</span>
            </span>
            <span className="text-zinc-400">{movie.release_year || 2024}</span>
            <span className="px-2 py-0.5 border border-zinc-600 rounded text-xs text-zinc-300">
              {movie.resolution || "1080p"}
            </span>
            <span className="text-zinc-400">{movie.runtime ? `${movie.runtime} mins` : "120 mins"}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-lg uppercase leading-none">
            {movie.title}
          </h1>

          <p className="text-sm sm:text-base text-zinc-300 line-clamp-3 leading-relaxed drop-shadow">
            {movie.description}
          </p>

          <div className="flex items-center space-x-4 pt-2">
            <Link
              href={`/watch/${movie.id}`}
              className="px-6 py-3.5 bg-[#E50914] hover:bg-[#B81D24] text-white font-bold text-sm sm:text-base rounded-xl shadow-xl shadow-[#E50914]/40 hover:shadow-[#E50914]/60 transition-all flex items-center space-x-2 transform hover:scale-105"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Play Now</span>
            </Link>

            <Link
              href={`/movie/${movie.id}`}
              className="px-6 py-3.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 text-white font-semibold text-sm sm:text-base rounded-xl backdrop-blur-md transition-all flex items-center space-x-2"
            >
              <Info className="w-5 h-5" />
              <span>More Info</span>
            </Link>
          </div>
        </motion.div>

        <div className="absolute right-4 sm:right-8 bottom-16 sm:bottom-24 flex items-center space-x-3">
          <button
            onClick={() => setMuted(!muted)}
            className="p-3 rounded-full glass-panel text-white hover:bg-white/20 transition-all"
          >
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
