"use client";

import { useState } from "react";
import { Navbar } from "../../components/layout/navbar";
import { Settings, Database } from "lucide-react";

export default function SettingsPage() {
  const [autoplay, setAutoplay] = useState(true);
  const [subtitleLang, setSubtitleLang] = useState("en");
  const [playbackSpeed, setPlaybackSpeed] = useState("1");
  const [storageProvider, setStorageProvider] = useState("Supabase PostgreSQL & Cloud Storage");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#08080a] text-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white uppercase flex items-center space-x-3">
            <Settings className="w-8 h-8 text-[#E50914]" />
            <span>Platform <span className="text-[#E50914]">Settings</span></span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Configure player behavior, default subtitles, and cloud database storage
          </p>
        </div>

        <form onSubmit={handleSave} className="glass-panel p-8 rounded-2xl border border-zinc-800 space-y-6">
          <div className="flex items-center justify-between py-3 border-b border-zinc-800">
            <div>
              <p className="font-bold text-white text-sm">Autoplay Videos</p>
              <p className="text-xs text-zinc-400">Automatically play stream when opening video player</p>
            </div>
            <input
              type="checkbox"
              checked={autoplay}
              onChange={(e) => setAutoplay(e.target.checked)}
              className="w-5 h-5 accent-[#E50914] cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-zinc-800">
            <div>
              <p className="font-bold text-white text-sm">Default Subtitle Language</p>
              <p className="text-xs text-zinc-400">Preferred subtitle track on playback launch</p>
            </div>
            <select
              value={subtitleLang}
              onChange={(e) => setSubtitleLang(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2 text-xs"
            >
              <option value="en">English [CC]</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="off">Off by Default</option>
            </select>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-zinc-800">
            <div>
              <p className="font-bold text-white text-sm">Default Playback Speed</p>
              <p className="text-xs text-zinc-400">Remember preferred playback rate</p>
            </div>
            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2 text-xs"
            >
              <option value="0.75">0.75x</option>
              <option value="1">1.0x (Normal)</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
            </select>
          </div>

          <div className="py-3 border-b border-zinc-800 space-y-2">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-[#E50914]" />
              <p className="font-bold text-white text-sm">Media Storage Engine</p>
            </div>
            <p className="text-xs text-zinc-400">Cloud database and bucket storage for video streams and poster assets</p>
            <input
              type="text"
              value={storageProvider}
              onChange={(e) => setStorageProvider(e.target.value)}
              className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-mono text-white"
            />
          </div>

          {saved && (
            <div className="p-3 rounded-xl bg-green-950/60 border border-green-500/50 text-green-300 text-xs font-semibold text-center">
              Settings updated successfully!
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-[#E50914] hover:bg-[#B81D24] text-white font-bold rounded-xl shadow-lg shadow-[#E50914]/40"
            >
              Save Preferences
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
