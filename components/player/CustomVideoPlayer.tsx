"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Movie, Subtitle } from "../../types/database";
import { AuthService } from "../../lib/auth";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  PictureInPicture2,
  Subtitles,
  Settings,
  ArrowLeft,
  SlidersHorizontal,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CustomVideoPlayerProps {
  movie: Movie;
  initialTime?: number;
}

export function CustomVideoPlayer({ movie, initialTime = 0 }: CustomVideoPlayerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(movie.duration || 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>("off");
  const [selectedAudio, setSelectedAudio] = useState<string>("eng");
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [showAudioMenu, setShowAudioMenu] = useState(false);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync initial playback position from URL ?t= param or saved history
  useEffect(() => {
    const urlTime = searchParams.get("t");
    const startTime = urlTime ? parseFloat(urlTime) : initialTime;

    if (videoRef.current && startTime > 0) {
      videoRef.current.currentTime = startTime;
      setCurrentTime(startTime);
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
      videoRef.current.play();
      setIsPlaying(true);
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
      videoRef.current.volume = volume || 0.8;
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const handleSpeedChange = (speed: number) => {
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
        onTimeUpdate={() => {
          if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (videoRef.current) setDuration(videoRef.current.duration);
        }}
        onEnded={() => setIsPlaying(false)}
        playsInline
      />

      {/* Top Header Bar (Back button & Title) */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/90 via-black/40 to-transparent z-40 flex items-center justify-between"
          >
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-3 text-zinc-200 hover:text-[#E50914] transition-colors"
            >
              <div className="p-2.5 rounded-full glass-panel">
                <ArrowLeft className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-wide">{movie.title}</h2>
                <p className="text-xs text-zinc-400">
                  {movie.resolution} • {movie.codec} • {movie.release_year}
                </p>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Floating Control Bar */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 bg-gradient-to-t from-black/95 via-black/60 to-transparent z-40 space-y-4"
          >
            {/* Range Seek Scrub Slider */}
            <div className="relative group">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-zinc-700/60 rounded-lg appearance-none cursor-pointer accent-[#E50914] focus:outline-none"
              />
              <div className="flex justify-between text-xs text-zinc-400 mt-1 font-mono">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls Bar Row */}
            <div className="flex items-center justify-between">
              {/* Left Play/Pause/Skip Controls */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={togglePlay}
                  className="p-3 bg-[#E50914] hover:bg-[#B81D24] text-white rounded-full shadow-lg shadow-[#E50914]/50 transition-transform transform active:scale-95"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 fill-white" />
                  ) : (
                    <Play className="w-6 h-6 fill-white ml-0.5" />
                  )}
                </button>

                <button
                  onClick={() => skip(-10)}
                  className="p-2 text-zinc-300 hover:text-white transition-colors"
                  title="Skip -10s"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                <button
                  onClick={() => skip(10)}
                  className="p-2 text-zinc-300 hover:text-white transition-colors"
                  title="Skip +10s"
                >
                  <RotateCw className="w-5 h-5" />
                </button>

                {/* Volume Slider */}
                <div className="flex items-center space-x-2 group">
                  <button onClick={toggleMute} className="p-2 text-zinc-300 hover:text-white">
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-5 h-5 text-red-500" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => changeVolume(parseFloat(e.target.value))}
                    className="w-20 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#E50914]"
                  />
                </div>
              </div>

              {/* Right Menu & Feature Buttons */}
              <div className="flex items-center space-x-4 relative">
                {/* Speed Selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                    className="px-2.5 py-1 text-xs font-bold text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-700 rounded-md"
                  >
                    {playbackSpeed}x
                  </button>
                  {showSpeedMenu && (
                    <div className="absolute bottom-10 right-0 w-28 glass-panel rounded-xl py-1 text-xs z-50">
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                        <button
                          key={s}
                          onClick={() => handleSpeedChange(s)}
                          className={`w-full px-3 py-1.5 text-left hover:bg-[#E50914] hover:text-white ${
                            playbackSpeed === s ? "text-[#E50914] font-bold" : "text-zinc-300"
                          }`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Subtitle Selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowSubtitleMenu(!showSubtitleMenu)}
                    className="p-2 text-zinc-300 hover:text-white"
                    title="Subtitles"
                  >
                    <Subtitles className="w-5 h-5" />
                  </button>
                  {showSubtitleMenu && (
                    <div className="absolute bottom-10 right-0 w-36 glass-panel rounded-xl py-1 text-xs z-50">
                      <button
                        onClick={() => {
                          setSelectedSubtitle("off");
                          setShowSubtitleMenu(false);
                        }}
                        className="w-full px-3 py-1.5 text-left text-zinc-300 hover:bg-[#E50914]"
                      >
                        Off
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSubtitle("en");
                          setShowSubtitleMenu(false);
                        }}
                        className="w-full px-3 py-1.5 text-left text-zinc-300 hover:bg-[#E50914]"
                      >
                        English [CC]
                      </button>
                    </div>
                  )}
                </div>

                {/* PiP */}
                <button onClick={togglePiP} className="p-2 text-zinc-300 hover:text-white" title="Picture in Picture">
                  <PictureInPicture2 className="w-5 h-5" />
                </button>

                {/* Fullscreen */}
                <button onClick={toggleFullscreen} className="p-2 text-zinc-300 hover:text-white" title="Fullscreen">
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
