import { NextResponse } from "next/server";
import { MovieService } from "../../../../services/movie-service";

export async function GET() {
  const stats = await MovieService.getStorageStats();
  return NextResponse.json({ stats });
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    const success = await MovieService.deleteMovie(id);
    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
