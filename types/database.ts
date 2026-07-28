export type UserRole = "admin" | "user";

export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  role: UserRole;
  preferences: {
    theme?: string;
    autoplay?: boolean;
    defaultLanguage?: string;
    playbackSpeed?: number;
    subtitleLanguage?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface Movie {
  id: string;
  title: string;
  original_title?: string | null;
  slug: string;
  description: string | null;
  release_year: number | null;
  runtime: number | null; // minutes
  resolution: string; // "4K 2160p", "1080p", "720p"
  codec: string; // "H.264", "HEVC", "AV1"
  language: string;
  poster_path: string | null;
  backdrop_path: string | null;
  movie_path: string;
  trailer_path?: string | null;
  duration: number; // seconds
  file_size: number; // bytes
  aspect_ratio: string;
  is_featured?: boolean;
  view_count?: number;
  rating_average?: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  genres?: Genre[];
  actors?: Actor[];
  subtitles?: Subtitle[];
  watch_progress?: WatchHistory | null;
  is_favorite?: boolean;
}

export interface Genre {
  id: string;
  name: string;
  slug: string;
  created_at?: string;
}

export interface Actor {
  id: string;
  name: string;
  role?: string; // Actor, Director, Writer
  photo_url?: string | null;
  character_name?: string | null;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  cover_path?: string | null;
  movie_count?: number;
  movies?: Movie[];
  created_at?: string;
}

export interface Subtitle {
  id: string;
  movie_id: string;
  label: string;
  language: string;
  file_path: string;
  is_default: boolean;
  format: "vtt" | "srt";
  created_at?: string;
}

export interface WatchHistory {
  id: string;
  user_id: string;
  movie_id: string;
  progress_seconds: number;
  duration_seconds: number;
  percentage: number;
  completed: boolean;
  last_watched_at: string;
  movie?: Movie;
}

export interface Favorite {
  user_id: string;
  movie_id: string;
  created_at: string;
  movie?: Movie;
}

export interface Rating {
  id: string;
  user_id: string;
  movie_id: string;
  score: number; // 1-5
  created_at: string;
}

export interface SystemSettings {
  storage_path: string;
  auto_generate_thumbnails: boolean;
  max_upload_size_gb: number;
  allowed_codecs: string[];
}
