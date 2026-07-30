import { NextRequest, NextResponse } from "next/server";
import { MovieService } from "../../../services/movie-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const genre = searchParams.get("genre");
    const year = searchParams.get("year");
    const res = searchParams.get("resolution");

    if (query || genre || year || res) {
      const movies = await MovieService.searchMovies(query || "", {
        genre: genre || undefined,
        year: year ? parseInt(year, 10) : undefined,
        resolution: res || undefined,
      });
      return NextResponse.json({ movies });
    }

    const movies = await MovieService.getAllMovies();
    return NextResponse.json({ movies });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
