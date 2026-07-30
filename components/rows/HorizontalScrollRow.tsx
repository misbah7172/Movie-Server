"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MovieCard } from "../cards/MovieCard";
import { Movie } from "../../types/database";
import { motion } from "framer-motion";

interface HorizontalScrollRowProps {
  title: string;
  movies: Movie[];
  subtitle?: string;
}

export function HorizontalScrollRow({ title, movies, subtitle }: HorizontalScrollRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 20);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = direction === "left" ? -clientWidth * 0.75 : clientWidth * 0.75;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (!movies || movies.length === 0) return null;

  return (
    <div className="relative my-8 px-4 sm:px-6 lg:px-8 space-y-3 group">
      {/* Row Section Title */}
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <span>{title}</span>
          </h2>
          {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      {/* Slider Container with Left/Right Arrow Buttons */}
      <div className="relative">
        {/* Left Scroll Control */}
        {showLeftArrow && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-0 bottom-0 z-30 w-12 bg-gradient-to-r from-black/90 to-transparent flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <ChevronLeft className="w-8 h-8 hover:scale-125 transition-transform text-[#E50914]" />
          </button>
        )}

        {/* Scrollable Movies List */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex space-x-4 overflow-x-auto no-scrollbar py-4 px-1 scroll-smooth"
        >
          {movies.map((movie, idx) => (
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
            >
              <MovieCard movie={movie} />
            </motion.div>
          ))}
        </div>

        {/* Right Scroll Control */}
        {showRightArrow && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-0 bottom-0 z-30 w-12 bg-gradient-to-l from-black/90 to-transparent flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <ChevronRight className="w-8 h-8 hover:scale-125 transition-transform text-[#E50914]" />
          </button>
        )}
      </div>
    </div>
  );
}
