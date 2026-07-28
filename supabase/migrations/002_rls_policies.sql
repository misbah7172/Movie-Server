-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movie_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movie_actors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtitles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- POLICIES FOR PUBLIC READ ACCESS ON MOVIES & METADATA
CREATE POLICY "Allow public read access for movies" ON public.movies FOR SELECT USING (true);
CREATE POLICY "Allow public read access for genres" ON public.genres FOR SELECT USING (true);
CREATE POLICY "Allow public read access for movie_genres" ON public.movie_genres FOR SELECT USING (true);
CREATE POLICY "Allow public read access for actors" ON public.actors FOR SELECT USING (true);
CREATE POLICY "Allow public read access for movie_actors" ON public.movie_actors FOR SELECT USING (true);
CREATE POLICY "Allow public read access for collections" ON public.collections FOR SELECT USING (true);
CREATE POLICY "Allow public read access for collection_movies" ON public.collection_movies FOR SELECT USING (true);
CREATE POLICY "Allow public read access for subtitles" ON public.subtitles FOR SELECT USING (true);

-- ADMIN FULL ACCESS POLICIES FOR MOVIES & METADATA
CREATE POLICY "Allow admin write access for movies" ON public.movies FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Allow admin write access for genres" ON public.genres FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Allow admin write access for collections" ON public.collections FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- USER PROFILE & HISTORY POLICIES
CREATE POLICY "Allow users to view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow users to update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow users to view own watch history" ON public.watch_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow users to upsert own watch history" ON public.watch_history FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Allow users to manage own favorites" ON public.favorites FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Allow users to manage own ratings" ON public.ratings FOR ALL USING (auth.uid() = user_id);
