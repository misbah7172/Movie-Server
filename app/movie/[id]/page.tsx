import { MovieService } from "@/services/movie-service";
import { Navbar } from "@/components/layout/navbar";
import { HorizontalScrollRow } from "@/components/rows/HorizontalScrollRow";
import { Play, Star, Clock, Film, Heart, Share2, Subtitles, Volume2, Shield } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function MovieDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const movie = await MovieService.getMovieById(id);

  if (!movie) {
    notFound();
  }

  const allMovies = await MovieService.getAllMovies();
  const relatedMovies = allMovies.filter(
    (m) => m.id !== movie.id && m.genres?.some((g) => movie.genres?.some((mg) => mg.id === g.id))
  );

  return (
    <div className="min-h-screen bg-[#08080a] text-white">
      <Navbar />

      {/* Hero Backdrop Section */}
      <div className="relative w-full h-[60vh] sm:h-[70vh] min-h-[450px] overflow-hidden">
        <img
          src={
            movie.backdrop_path ||
            movie.poster_path ||
            "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1920&auto=format&fit=crop"
          }
          alt={movie.title}
          className="w-full h-full object-cover object-center filter brightness-75 transform scale-105"
        />
        <div className="absolute inset-0 hero-vignette" />
        <div className="absolute inset-0 hero-vignette-left" />
      </div>

      {/* Details Main Section */}
      <main className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-40 sm:-mt-52 pb-20 space-y-12">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Poster Image */}
          <div className="flex-none w-48 sm:w-64 rounded-2xl overflow-hidden shadow-2xl border-2 border-zinc-800 bg-zinc-950">
            <img
              src={
                movie.poster_path ||
                "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop"
              }
              alt={movie.title}
              className="w-full h-auto object-cover"
            />
          </div>

          {/* Details Metadata Content */}
          <div className="flex-1 space-y-6">
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-zinc-300">
              <span className="px-2.5 py-1 rounded bg-[#E50914] text-white font-bold uppercase tracking-wide">
                {movie.resolution}
              </span>
              <span className="flex items-center space-x-1 text-amber-400">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{movie.rating_average || 4.8} / 5</span>
              </span>
              <span className="text-zinc-400">{movie.release_year}</span>
              <span className="text-zinc-400">{movie.runtime ? `${movie.runtime} minutes` : "120 mins"}</span>
              <span className="px-2 py-0.5 border border-zinc-700 rounded text-zinc-400">
                {movie.codec}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase">
              {movie.title}
            </h1>

            {/* Genres Badges */}
            <div className="flex flex-wrap gap-2">
              {movie.genres?.map((g) => (
                <span
                  key={g.id}
                  className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-medium text-zinc-300"
                >
                  {g.name}
                </span>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href={`/watch/${movie.id}`}
                className="px-8 py-4 bg-[#E50914] hover:bg-[#B81D24] text-white font-extrabold text-base rounded-xl shadow-xl shadow-[#E50914]/40 flex items-center space-x-3 transition-transform transform hover:scale-105"
              >
                <Play className="w-6 h-6 fill-white" />
                <span>Stream Movie</span>
              </Link>

              <button className="p-3.5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl">
                <Heart className="w-5 h-5" />
              </button>

              <button className="p-3.5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl">
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <div className="glass-panel p-6 rounded-2xl border border-zinc-800 space-y-4">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Plot Summary</h3>
              <p className="text-zinc-300 leading-relaxed text-sm sm:text-base">{movie.description}</p>

              {/* Technical Specifications */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-zinc-800/80 text-xs">
                <div>
                  <span className="text-zinc-500 block uppercase font-semibold">Audio Codec</span>
                  <span className="text-zinc-200 font-medium">AAC Stereo / Dolby 5.1</span>
                </div>
                <div>
                  <span className="text-zinc-500 block uppercase font-semibold">Language</span>
                  <span className="text-zinc-200 font-medium">{movie.language}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block uppercase font-semibold">Aspect Ratio</span>
                  <span className="text-zinc-200 font-medium">{movie.aspect_ratio}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block uppercase font-semibold">Subtitles</span>
                  <span className="text-zinc-200 font-medium">English [CC], Spanish</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Movies Row */}
        {relatedMovies.length > 0 && (
          <HorizontalScrollRow
            title="More Like This"
            subtitle="Movies with similar genres and themes"
            movies={relatedMovies}
          />
        )}
      </main>
    </div>
  );
}
