import { NextResponse } from "next/server";
import { MovieService } from "../../../services/movie-service";

export async function GET() {
  const genres = await MovieService.getAllGenres();
  return NextResponse.json({ genres });
}
