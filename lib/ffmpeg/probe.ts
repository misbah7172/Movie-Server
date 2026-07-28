import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "ffmpeg-static";
import ffprobeInstaller from "ffprobe-static";
import fs from "fs";
import path from "path";

// Configure ffmpeg and ffprobe paths if static binaries exist
if (ffmpegInstaller) {
  ffmpeg.setFfmpegPath(ffmpegInstaller);
}
if (ffprobeInstaller?.path) {
  ffmpeg.setFfprobePath(ffprobeInstaller.path);
}

export interface ExtractedMetadata {
  duration: number; // seconds
  runtime: number; // minutes
  resolution: string; // e.g. "4K 2160p", "1080p", "720p"
  codec: string;
  bitrate: number;
  fps: number;
  aspectRatio: string;
  audioTracks: { index: number; language: string; codec: string; channels: number }[];
  subtitleTracks: { index: number; language: string; title: string }[];
}

export async function extractMediaMetadata(filePath: string): Promise<ExtractedMetadata> {
  return new Promise((resolve) => {
    // Default safe fallback if ffprobe fails or file cannot be probed
    const fallbackStats = fs.existsSync(filePath) ? fs.statSync(filePath) : null;
    const estimatedSizeBytes = fallbackStats ? fallbackStats.size : 0;

    const fallback: ExtractedMetadata = {
      duration: 7200, // 2 hours default fallback
      runtime: 120,
      resolution: "1080p Full HD",
      codec: "H.264",
      bitrate: Math.round((estimatedSizeBytes * 8) / 7200),
      fps: 24,
      aspectRatio: "16:9",
      audioTracks: [{ index: 0, language: "eng", codec: "aac", channels: 2 }],
      subtitleTracks: [],
    };

    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err || !metadata) {
        console.warn("ffprobe fallback used:", err?.message);
        return resolve(fallback);
      }

      const videoStream = metadata.streams.find((s) => s.codec_type === "video");
      const audioStreams = metadata.streams.filter((s) => s.codec_type === "audio");
      const subtitleStreams = metadata.streams.filter((s) => s.codec_type === "subtitle");

      const duration = metadata.format.duration || fallback.duration;
      const width = videoStream?.width || 1920;
      const height = videoStream?.height || 1080;

      let resolution = "1080p Full HD";
      if (width >= 3840 || height >= 2160) resolution = "4K 2160p";
      else if (width >= 2560 || height >= 1440) resolution = "2K 1440p";
      else if (width >= 1280 || height >= 720) resolution = "720p HD";

      let codec = (videoStream?.codec_name || "h264").toUpperCase();
      if (codec === "H264") codec = "H.264";
      if (codec === "HEVC" || codec === "H265") codec = "HEVC";

      const audioTracks = audioStreams.map((s, idx) => ({
        index: s.index || idx,
        language: (s.tags?.language || "eng").toLowerCase(),
        codec: s.codec_name || "aac",
        channels: s.channels || 2,
      }));

      const subtitleTracks = subtitleStreams.map((s, idx) => ({
        index: s.index || idx,
        language: (s.tags?.language || "eng").toLowerCase(),
        title: s.tags?.title || `Track ${idx + 1}`,
      }));

      resolve({
        duration: Math.round(duration),
        runtime: Math.round(duration / 60),
        resolution,
        codec,
        bitrate: metadata.format.bit_rate ? Math.round(Number(metadata.format.bit_rate)) : fallback.bitrate,
        fps: videoStream?.r_frame_rate ? Math.round(eval(videoStream.r_frame_rate)) : 24,
        aspectRatio: `${width}:${height}`,
        audioTracks,
        subtitleTracks,
      });
    });
  });
}
