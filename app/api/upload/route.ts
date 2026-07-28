import { NextRequest, NextResponse } from "next/server";
import { MovieService } from "@/services/movie-service";
import { extractMediaMetadata } from "@/lib/ffmpeg/probe";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string || "";
    const releaseYear = parseInt(formData.get("releaseYear") as string || "2024", 10);
    const genreIds = (formData.get("genres") as string || "").split(",").filter(Boolean);

    const movieFile = formData.get("movieFile") as File | null;
    const posterFile = formData.get("posterFile") as File | null;
    const backdropFile = formData.get("backdropFile") as File | null;

    if (!title || !movieFile) {
      return NextResponse.json({ error: "Movie title and video file are required" }, { status: 400 });
    }

    // Sanitize filename to prevent path traversal
    const safeTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    const videoExt = path.extname(movieFile.name) || ".mp4";
    const videoFileName = `${safeTitle}-${Date.now()}${videoExt}`;
    const videoRelativePath = `/storage/movies/${videoFileName}`;
    const videoFullPath = path.join(process.cwd(), "storage", "movies", videoFileName);

    // Save video file to disk
    const videoBuffer = Buffer.from(await movieFile.arrayBuffer());
    fs.writeFileSync(videoFullPath, videoBuffer);

    // Save Poster if uploaded
    let posterRelativePath: string | null = null;
    if (posterFile) {
      const posterExt = path.extname(posterFile.name) || ".jpg";
      const posterFileName = `${safeTitle}-poster-${Date.now()}${posterExt}`;
      posterRelativePath = `/storage/posters/${posterFileName}`;
      const posterFullPath = path.join(process.cwd(), "storage", "posters", posterFileName);
      fs.writeFileSync(posterFullPath, Buffer.from(await posterFile.arrayBuffer()));
    }

    // Save Backdrop if uploaded
    let backdropRelativePath: string | null = null;
    if (backdropFile) {
      const backdropExt = path.extname(backdropFile.name) || ".jpg";
      const backdropFileName = `${safeTitle}-backdrop-${Date.now()}${backdropExt}`;
      backdropRelativePath = `/storage/backdrops/${backdropFileName}`;
      const backdropFullPath = path.join(process.cwd(), "storage", "backdrops", backdropFileName);
      fs.writeFileSync(backdropFullPath, Buffer.from(await backdropFile.arrayBuffer()));
    }

    // Automatically run ffprobe metadata extraction pipeline
    const meta = await extractMediaMetadata(videoFullPath);

    // Add movie to database store
    const newDbMovie = await MovieService.addMovie({
      title,
      slug: safeTitle,
      description,
      release_year: releaseYear,
      runtime: meta.runtime,
      resolution: meta.resolution,
      codec: meta.codec,
      language: "English",
      poster_path: posterRelativePath || "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop",
      backdrop_path: backdropRelativePath || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1920&auto=format&fit=crop",
      movie_path: videoRelativePath,
      duration: meta.duration,
      file_size: videoBuffer.length,
      aspect_ratio: meta.aspectRatio,
      is_featured: false,
      rating_average: 5.0,
      genres: genreIds.map((id) => ({ id, name: id, slug: id })),
    });

    return NextResponse.json({ success: true, movie: newDbMovie, metadata: meta });
  } catch (error: any) {
    console.error("Upload API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process upload" }, { status: 500 });
  }
}
