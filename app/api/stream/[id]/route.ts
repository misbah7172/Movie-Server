import { NextRequest, NextResponse } from "next/server";
import { MovieService } from "@/services/movie-service";
import fs from "fs";
import path from "path";

// Helper to map file extensions to mime types
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".mp4":
      return "video/mp4";
    case ".mkv":
      return "video/x-matroska";
    case ".webm":
      return "video/webm";
    case ".mov":
      return "video/quicktime";
    case ".avi":
      return "video/x-msvideo";
    default:
      return "video/mp4";
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Look up movie metadata
    const movie = await MovieService.getMovieById(id);
    if (!movie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    // Resolve target video file path safely within project storage
    let relativePath = movie.movie_path;
    if (relativePath.startsWith("/")) {
      relativePath = relativePath.substring(1);
    }
    const fullPath = path.join(process.cwd(), relativePath);

    // Verify file existence on disk
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json(
        { error: "Video file missing on storage server", path: movie.movie_path },
        { status: 404 }
      );
    }

    const stat = fs.statSync(fullPath);
    const fileSize = stat.size;
    const mimeType = getMimeType(fullPath);

    // Read HTTP Range Header
    const range = request.headers.get("range");

    if (!range) {
      // Send full file headers if no range requested (rare for video player)
      const headers = new Headers();
      headers.set("Content-Type", mimeType);
      headers.set("Content-Length", fileSize.toString());
      headers.set("Accept-Ranges", "bytes");

      const nodeStream = fs.createReadStream(fullPath);
      const webStream = new ReadableStream({
        start(controller) {
          nodeStream.on("data", (chunk) => controller.enqueue(chunk));
          nodeStream.on("end", () => controller.close());
          nodeStream.on("error", (err) => controller.error(err));
        },
        cancel() {
          nodeStream.destroy();
        },
      });

      return new NextResponse(webStream, { headers });
    }

    // Parse Range Header (e.g. "bytes=1048576-")
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    
    // Chunk size: default 4MB chunks for fast responsive seeking
    const CHUNK_SIZE = 4 * 1024 * 1024;
    let end = parts[1] ? parseInt(parts[1], 10) : start + CHUNK_SIZE - 1;

    if (end >= fileSize) {
      end = fileSize - 1;
    }

    if (start >= fileSize || start < 0) {
      return new NextResponse(null, {
        status: 416, // Range Not Satisfiable
        headers: {
          "Content-Range": `bytes */${fileSize}`,
        },
      });
    }

    const contentLength = end - start + 1;
    const nodeStream = fs.createReadStream(fullPath, { start, end });

    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on("data", (chunk) => controller.enqueue(chunk));
        nodeStream.on("end", () => controller.close());
        nodeStream.on("error", (err) => controller.error(err));
      },
      cancel() {
        nodeStream.destroy();
      },
    });

    const headers = new Headers();
    headers.set("Content-Range", `bytes ${start}-${end}/${fileSize}`);
    headers.set("Accept-Ranges", "bytes");
    headers.set("Content-Length", contentLength.toString());
    headers.set("Content-Type", mimeType);
    headers.set("Cache-Control", "no-cache, private");

    return new NextResponse(webStream, {
      status: 206, // Partial Content
      headers,
    });
  } catch (error: any) {
    console.error("Streaming route error:", error);
    return NextResponse.json(
      { error: "Internal server streaming error" },
      { status: 500 }
    );
  }
}
