export interface BrowserExtractedMetadata {
  duration: number;
  runtime: number;
  resolution: string;
  codec: string;
  aspectRatio: string;
}

export function extractVideoMetadataInBrowser(file: File): Promise<BrowserExtractedMetadata> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = url;

    const fallback: BrowserExtractedMetadata = {
      duration: 7200,
      runtime: 120,
      resolution: "1080p Full HD",
      codec: "H.264",
      aspectRatio: "16:9",
    };

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      const duration = Math.round(video.duration || 7200);
      const width = video.videoWidth || 1920;
      const height = video.videoHeight || 1080;

      let resolution = "1080p Full HD";
      if (width >= 3840 || height >= 2160) resolution = "4K 2160p";
      else if (width >= 2560 || height >= 1440) resolution = "2K 1440p";
      else if (width >= 1280 || height >= 720) resolution = "720p HD";

      let extension = file.name.split(".").pop()?.toUpperCase() || "MP4";
      let codec = extension === "MKV" ? "H.264 / HEVC" : `${extension} H.264`;

      resolve({
        duration,
        runtime: Math.round(duration / 60) || 1,
        resolution,
        codec,
        aspectRatio: `${width}:${height}`,
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(fallback);
    };
  });
}
