import { NextRequest, NextResponse } from "next/server";
import { MovieService } from "../../../services/movie-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "u-admin-01";
  const history = await MovieService.getUserWatchHistory(userId);
  return NextResponse.json({ history });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, movieId, progressSeconds, durationSeconds } = body;
    const record = await MovieService.updateWatchHistory(
      userId || "u-admin-01",
      movieId,
      progressSeconds,
      durationSeconds
    );
    return NextResponse.json({ success: true, record });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
