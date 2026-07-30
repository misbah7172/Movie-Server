import { Suspense } from "react";
import { MovieService } from "../../../services/movie-service";
import { CustomVideoPlayer } from "../../../components/player/CustomVideoPlayer";
import { notFound } from "next/navigation";

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const movie = await MovieService.getMovieById(id);

  if (!movie) {
    notFound();
  }

  return (
    <Suspense fallback={<div className="w-full h-screen bg-black flex items-center justify-center text-white">Loading Stream...</div>}>
      <CustomVideoPlayer movie={movie} />
    </Suspense>
  );
}
