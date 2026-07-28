"use client";

import Link from "next/link";
import { WatchHistory } from "@/types/database";
import { Play } from "lucide-react";
import { motion } from "framer-motion";

interface ContinueWatchingCardProps {
  history: WatchHistory;
}

export function ContinueWatchingCard({ history }: ContinueWatchingCardProps) {
  const movie = history.movie;
  if (!movie) return null;

  const percentage = Math.min(100, Math.max(0, history.percentage || 0));
  const remainingMins = Math.max(
    0,
    Math.round(((history.duration_seconds || movie.duration || 7200) - history.progress_seconds) / 60)
  );

  return (
    <motion.div
      whileHover={{ scale: 1.04, y: -4 }}
      className="group relative flex-none w-64 sm:w-72 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg cursor-pointer"
    >
      <Link href={`/watch/${movie.id}?t=${Math.floor(history.progress_seconds)}`}>
        {/* Thumbnail / Backdrop Image */}
        <div className="relative aspect-video w-full bg-zinc-950 overflow-hidden">
          <img
            src={
              movie.backdrop_path ||
              movie.poster_path ||
              "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop"
            }
            alt={movie.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Hover Play Button overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-[#E50914] text-white flex items-center justify-center shadow-lg shadow-[#E50914]/50 transform group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 fill-white ml-0.5" />
            </div>
          </div>

          {/* Progress Bar overlay at bottom of image */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-zinc-800">
            <div
              className="h-full bg-[#E50914] transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Info Footer */}
        <div className="p-3 bg-zinc-900/90 flex items-center justify-between">
          <div className="truncate pr-2">
            <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#E50914] transition-colors">
              {movie.title}
            </h4>
            <p className="text-[11px] text-zinc-400">
              {remainingMins > 0 ? `${remainingMins}m remaining` : "Finished"}
            </p>
          </div>
          <span className="text-[10px] font-bold text-zinc-400 bg-zinc-800 px-2 py-1 rounded">
            {Math.round(percentage)}%
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
