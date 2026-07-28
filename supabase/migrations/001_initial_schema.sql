-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  preferences JSONB DEFAULT '{"theme": "dark", "autoplay": true, "defaultLanguage": "en", "playbackSpeed": 1}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MOVIES TABLE
CREATE TABLE IF NOT EXISTS public.movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  original_title TEXT,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  release_year INTEGER,
  runtime INTEGER, -- minutes
  resolution TEXT DEFAULT '1080p', -- e.g. 4K 2160p, 1080p, 720p
  codec TEXT DEFAULT 'H.264',
  language TEXT DEFAULT 'English',
  poster_path TEXT,
  backdrop_path TEXT,
  movie_path TEXT NOT NULL,
  trailer_path TEXT,
  duration REAL DEFAULT 0, -- seconds
  file_size BIGINT DEFAULT 0, -- bytes
  aspect_ratio TEXT DEFAULT '16:9',
  is_featured BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  rating_average NUMERIC(3, 2) DEFAULT 0.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- GENRES TABLE
CREATE TABLE IF NOT EXISTS public.genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MOVIE_GENRES TABLE
CREATE TABLE IF NOT EXISTS public.movie_genres (
  movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
  genre_id UUID REFERENCES public.genres(id) ON DELETE CASCADE,
  PRIMARY KEY (movie_id, genre_id)
);

-- ACTORS TABLE
CREATE TABLE IF NOT EXISTS public.actors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT DEFAULT 'Actor', -- Actor, Director, Writer
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MOVIE_ACTORS TABLE
CREATE TABLE IF NOT EXISTS public.movie_actors (
  movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.actors(id) ON DELETE CASCADE,
  character_name TEXT,
  PRIMARY KEY (movie_id, actor_id)
);

-- COLLECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  cover_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- COLLECTION_MOVIES TABLE
CREATE TABLE IF NOT EXISTS public.collection_movies (
  collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE,
  movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  PRIMARY KEY (collection_id, movie_id)
);

-- SUBTITLES TABLE
CREATE TABLE IF NOT EXISTS public.subtitles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  language TEXT NOT NULL,
  file_path TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  format TEXT DEFAULT 'vtt',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WATCH_HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.watch_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
  progress_seconds REAL NOT NULL DEFAULT 0,
  duration_seconds REAL NOT NULL DEFAULT 0,
  percentage REAL DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  last_watched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, movie_id)
);

-- FAVORITES TABLE
CREATE TABLE IF NOT EXISTS public.favorites (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, movie_id)
);

-- RATINGS TABLE
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, movie_id)
);

-- TAGS TABLE
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL
);

-- MOVIE_TAGS TABLE
CREATE TABLE IF NOT EXISTS public.movie_tags (
  movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (movie_id, tag_id)
);

-- SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_movies_slug ON public.movies(slug);
CREATE INDEX IF NOT EXISTS idx_movies_release_year ON public.movies(release_year);
CREATE INDEX IF NOT EXISTS idx_movies_created_at ON public.movies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_watch_history_user ON public.watch_history(user_id, last_watched_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites(user_id);

-- TRIGGER FOR PROFILE AUTOMATIC CREATION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- DROP IF EXISTS BEFORE RE-CREATING TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
