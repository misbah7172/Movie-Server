import { Movie, Genre, Actor, Collection, Subtitle, WatchHistory, Profile } from "@/types/database";
import fs from "fs";
import path from "path";

// Initial seed movie data for out-of-the-box rich demo testing
const INITIAL_MOVIES: Movie[] = [
  {
    id: "m-001",
    title: "Cosmic Odyssey 2099",
    original_title: "Cosmic Odyssey: First Contact",
    slug: "cosmic-odyssey-2099",
    description: "A deep space exploration vessel uncovers a mysterious alien structure at the edge of the solar system, threatening the survival of human civilization.",
    release_year: 2024,
    runtime: 148,
    resolution: "4K 2160p",
    codec: "H.264",
    language: "English",
    poster_path: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1000&auto=format&fit=crop",
    backdrop_path: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1920&auto=format&fit=crop",
    movie_path: "/storage/movies/cosmic_odyssey.mp4",
    trailer_path: "",
    duration: 8880,
    file_size: 15420000000,
    aspect_ratio: "16:9",
    is_featured: true,
    view_count: 1420,
    rating_average: 4.8,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
    genres: [
      { id: "g-sci-fi", name: "Sci-Fi", slug: "sci-fi" },
      { id: "g-adventure", name: "Adventure", slug: "adventure" },
    ],
    actors: [
      { id: "a-1", name: "Elena Vance", role: "Actor", character_name: "Commander Sarah Vance" },
      { id: "a-2", name: "Marcus Miller", role: "Director", character_name: "Director" },
    ],
  },
  {
    id: "m-002",
    title: "Neon Cyberpunk: Neon City",
    original_title: "Neon City",
    slug: "neon-cyberpunk-neon-city",
    description: "In a dystopian futuristic metropolis, a rogue hacker teams up with an augmented private eye to expose a megacorporation's dark experiment.",
    release_year: 2023,
    runtime: 126,
    resolution: "1080p Full HD",
    codec: "H.264",
    language: "English",
    poster_path: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1000&auto=format&fit=crop",
    backdrop_path: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1920&auto=format&fit=crop",
    movie_path: "/storage/movies/neon_city.mp4",
    trailer_path: "",
    duration: 7560,
    file_size: 8900000000,
    aspect_ratio: "16:9",
    is_featured: true,
    view_count: 980,
    rating_average: 4.6,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
    genres: [
      { id: "g-sci-fi", name: "Sci-Fi", slug: "sci-fi" },
      { id: "g-action", name: "Action", slug: "action" },
      { id: "g-thriller", name: "Thriller", slug: "thriller" },
    ],
  },
  {
    id: "m-003",
    title: "Shadows of the Forgotten Kingdom",
    original_title: "The Forgotten Kingdom",
    slug: "shadows-of-the-forgotten-kingdom",
    description: "An exiled knight embarks on a perilous journey across enchanted realms to reclaim their ancestral throne from an ancient warlord.",
    release_year: 2024,
    runtime: 162,
    resolution: "4K 2160p",
    codec: "HEVC",
    language: "English",
    poster_path: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000&auto=format&fit=crop",
    backdrop_path: "https://images.unsplash.com/photo-1514539079130-25950c84af65?q=80&w=1920&auto=format&fit=crop",
    movie_path: "/storage/movies/forgotten_kingdom.mp4",
    trailer_path: "",
    duration: 9720,
    file_size: 18200000000,
    aspect_ratio: "2.39:1",
    is_featured: false,
    view_count: 2150,
    rating_average: 4.9,
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date().toISOString(),
    genres: [
      { id: "g-fantasy", name: "Fantasy", slug: "fantasy" },
      { id: "g-action", name: "Action", slug: "action" },
    ],
  },
  {
    id: "m-004",
    title: "The Midnight Express Heist",
    slug: "the-midnight-express-heist",
    description: "A crew of elite thieves attempt the impossible: stealing a priceless diamond payload from a moving high-speed bullet train.",
    release_year: 2022,
    runtime: 110,
    resolution: "1080p Full HD",
    codec: "H.264",
    language: "English",
    poster_path: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=1000&auto=format&fit=crop",
    backdrop_path: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1920&auto=format&fit=crop",
    movie_path: "/storage/movies/midnight_heist.mp4",
    duration: 6600,
    file_size: 6500000000,
    aspect_ratio: "16:9",
    is_featured: false,
    view_count: 810,
    rating_average: 4.4,
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    updated_at: new Date().toISOString(),
    genres: [
      { id: "g-action", name: "Action", slug: "action" },
      { id: "g-crime", name: "Crime", slug: "crime" },
    ],
  },
];

const INITIAL_GENRES: Genre[] = [
  { id: "g-action", name: "Action", slug: "action" },
  { id: "g-sci-fi", name: "Sci-Fi", slug: "sci-fi" },
  { id: "g-fantasy", name: "Fantasy", slug: "fantasy" },
  { id: "g-adventure", name: "Adventure", slug: "adventure" },
  { id: "g-thriller", name: "Thriller", slug: "thriller" },
  { id: "g-crime", name: "Crime", slug: "crime" },
  { id: "g-drama", name: "Drama", slug: "drama" },
  { id: "g-animation", name: "Animation", slug: "animation" },
];

const INITIAL_COLLECTIONS: Collection[] = [
  {
    id: "col-sci-fi-classics",
    name: "Future Worlds & Cyberpunk",
    slug: "future-worlds",
    description: "Curated futuristic blockbusters and cyberpunk space sagas.",
    cover_path: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop",
    movie_count: 2,
  },
  {
    id: "col-action-packed",
    name: "High-Octane Action",
    slug: "high-octane-action",
    description: "Edge-of-your-seat thrillers, heists, and battles.",
    cover_path: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000&auto=format&fit=crop",
    movie_count: 3,
  },
];

const DATA_FILE = path.join(process.cwd(), "storage", "db_store.json");

interface LocalStore {
  movies: Movie[];
  genres: Genre[];
  collections: Collection[];
  watchHistory: Record<string, WatchHistory[]>; // user_id -> history
  favorites: Record<string, string[]>; // user_id -> movie_ids
}

function loadStore(): LocalStore {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Error reading db_store.json:", err);
  }
  return {
    movies: INITIAL_MOVIES,
    genres: INITIAL_GENRES,
    collections: INITIAL_COLLECTIONS,
    watchHistory: {},
    favorites: {},
  };
}

function saveStore(store: LocalStore) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving db_store.json:", err);
  }
}

export class MovieService {
  static async getAllMovies(): Promise<Movie[]> {
    const store = loadStore();
    return store.movies;
  }

  static async getMovieById(id: string): Promise<Movie | null> {
    const store = loadStore();
    return store.movies.find((m) => m.id === id || m.slug === id) || null;
  }

  static async getFeaturedMovies(): Promise<Movie[]> {
    const store = loadStore();
    return store.movies.filter((m) => m.is_featured);
  }

  static async searchMovies(query: string, filters?: { genre?: string; year?: number; resolution?: string }): Promise<Movie[]> {
    const store = loadStore();
    const q = query.toLowerCase().trim();

    return store.movies.filter((movie) => {
      const matchesText =
        !q ||
        movie.title.toLowerCase().includes(q) ||
        movie.description?.toLowerCase().includes(q) ||
        movie.genres?.some((g) => g.name.toLowerCase().includes(q));

      const matchesGenre =
        !filters?.genre || movie.genres?.some((g) => g.slug === filters.genre || g.name === filters.genre);

      const matchesYear = !filters?.year || movie.release_year === filters.year;

      const matchesRes =
        !filters?.resolution || movie.resolution.toLowerCase().includes(filters.resolution.toLowerCase());

      return matchesText && matchesGenre && matchesYear && matchesRes;
    });
  }

  static async addMovie(movie: Omit<Movie, "id" | "created_at" | "updated_at">): Promise<Movie> {
    const store = loadStore();
    const newMovie: Movie = {
      ...movie,
      id: `m-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.movies.unshift(newMovie);
    saveStore(store);
    return newMovie;
  }

  static async updateMovie(id: string, updates: Partial<Movie>): Promise<Movie | null> {
    const store = loadStore();
    const idx = store.movies.findIndex((m) => m.id === id);
    if (idx === -1) return null;

    store.movies[idx] = {
      ...store.movies[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    saveStore(store);
    return store.movies[idx];
  }

  static async deleteMovie(id: string): Promise<boolean> {
    const store = loadStore();
    const initialLen = store.movies.length;
    store.movies = store.movies.filter((m) => m.id !== id);
    saveStore(store);
    return store.movies.length < initialLen;
  }

  static async getAllGenres(): Promise<Genre[]> {
    const store = loadStore();
    return store.genres;
  }

  static async getAllCollections(): Promise<Collection[]> {
    const store = loadStore();
    return store.collections;
  }

  static async updateWatchHistory(
    userId: string,
    movieId: string,
    progressSeconds: number,
    durationSeconds: number
  ): Promise<WatchHistory> {
    const store = loadStore();
    if (!store.watchHistory[userId]) {
      store.watchHistory[userId] = [];
    }

    const userHist = store.watchHistory[userId];
    const percentage = durationSeconds > 0 ? (progressSeconds / durationSeconds) * 100 : 0;
    const completed = percentage >= 92;

    const existingIdx = userHist.findIndex((h) => h.movie_id === movieId);
    const updatedRecord: WatchHistory = {
      id: existingIdx !== -1 ? userHist[existingIdx].id : `wh-${Date.now()}`,
      user_id: userId,
      movie_id: movieId,
      progress_seconds: progressSeconds,
      duration_seconds: durationSeconds,
      percentage,
      completed,
      last_watched_at: new Date().toISOString(),
    };

    if (existingIdx !== -1) {
      userHist[existingIdx] = updatedRecord;
    } else {
      userHist.unshift(updatedRecord);
    }

    saveStore(store);
    return updatedRecord;
  }

  static async getUserWatchHistory(userId: string): Promise<WatchHistory[]> {
    const store = loadStore();
    const userHist = store.watchHistory[userId] || [];
    return userHist.map((h) => ({
      ...h,
      movie: store.movies.find((m) => m.id === h.movie_id),
    }));
  }

  static async toggleFavorite(userId: string, movieId: string): Promise<boolean> {
    const store = loadStore();
    if (!store.favorites[userId]) {
      store.favorites[userId] = [];
    }

    const favs = store.favorites[userId];
    const idx = favs.indexOf(movieId);
    let isFav = false;

    if (idx !== -1) {
      favs.splice(idx, 1);
    } else {
      favs.push(movieId);
      isFav = true;
    }

    saveStore(store);
    return isFav;
  }

  static async getUserFavorites(userId: string): Promise<Movie[]> {
    const store = loadStore();
    const favIds = store.favorites[userId] || [];
    return store.movies.filter((m) => favIds.includes(m.id));
  }

  static async getStorageStats() {
    const store = loadStore();
    const totalMovies = store.movies.length;
    const totalSizeBytes = store.movies.reduce((acc, m) => acc + (m.file_size || 0), 0);
    const totalDurationSeconds = store.movies.reduce((acc, m) => acc + (m.duration || 0), 0);

    return {
      totalMovies,
      totalSizeBytes,
      totalSizeGB: (totalSizeBytes / (1024 * 1024 * 1024)).toFixed(2),
      totalHours: (totalDurationSeconds / 3600).toFixed(1),
    };
  }
}
