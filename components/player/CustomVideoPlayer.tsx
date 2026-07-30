"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Movie, Subtitle } from "../../types/database";
import { AuthService } from "../../lib/auth";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ArrowLeft,
  Settings,
  Subtitles,
  RotateCcw,
  RotateCw,
  PictureInPicture,
  Film,
  UploadCloud,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface CustomVideoPlayerProps {
  movie: Movie;
}

export function CustomVideoPlayer({ movie }: CustomVideoPlayerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTime = parseFloat(searchParams.get("t") || "0");

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(movie.duration || 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [hasError, setHasError] = useState(false);

  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [showAudioMenu, setShowAudioMenu] = useState(false);

  const [subtitles, setSubtitles] = useState<Subtitle[]>(movie.subtitles || []);
  const [activeSubtitle, setActiveSubtitle] = useState<string | null>(null);

  // Resume playback from initial timestamp parameter
  useEffect(() => {
    if (videoRef.current && initialTime > 0) {
      videoRef.current.currentTime = initialTime;
    }
  }, [searchParams, initialTime]);

  // Auto hide controls on mouse inactivity
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowSpeedMenu(false);
        setShowSubtitleMenu(false);
        setShowAudioMenu(false);
      }
    }, 3500);
  }, [isPlaying]);

  // Save progress to watch history periodically (every 5 seconds)
  useEffect(() => {
    const user = AuthService.getCurrentUserSync();
    if (!user) return;

    const interval = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) {
        const curr = videoRef.current.currentTime;
        const dur = videoRef.current.duration || duration;
        if (curr > 2) {
          fetch("/api/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              movieId: movie.id,
              progressSeconds: curr,
              durationSeconds: dur,
            }),
          }).catch(console.error);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [movie.id, duration]);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "arrowleft":
        case "j":
          e.preventDefault();
          skip(-10);
          break;
        case "arrowright":
        case "l":
          e.preventDefault();
          skip(10);
          break;
        case "arrowup":
          e.preventDefault();
          changeVolume(Math.min(1, volume + 0.1));
          break;
        case "arrowdown":
          e.preventDefault();
          changeVolume(Math.max(0, volume - 0.1));
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, volume]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        setHasError(false);
      }).catch((err) => {
        console.warn("Playback error:", err);
        setHasError(true);
        setIsPlaying(false);
      });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const skip = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(
      videoRef.current.duration || 0,
      Math.max(0, videoRef.current.currentTime + seconds)
    );
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const changeVolume = (newVol: number) => {
    if (!videoRef.current) return;
    videoRef.current.volume = newVol;
    setVolume(newVol);
    setIsMuted(newVol === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const changePlaybackSpeed = (speed: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error("PiP Error:", err);
    }
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
    }
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full h-screen bg-black overflow-hidden select-none flex items-center justify-center"
    >
      {/* HTML5 Video Element streaming via HTTP Range Endpoint */}
      <video
        ref={videoRef}
        src={`/api/stream/${movie.id}`}
        className="w-full h-full object-contain cursor-pointer"
        onClick={togglePlay}
        onError={() => setHasError(true)}
        onTimeUpdate={() => {
          if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (videoRef.current) setDuration(videoRef.current.duration);
        }}
        onEnded={() => setIsPlaying(false)}
        playsInline
      />

      {/* Media Stream Unavailable Overlay */}
      {hasError && (
        <div className="absolute inset-0 bg-black/95 z-40 flex flex-col items-center justify-center p-6 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-400 flex items-center justify-center shadow-2xl">
            <Film className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-white uppercase tracking-tight">
            Media Stream Unavailable
          </h2>
          <p className="text-sm text-zinc-400 max-w-md leading-relaxed">
            The video binary for <span className="text-white font-semibold">&quot;{movie.title}&quot;</span> was not found in PostgreSQL database storage. Please re-upload this movie file in the Admin Dashboard.
          </p>
          <div className="flex items-center space-x-4 pt-2">
            <button
              onClick={() => router.back()}
              className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs rounded-xl"
            >
              Back to Catalog
            </button>
            <Link
              href="/admin"
              className="px-5 py-2.5 bg-[#E50914] hover:bg-[#B81D24] text-white font-bold text-xs rounded-xl shadow-lg shadow-[#E50914]/40 flex items-center space-x-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Go to Admin Upload</span>
            </Link>
          </div>
        </div>
      )}

      {/* Top Header Bar (Back button & Title) */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex items-center justify-between z-30"
          >
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-white hover:text-[#E50914] transition-colors group"
            >
              <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-semibold uppercase tracking-wider">Back</span>
            </button>

            <div className="text-center">
              <h2 className="text-lg font-bold text-white tracking-wide uppercase">{movie.title}</h2>
              <p className="text-xs text-zinc-400 font-medium">
                {movie.resolution} • {movie.codec} • {movie.language}
              </p>
            </div>

            <div className="w-20" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player Control Overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent space-y-3 z-30"
          >
            {/* Timeline Progress Scrub Bar */}
            <div className="relative group flex items-center">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-zinc-700/80 rounded-lg appearance-none cursor-pointer accent-[#E50914] focus:outline-none group-hover:h-2.5 transition-all"
              />
              <div
                className="absolute left-0 h-1.5 group-hover:h-2.5 bg-[#E50914] rounded-lg pointer-events-none transition-all"
                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
              />
            </div>

            {/* Controls Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Play / Pause Toggle */}
                <button
                  onClick={togglePlay}
                  className="p-2 text-white hover:text-[#E50914] transition-colors transform hover:scale-110"
                >
                  {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current" />}
                </button>

                {/* Skip Buttons */}
                <button onClick={() => skip(-10)} className="text-zinc-300 hover:text-white transition-colors" title="Rewind 10s">
                  <RotateCcw className="w-5 h-5" />
                </button>
                <button onClick={() => skip(10)} className="text-zinc-300 hover:text-white transition-colors" title="Forward 10s">
                  <RotateCw className="w-5 h-5" />
                </button>

                {/* Volume Slider */}
                <div className="flex items-center space-x-2 group">
                  <button onClick={toggleMute} className="text-zinc-300 hover:text-white">
                    {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => changeVolume(parseFloat(e.target.value))}
                    className="w-16 h-1 bg-zinc-700 rounded appearance-none accent-[#E50914] cursor-pointer"
                  />
                </div>

                {/* Time Display */}
                <div className="text-xs font-mono text-zinc-300">
                  <span>{formatTime(currentTime)}</span>
                  <span className="text-zinc-500 mx-1">/</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 relative">
                {/* Speed Selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                    className="px-2 py-1 bg-zinc-800/80 hover:bg-zinc-700 rounded text-xs font-bold text-zinc-300"
                  >
                    {playbackSpeed}x
                  </button>
                  {showSpeedMenu && (
                    <div className="absolute bottom-10 right-0 bg-zinc-900 border border-zinc-700 rounded-xl p-2 space-y-1 w-24 shadow-2xl z-50">
                      {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((s) => (
                        <button
                          key={s}
                          onClick={() => changePlaybackSpeed(s)}
                          className={`w-full text-left px-3 py-1.5 rounded text-xs font-semibold ${
                            playbackSpeed === s ? "bg-[#E50914] text-white" : "text-zinc-300 hover:bg-zinc-800"
                          }`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Picture in Picture */}
                <button onClick={togglePiP} className="text-zinc-300 hover:text-white" title="Picture in Picture">
                  <PictureInPicture className="w-5 h-5" />
                </button>

                {/* Fullscreen Toggle */}
                <button onClick={toggleFullscreen} className="text-zinc-300 hover:text-white" title="Toggle Fullscreen">
                  {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
