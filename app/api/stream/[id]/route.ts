import { NextRequest, NextResponse } from "next/server";
import { MovieService } from "../../../../services/movie-service";
import fs from "fs";
import path from "path";
import os from "os";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Check PostgreSQL BYTEA storage table 'movie_files' first
    const dbFile = await MovieService.getMovieFile(id);

    if (dbFile && dbFile.file_data && dbFile.file_data.length > 0) {
      const fileBuffer = dbFile.file_data;
      const fileSize = fileBuffer.length;
      const mimeType = dbFile.mime_type || "video/mp4";
      const range = request.headers.get("range");

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + 4 * 1024 * 1024 - 1, fileSize - 1);

        if (start >= fileSize) {
          return new NextResponse(null, {
            status: 416,
            headers: { "Content-Range": `bytes */${fileSize}` },
          });
        }

        const chunksize = end - start + 1;
        const chunk = fileBuffer.subarray(start, end + 1);

        return new NextResponse(chunk, {
          status: 206,
          headers: {
            "Content-Range": `bytes ${start}-${end}/${fileSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": chunksize.toString(),
            "Content-Type": mimeType,
          },
        });
      } else {
        return new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            "Content-Length": fileSize.toString(),
            "Content-Type": mimeType,
            "Accept-Ranges": "bytes",
          },
        });
      }
    }

    // 2. Fallback to movie record lookup
    const movie = await MovieService.getMovieById(id);

    if (!movie || !movie.movie_path) {
      return new NextResponse("Movie media stream not found in PostgreSQL database", { status: 404 });
    }

    const range = request.headers.get("range");

    // Case A: Remote Supabase Storage URL
    if (movie.movie_path.startsWith("http://") || movie.movie_path.startsWith("https://")) {
      const headers: Record<string, string> = {};
      if (range) headers["Range"] = range;

      const remoteRes = await fetch(movie.movie_path, { headers });
      const responseHeaders = new Headers();

      responseHeaders.set("Content-Type", remoteRes.headers.get("content-type") || "video/mp4");
      responseHeaders.set("Accept-Ranges", "bytes");

      if (remoteRes.headers.get("content-range")) {
        responseHeaders.set("Content-Range", remoteRes.headers.get("content-range")!);
      }
      if (remoteRes.headers.get("content-length")) {
        responseHeaders.set("Content-Length", remoteRes.headers.get("content-length")!);
      }

      return new NextResponse(remoteRes.body, {
        status: remoteRes.status,
        headers: responseHeaders,
      });
    }

    // Case B: Local storage fallback
    let targetPath = movie.movie_path;
    if (!fs.existsSync(targetPath)) {
      const tempPath = path.join(os.tmpdir(), path.basename(movie.movie_path));
      if (fs.existsSync(tempPath)) {
        targetPath = tempPath;
      } else {
        return new NextResponse("Video file not found", { status: 404 });
      }
    }

    const stat = fs.statSync(targetPath);
    const fileSize = stat.size;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + 4 * 1024 * 1024 - 1, fileSize - 1);

      if (start >= fileSize) {
        return new NextResponse(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${fileSize}` },
        });
      }

      const chunksize = end - start + 1;
      const fileStream = fs.createReadStream(targetPath, { start, end });

      const stream = new ReadableStream({
        start(controller) {
          fileStream.on("data", (chunk) => controller.enqueue(chunk));
          fileStream.on("end", () => controller.close());
          fileStream.on("error", (err) => controller.error(err));
        },
      });

      return new NextResponse(stream, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunksize.toString(),
          "Content-Type": "video/mp4",
        },
      });
    } else {
      const fileStream = fs.createReadStream(targetPath);
      const stream = new ReadableStream({
        start(controller) {
          fileStream.on("data", (chunk) => controller.enqueue(chunk));
          fileStream.on("end", () => controller.close());
          fileStream.on("error", (err) => controller.error(err));
        },
      });

      return new NextResponse(stream, {
        status: 200,
        headers: {
          "Content-Length": fileSize.toString(),
          "Content-Type": "video/mp4",
          "Accept-Ranges": "bytes",
        },
      });
    }
  } catch (err: any) {
    console.error("Streaming endpoint error:", err);
    return new NextResponse(err.message || "Internal server streaming error", { status: 500 });
  }
}
