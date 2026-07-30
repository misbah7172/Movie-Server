import { createClient, SupabaseClient } from "@supabase/supabase-js";

let clientInstance: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (clientInstance) return clientInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://frrepturpyarhdfxufey.supabase.co";
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZycmVwdHVycHlhcmhkZnh1ZmV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.placeholder";

  try {
    clientInstance = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
    return clientInstance;
  } catch (err) {
    console.warn("Could not instantiate Supabase client:", err);
    return null;
  }
}

export async function uploadFileToSupabaseStorage(
  bucket: "movies" | "posters" | "backdrops" | "trailers" | "subtitles",
  filePathName: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<string | null> {
  try {
    const client = getSupabaseAdmin();
    if (!client) return null;

    // Ensure bucket exists
    await client.storage.createBucket(bucket, { public: true }).catch(() => {});

    const { data, error } = await client.storage
      .from(bucket)
      .upload(filePathName, fileBuffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.warn(`Supabase Storage upload to bucket '${bucket}' warning:`, error.message);
      return null;
    }

    const { data: publicUrlData } = client.storage.from(bucket).getPublicUrl(data.path);
    return publicUrlData.publicUrl;
  } catch (err: any) {
    console.warn("Storage upload notice:", err.message);
    return null;
  }
}
