import { Movie, Genre, Actor, Collection, Subtitle, WatchHistory } from "../types/database";
import { db, initPostgresDatabase } from "../lib/db";

export class MovieService {
  private static async getClient() {
    await initPostgresDatabase();
    return db;
  }

  static async getAllMovies(): Promise<Movie[]> {
    try {
      const pool = await this.getClient();
      const res = await pool.query(`
        SELECT m.*, 
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object('id', g.id, 'name', g.name, 'slug', g.slug)
            ) FILTER (WHERE g.id IS NOT NULL), '[]'
          ) as genres
        FROM movies m
        LEFT JOIN movie_genres mg ON m.id = mg.movie_id
        LEFT JOIN genres g ON mg.genre_id = g.id
        GROUP BY m.id
        ORDER BY m.created_at DESC;
      `);
      return res.rows;
    } catch (err) {
      console.error("Error fetching movies from PostgreSQL:", err);
      return [];
    }
  }

  static async getMovieById(id: string): Promise<Movie | null> {
    try {
      const pool = await this.getClient();
      const res = await pool.query(
        `
        SELECT m.*, 
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object('id', g.id, 'name', g.name, 'slug', g.slug)
            ) FILTER (WHERE g.id IS NOT NULL), '[]'
          ) as genres
        FROM movies m
        LEFT JOIN movie_genres mg ON m.id = mg.movie_id
        LEFT JOIN genres g ON mg.genre_id = g.id
        WHERE m.id::text = $1 OR m.slug = $1
        GROUP BY m.id;
      `,
        [id]
      );
      return res.rows[0] || null;
    } catch (err) {
      console.error("Error fetching movie by ID from PostgreSQL:", err);
      return null;
    }
  }

  static async getFeaturedMovies(): Promise<Movie[]> {
    try {
      const pool = await this.getClient();
      const res = await pool.query(`SELECT * FROM movies WHERE is_featured = true ORDER BY created_at DESC;`);
      return res.rows;
    } catch (err) {
      console.error("Error fetching featured movies:", err);
      return [];
    }
  }

  static async searchMovies(
    query: string,
    filters?: { genre?: string; year?: number; resolution?: string }
  ): Promise<Movie[]> {
    try {
      const pool = await this.getClient();
      let sql = `
        SELECT m.*, 
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object('id', g.id, 'name', g.name, 'slug', g.slug)
            ) FILTER (WHERE g.id IS NOT NULL), '[]'
          ) as genres
        FROM movies m
        LEFT JOIN movie_genres mg ON m.id = mg.movie_id
        LEFT JOIN genres g ON mg.genre_id = g.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (query && query.trim() !== "") {
        params.push(`%${query.trim()}%`);
        sql += ` AND (m.title ILIKE $${params.length} OR m.description ILIKE $${params.length})`;
      }

      if (filters?.year) {
        params.push(filters.year);
        sql += ` AND m.release_year = $${params.length}`;
      }

      if (filters?.resolution) {
        params.push(`%${filters.resolution}%`);
        sql += ` AND m.resolution ILIKE $${params.length}`;
      }

      sql += ` GROUP BY m.id ORDER BY m.created_at DESC;`;

      const res = await pool.query(sql, params);
      let results = res.rows;

      if (filters?.genre) {
        results = results.filter((m: Movie) =>
          m.genres?.some((g: Genre) => g.slug === filters.genre || g.name === filters.genre)
        );
      }

      return results;
    } catch (err) {
      console.error("Error searching movies:", err);
      return [];
    }
  }

  static async addMovie(movie: Omit<Movie, "id" | "created_at" | "updated_at">): Promise<Movie> {
    const pool = await this.getClient();
    const res = await pool.query(
      `
      INSERT INTO movies (
        title, original_title, slug, description, release_year, runtime,
        resolution, codec, language, poster_path, backdrop_path, movie_path,
        trailer_path, duration, file_size, aspect_ratio, is_featured, rating_average
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      ) RETURNING *;
    `,
      [
        movie.title,
        movie.original_title || null,
        movie.slug,
        movie.description || null,
        movie.release_year || null,
        movie.runtime || null,
        movie.resolution || "1080p",
        movie.codec || "H.264",
        movie.language || "English",
        movie.poster_path || null,
        movie.backdrop_path || null,
        movie.movie_path,
        movie.trailer_path || null,
        movie.duration || 0,
        movie.file_size || 0,
        movie.aspect_ratio || "16:9",
        movie.is_featured || false,
        movie.rating_average || 5.0,
      ]
    );

    const insertedMovie = res.rows[0];

    // Connect genres if specified
    if (movie.genres && movie.genres.length > 0) {
      for (const g of movie.genres) {
        let genreId = g.id;
        const genreRes = await pool.query(
          `INSERT INTO genres (name, slug) VALUES ($1, $2) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id;`,
          [g.name || g.slug, g.slug || g.id]
        );
        genreId = genreRes.rows[0].id;
        await pool.query(
          `INSERT INTO movie_genres (movie_id, genre_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
          [insertedMovie.id, genreId]
        );
      }
    }

    return insertedMovie;
  }

  static async saveMovieFile(
    movieId: string,
    filename: string,
    mimeType: string,
    fileBuffer: Buffer
  ): Promise<string> {
    const pool = await this.getClient();
    const res = await pool.query(
      `
      INSERT INTO movie_files (movie_id, filename, mime_type, file_data)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
    `,
      [movieId, filename, mimeType, fileBuffer]
    );
    const fileId = res.rows[0].id;

    // Update movie record movie_path to point to this PostgreSQL stream route
    const streamUrl = `/api/stream/${movieId}`;
    await pool.query(`UPDATE movies SET movie_path = $1 WHERE id = $2;`, [streamUrl, movieId]);

    return streamUrl;
  }

  static async getMovieFile(
    idOrMovieId: string
  ): Promise<{ filename: string; mime_type: string; file_data: Buffer } | null> {
    try {
      const pool = await this.getClient();
      const res = await pool.query(
        `
        SELECT filename, mime_type, file_data
        FROM movie_files
        WHERE movie_id::text = $1 OR id::text = $1
        ORDER BY created_at DESC
        LIMIT 1;
      `,
        [idOrMovieId]
      );
      if (res.rows.length === 0) return null;
      return res.rows[0];
    } catch (err) {
      console.error("Error fetching movie file binary from PostgreSQL:", err);
      return null;
    }
  }

  static async updateMovie(id: string, updates: Partial<Movie>): Promise<Movie | null> {
    const pool = await this.getClient();
    const res = await pool.query(
      `
      UPDATE movies 
      SET title = COALESCE($2, title),
          description = COALESCE($3, description),
          updated_at = NOW()
      WHERE id::text = $1 OR slug = $1
      RETURNING *;
    `,
      [id, updates.title || null, updates.description || null]
    );
    return res.rows[0] || null;
  }

  static async deleteMovie(id: string): Promise<boolean> {
    const pool = await this.getClient();
    const res = await pool.query(`DELETE FROM movies WHERE id::text = $1 OR slug = $1;`, [id]);
    return (res.rowCount || 0) > 0;
  }

  static async getAllGenres(): Promise<Genre[]> {
    try {
      const pool = await this.getClient();
      const res = await pool.query(`SELECT * FROM genres ORDER BY name ASC;`);
      return res.rows;
    } catch (err) {
      console.error("Error fetching genres:", err);
      return [];
    }
  }

  static async getAllCollections(): Promise<Collection[]> {
    try {
      const pool = await this.getClient();
      const res = await pool.query(`SELECT * FROM collections ORDER BY name ASC;`);
      return res.rows;
    } catch (err) {
      console.error("Error fetching collections:", err);
      return [];
    }
  }

  static async updateWatchHistory(
    userId: string,
    movieId: string,
    progressSeconds: number,
    durationSeconds: number
  ): Promise<WatchHistory> {
    const pool = await this.getClient();
    const percentage = durationSeconds > 0 ? (progressSeconds / durationSeconds) * 100 : 0;
    const completed = percentage >= 92;

    const res = await pool.query(
      `
      INSERT INTO watch_history (user_id, movie_id, progress_seconds, duration_seconds, percentage, completed, last_watched_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (user_id, movie_id) 
      DO UPDATE SET 
        progress_seconds = EXCLUDED.progress_seconds,
        duration_seconds = EXCLUDED.duration_seconds,
        percentage = EXCLUDED.percentage,
        completed = EXCLUDED.completed,
        last_watched_at = NOW()
      RETURNING *;
    `,
      [userId, movieId, progressSeconds, durationSeconds, percentage, completed]
    );

    return res.rows[0];
  }

  static async getUserWatchHistory(userId: string): Promise<WatchHistory[]> {
    try {
      const pool = await this.getClient();
      const res = await pool.query(
        `
        SELECT wh.*, 
          json_build_object(
            'id', m.id,
            'title', m.title,
            'poster_path', m.poster_path,
            'backdrop_path', m.backdrop_path,
            'duration', m.duration,
            'resolution', m.resolution
          ) as movie
        FROM watch_history wh
        JOIN movies m ON wh.movie_id = m.id
        WHERE wh.user_id = $1
        ORDER BY wh.last_watched_at DESC;
      `,
        [userId]
      );
      return res.rows;
    } catch (err) {
      console.error("Error fetching watch history:", err);
      return [];
    }
  }

  static async toggleFavorite(userId: string, movieId: string): Promise<boolean> {
    const pool = await this.getClient();
    const check = await pool.query(`SELECT 1 FROM favorites WHERE user_id = $1 AND movie_id = $2;`, [
      userId,
      movieId,
    ]);

    if (check.rows.length > 0) {
      await pool.query(`DELETE FROM favorites WHERE user_id = $1 AND movie_id = $2;`, [userId, movieId]);
      return false;
    } else {
      await pool.query(`INSERT INTO favorites (user_id, movie_id) VALUES ($1, $2);`, [userId, movieId]);
      return true;
    }
  }

  static async getUserFavorites(userId: string): Promise<Movie[]> {
    try {
      const pool = await this.getClient();
      const res = await pool.query(
        `
        SELECT m.* 
        FROM favorites f
        JOIN movies m ON f.movie_id = m.id
        WHERE f.user_id = $1
        ORDER BY f.created_at DESC;
      `,
        [userId]
      );
      return res.rows;
    } catch (err) {
      console.error("Error fetching user favorites:", err);
      return [];
    }
  }

  static async getStorageStats() {
    try {
      const pool = await this.getClient();
      const res = await pool.query(`
        SELECT 
          COUNT(*)::int as total_movies,
          COALESCE(SUM(file_size), 0)::bigint as total_size_bytes,
          COALESCE(SUM(duration), 0)::real as total_duration_seconds
        FROM movies;
      `);
      const row = res.rows[0] || {};
      const totalMovies = row.total_movies || 0;
      const totalSizeBytes = Number(row.total_size_bytes || 0);
      const totalDurationSeconds = Number(row.total_duration_seconds || 0);

      return {
        totalMovies,
        totalSizeBytes,
        totalSizeGB: (totalSizeBytes / (1024 * 1024 * 1024)).toFixed(2),
        totalHours: (totalDurationSeconds / 3600).toFixed(1),
      };
    } catch (err) {
      console.error("Error fetching storage stats:", err);
      return {
        totalMovies: 0,
        totalSizeBytes: 0,
        totalSizeGB: "0.00",
        totalHours: "0.0",
      };
    }
  }
}
