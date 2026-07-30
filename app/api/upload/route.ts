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

    // Client-side pre-extracted metadata (Vercel-native)
    const clientDuration = formData.get("duration") ? parseInt(formData.get("duration") as string, 10) : null;
    const clientRuntime = formData.get("runtime") ? parseInt(formData.get("runtime") as string, 10) : null;
    const clientResolution = (formData.get("resolution") as string) || null;
    const clientCodec = (formData.get("codec") as string) || null;
    const clientAspectRatio = (formData.get("aspect_ratio") as string) || null;

    if (!videoFile || typeof videoFile === "string" || !(videoFile as any).size) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 });
    }

    const videoBytes = await videoFile.arrayBuffer();
    const videoBuffer = Buffer.from(videoBytes);
    const safeVideoName = `${Date.now()}_${videoFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    // Extract or fallback metadata
    let metadata = {
      duration: clientDuration || 7200,
      runtime: clientRuntime || 120,
      resolution: clientResolution || "1080p Full HD",
      codec: clientCodec || "H.264",
      aspectRatio: clientAspectRatio || "16:9",
    };

    // If client metadata was not provided, attempt ffprobe analysis
    if (!clientDuration) {
      try {
        const tempDir = os.tmpdir();
        tempVideoPath = path.join(tempDir, safeVideoName);
        fs.writeFileSync(tempVideoPath, videoBuffer);
        const probed = await extractMediaMetadata(tempVideoPath);
        metadata = {
          duration: probed.duration,
          runtime: probed.runtime,
          resolution: probed.resolution,
          codec: probed.codec,
          aspectRatio: probed.aspectRatio,
        };
      } catch (e) {
        console.warn("Server ffprobe notice (using client metadata fallback):", e);
      }
    }

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
        const mime = posterFile.type || "image/jpeg";
        finalPosterPath = `data:${mime};base64,${posterBuffer.toString("base64")}`;
      }
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    // 1. Add movie metadata record to PostgreSQL database
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
      movie_path: "pending",
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

    // 2. Save video binary directly into PostgreSQL table 'movie_files'
    const streamUrl = await MovieService.saveMovieFile(
      newMovie.id,
      safeVideoName,
      videoFile.type || "video/mp4",
      videoBuffer
    );

    newMovie.movie_path = streamUrl;

    // Optional secondary upload to Supabase Storage bucket
    uploadFileToSupabaseStorage("movies", safeVideoName, videoBuffer, videoFile.type || "video/mp4").catch(() => {});

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
