"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { ContinueWatchingCard } from "@/components/cards/ContinueWatchingCard";
import { MovieService } from "@/services/movie-service";
import { AuthService } from "@/lib/auth";
import { WatchHistory } from "@/types/database";
import { History, Trash2 } from "lucide-react";

export default function WatchHistoryPage() {
  const [history, setHistory] = useState<WatchHistory[]>([]);

  useEffect(() => {
    async function loadHist() {
      const user = AuthService.getCurrentUserSync();
      if (user) {
        const h = await MovieService.getUserWatchHistory(user.id);
        setHistory(h);
      }
    }
    loadHist();
  }, []);

  return (
    <div className="min-h-screen bg-[#08080a] text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white uppercase flex items-center space-x-3">
              <History className="w-8 h-8 text-[#E50914]" />
              <span>Watch <span className="text-[#E50914]">History</span></span>
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Playback progress and recently watched movies
            </p>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="p-16 text-center glass-panel rounded-2xl border border-zinc-800 space-y-3">
            <History className="w-12 h-12 text-zinc-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">No watch history recorded</h3>
            <p className="text-sm text-zinc-400">Stream a movie to automatically save your playback progress.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {history.map((h) => (
              <ContinueWatchingCard key={h.id} history={h} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
