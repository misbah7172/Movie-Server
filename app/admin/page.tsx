"use client";

import { useState, useEffect } from "react";
import { Navbar } from "../../components/layout/Navbar";
import { Movie } from "../../types/database";
import { extractVideoMetadataInBrowser } from "../../lib/video-metadata";
import {
  Film,
  HardDrive,
  UploadCloud,
  Trash2,
  Plus,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";

export default function AdminDashboardPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [stats, setStats] = useState({ totalMovies: 0, totalSizeGB: "0", totalHours: "0" });
  const [loading, setLoading] = useState(true);

  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadYear, setUploadYear] = useState("2024");
  const [movieFile, setMovieFile] = useState<File | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState("");

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [mRes, sRes] = await Promise.all([
        fetch("/api/movies").then((r) => r.json()),
        fetch("/api/admin/stats").then((r) => r.json()),
      ]);
      setMovies(mRes.movies || []);
      if (sRes.stats) {
        setStats({
          totalMovies: sRes.stats.totalMovies,
          totalSizeGB: sRes.stats.totalSizeGB,
          totalHours: sRes.stats.totalHours,
        });
      }
    } catch (err) {
      console.error("Error loading admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMovie = async (id: string) => {
    if (confirm("Are you sure you want to delete this movie from storage?")) {
      await fetch(`/api/admin/stats?id=${id}`, { method: "DELETE" });
      loadAdminData();
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle || !movieFile) {
      alert("Please provide a movie title and select a video file.");
      return;
    }

    setIsUploading(true);
    setUploadStatus("Analyzing video metadata & preparing upload...");

    try {
      const clientMeta = await extractVideoMetadataInBrowser(movieFile);

      setUploadStatus("Uploading to PostgreSQL database & storage...");

      const formData = new FormData();
      formData.append("title", uploadTitle);
      formData.append("description", uploadDescription);
      formData.append("release_year", uploadYear);
      formData.append("releaseYear", uploadYear);
      formData.append("duration", clientMeta.duration.toString());
      formData.append("runtime", clientMeta.runtime.toString());
      formData.append("resolution", clientMeta.resolution);
      formData.append("codec", clientMeta.codec);
      formData.append("aspect_ratio", clientMeta.aspectRatio);

      formData.append("video", movieFile);
      formData.append("movieFile", movieFile);
      if (posterFile) {
        formData.append("poster", posterFile);
        formData.append("posterFile", posterFile);
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUploadStatus("Upload complete! Movie saved to PostgreSQL database.");
        setTimeout(() => {
          setShowUploadModal(false);
          setUploadTitle("");
          setUploadDescription("");
          setMovieFile(null);
          setPosterFile(null);
          setIsUploading(false);
          loadAdminData();
        }, 1200);
      } else {
        alert(data.error || "Upload failed");
        setIsUploading(false);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08080a] text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white uppercase">
              Admin <span className="text-[#E50914]">Dashboard</span>
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Manage your personal media server storage, uploads, and metadata
            </p>
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="px-5 py-3 bg-[#E50914] hover:bg-[#B81D24] text-white font-bold rounded-xl shadow-lg shadow-[#E50914]/40 flex items-center space-x-2 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Upload New Movie</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-zinc-800 flex items-center space-x-4">
            <div className="p-3.5 rounded-xl bg-[#E50914]/20 border border-[#E50914]/40 text-[#E50914]">
              <Film className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase">Total Movies</p>
              <p className="text-2xl font-black text-white">{stats.totalMovies}</p>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-zinc-800 flex items-center space-x-4">
            <div className="p-3.5 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400">
              <HardDrive className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase">Storage Usage</p>
              <p className="text-2xl font-black text-white">{stats.totalSizeGB} GB</p>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-zinc-800 flex items-center space-x-4">
            <div className="p-3.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Clock className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase">Total Runtime</p>
              <p className="text-2xl font-black text-white">{stats.totalHours} Hours</p>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl border border-zinc-800 overflow-hidden">
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Film className="w-5 h-5 text-[#E50914]" />
              <span>Library Movies</span>
            </h3>
            <span className="text-xs text-zinc-400">{movies.length} items</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-900/80 text-xs uppercase text-zinc-400 font-semibold border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Year</th>
                  <th className="px-6 py-4">Resolution</th>
                  <th className="px-6 py-4">Codec</th>
                  <th className="px-6 py-4">File Path</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {movies.map((m) => (
                  <tr key={m.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white flex items-center space-x-3">
                      <img
                        src={m.poster_path || ""}
                        alt={m.title}
                        className="w-8 h-12 object-cover rounded bg-zinc-900"
                      />
                      <span>{m.title}</span>
                    </td>
                    <td className="px-6 py-4">{m.release_year}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-amber-400 text-xs font-bold">
                        {m.resolution}
                      </span>
                    </td>
                    <td className="px-6 py-4">{m.codec}</td>
                    <td className="px-6 py-4 text-xs font-mono text-zinc-400 truncate max-w-xs">
                      {m.movie_path}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleDeleteMovie(m.id)}
                        className="p-2 bg-red-950/60 text-red-400 hover:bg-red-900 rounded-lg transition-colors"
                        title="Delete Movie"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl glass-panel rounded-2xl p-6 sm:p-8 border border-zinc-800 space-y-6"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                <UploadCloud className="w-6 h-6 text-[#E50914]" />
                <span>Upload Movie File</span>
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                  Movie Title *
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Inception 2010"
                  className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:border-[#E50914]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                  Description
                </label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Plot summary..."
                  rows={3}
                  className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:border-[#E50914]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                    Release Year
                  </label>
                  <input
                    type="number"
                    value={uploadYear}
                    onChange={(e) => setUploadYear(e.target.value)}
                    className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                    Poster Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPosterFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-zinc-800 file:text-white hover:file:bg-zinc-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                  Video File (MP4, MKV, WEBM) *
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setMovieFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[#E50914] file:text-white file:font-semibold hover:file:bg-[#B81D24]"
                  required
                />
              </div>

              {uploadStatus && (
                <div className="p-3 rounded-xl bg-zinc-900 border border-amber-500/40 text-amber-300 text-xs font-mono">
                  {uploadStatus}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2 bg-[#E50914] hover:bg-[#B81D24] text-white font-bold rounded-xl text-sm shadow-md"
                >
                  {isUploading ? "Extracting & Saving..." : "Start Upload"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
