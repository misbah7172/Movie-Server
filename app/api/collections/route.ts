import { NextResponse } from "next/server";
import { MovieService } from "../../../services/movie-service";

export async function GET() {
  const collections = await MovieService.getAllCollections();
  return NextResponse.json({ collections });
}
