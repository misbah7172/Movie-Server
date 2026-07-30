import { NextRequest, NextResponse } from "next/server";
import { MovieService } from "../../../services/movie-service";
import { extractMediaMetadata } from "../../../lib/ffmpeg/probe";
import { uploadFileToSupabaseStorage } from "../../../lib/storage";
import fs from "fs";
import path from "path";
import os from "os";

export async function POST(request: NextRequest) {
  let tempVideoPath: string | null = null;

  try {
    const formData = await request.formData();
    const videoFile = (formData.get("video") || formData.get("movieFile")) as File | null;
    const posterFile = (formData.get("poster") || formData.get("posterFile")) as File | null;
    const title = (formData.get("title") as string) || "Untitled Movie";
    const description = (formData.get("description") as string) || "";
    const releaseYearStr = (formData.get("release_year") || formData.get("releaseYear")) as string;
    const releaseYear = parseInt(releaseYearStr || "2024", 10);
    const genreNames = (formData.get("genres") as string)?.split(",").map((g) => g.trim()) || ["Sci-Fi"];

    if (!videoFile || typeof videoFile === "string" || !(videoFile as any).size) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 });
    }

    const videoBytes = await videoFile.arrayBuffer();
    const videoBuffer = Buffer.from(videoBytes);
    const safeVideoName = `${Date.now()}_${videoFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    // Write temp video file to OS temp dir (C: drive with 50+ GB free) for ffprobe analysis
    const tempDir = os.tmpdir();
    tempVideoPath = path.join(tempDir, safeVideoName);
    fs.writeFileSync(tempVideoPath, videoBuffer);

    // Run ffprobe analysis
    const metadata = await extractMediaMetadata(tempVideoPath);

    // Upload video file to Supabase Storage bucket 'movies'
    const storageVideoUrl = await uploadFileToSupabaseStorage(
      "movies",
      safeVideoName,
      videoBuffer,
      videoFile.type || "video/mp4"
    );

    // Fallback URL if storage bucket or URL is returned
    const finalMoviePath = storageVideoUrl || `/api/stream/${safeVideoName}`;

    // Process poster file if provided
    let finalPosterPath = "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop";

    if (posterFile && typeof posterFile !== "string" && (posterFile as any).size > 0) {
      const posterBytes = await posterFile.arrayBuffer();
      const posterBuffer = Buffer.from(posterBytes);
      const safePosterName = `${Date.now()}_${posterFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

      const storagePosterUrl = await uploadFileToSupabaseStorage(
        "posters",
        safePosterName,
        posterBuffer,
        posterFile.type || "image/jpeg"
      );

      if (storagePosterUrl) {
        finalPosterPath = storagePosterUrl;
      } else {
        // Convert to Base64 data URL if storage upload is unavailable
        const mime = posterFile.type || "image/jpeg";
        finalPosterPath = `data:${mime};base64,${posterBuffer.toString("base64")}`;
      }
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const newMovie = await MovieService.addMovie({
      title,
      slug: `${slug}-${Date.now().toString(36)}`,
      description,
      release_year: releaseYear,
      runtime: metadata.runtime,
      resolution: metadata.resolution,
      codec: metadata.codec,
      language: "English",
      poster_path: finalPosterPath,
      backdrop_path: finalPosterPath,
      movie_path: finalMoviePath,
      duration: metadata.duration,
      file_size: videoBuffer.length,
      aspect_ratio: metadata.aspectRatio,
      is_featured: true,
      rating_average: 5.0,
      genres: genreNames.map((g) => ({
        id: g.toLowerCase().replace(/\s+/g, "-"),
        name: g,
        slug: g.toLowerCase().replace(/\s+/g, "-"),
      })),
    });

    return NextResponse.json({ success: true, movie: newMovie });
  } catch (err: any) {
    console.error("Upload handler error:", err);
    return NextResponse.json({ error: err.message || "Failed to upload movie" }, { status: 500 });
  } finally {
    // Clean up temporary OS files
    if (tempVideoPath && fs.existsSync(tempVideoPath)) {
      try {
        fs.unlinkSync(tempVideoPath);
      } catch (e) {
        console.warn("Failed to clean up temp video file:", e);
      }
    }
  }
}
