import { createClient } from "@/lib/supabase/client";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  role: "admin" | "user";
}

const LOCAL_USER_KEY = "cinestream_current_user";

export class AuthService {
  static getCurrentUserSync(): AuthUser | null {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(LOCAL_USER_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    // Default admin user for smooth out-of-the-box local testing
    return {
      id: "u-admin-01",
      email: "admin@cinestream.local",
      username: "AdminUser",
      avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
      role: "admin",
    };
  }

  static async getCurrentUser(): Promise<AuthUser | null> {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co") {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          return {
            id: user.id,
            email: user.email || "",
            username: user.user_metadata?.username || user.email?.split("@")[0] || "User",
            avatar_url: user.user_metadata?.avatar_url,
            role: user.user_metadata?.role || "user",
          };
        }
      } catch (err) {
        console.warn("Supabase auth check fallback:", err);
      }
    }

    return this.getCurrentUserSync();
  }

  static async loginWithEmail(email: string, password?: string): Promise<AuthUser> {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co") {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: password || "",
      });
      if (error) throw error;
      if (data.user) {
        const user: AuthUser = {
          id: data.user.id,
          email: data.user.email || "",
          username: data.user.user_metadata?.username || email.split("@")[0],
          avatar_url: data.user.user_metadata?.avatar_url,
          role: data.user.user_metadata?.role || "user",
        };
        if (typeof window !== "undefined") {
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
        }
        return user;
      }
    }

    // Local authentication fallback for instant demo testing
    const isAdmin = email.includes("admin");
    const mockUser: AuthUser = {
      id: isAdmin ? "u-admin-01" : `u-${Date.now()}`,
      email,
      username: email.split("@")[0],
      avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
      role: isAdmin ? "admin" : "user",
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(mockUser));
    }
    return mockUser;
  }

  static async loginWithGoogle() {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co") {
      const supabase = createClient();
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    } else {
      // Mock Google login
      const googleUser: AuthUser = {
        id: "u-google-01",
        email: "google.user@gmail.com",
        username: "GoogleUser",
        avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop",
        role: "user",
      };
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(googleUser));
      }
      window.location.href = "/";
    }
  }

  static async logout() {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co") {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem(LOCAL_USER_KEY);
      window.location.href = "/login";
    }
  }
}
