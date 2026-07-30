import { createClient } from "./supabase/client";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  role: "admin" | "user";
}

const LOCAL_USER_KEY = "cinestream_current_user";
export const ADMIN_EMAIL = "misbah244176@gmail.com";
export const DEMO_ADMIN_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

export class AuthService {
  static getCurrentUserSync(): AuthUser | null {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(LOCAL_USER_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    // Default preset admin user if no session stored
    return {
      id: DEMO_ADMIN_ID,
      email: ADMIN_EMAIL,
      username: "Misbah (Admin)",
      avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
      role: "admin",
    };
  }

  static isAdmin(user: AuthUser | null): boolean {
    if (!user) return false;
    return user.role === "admin" || user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  }

  static async loginWithEmail(email: string, password?: string): Promise<AuthUser> {
    const cleanEmail = email.trim().toLowerCase();
    const isAdminUser = cleanEmail === ADMIN_EMAIL.toLowerCase();

    // Check credentials for predefined Admin user
    if (isAdminUser && password && password !== "12345") {
      throw new Error("Invalid password for Admin account.");
    }

    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder") &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password || "12345",
        });
        if (!error && data.user) {
          const user: AuthUser = {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            username: data.user.user_metadata?.username || cleanEmail.split("@")[0],
            avatar_url: data.user.user_metadata?.avatar_url,
            role: isAdminUser ? "admin" : (data.user.user_metadata?.role || "user"),
          };
          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
          }
          return user;
        }
      } catch (e) {
        console.warn("Supabase login notice:", e);
      }
    }

    const mockUser: AuthUser = {
      id: isAdminUser ? DEMO_ADMIN_ID : `usr-${Date.now().toString(36)}`,
      email: cleanEmail,
      username: isAdminUser ? "Misbah (Admin)" : cleanEmail.split("@")[0],
      avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
      role: isAdminUser ? "admin" : "user",
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(mockUser));
    }
    return mockUser;
  }

  static async signUpWithEmail(username: string, email: string, password?: string): Promise<AuthUser> {
    const cleanEmail = email.trim().toLowerCase();
    const isAdminUser = cleanEmail === ADMIN_EMAIL.toLowerCase();

    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder") &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: password || "12345",
          options: {
            data: {
              username,
              role: isAdminUser ? "admin" : "user",
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          const newUser: AuthUser = {
            id: data.user.id,
            email: cleanEmail,
            username,
            avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop",
            role: isAdminUser ? "admin" : "user",
          };
          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(newUser));
          }
          return newUser;
        }
      } catch (e) {
        console.warn("Supabase signup notice:", e);
      }
    }

    const newUser: AuthUser = {
      id: isAdminUser ? DEMO_ADMIN_ID : `usr-${Date.now().toString(36)}`,
      email: cleanEmail,
      username,
      avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop",
      role: isAdminUser ? "admin" : "user",
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(newUser));
    }
    return newUser;
  }

  static async loginWithGoogle() {
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder") &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      const supabase = createClient();
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    } else {
      const googleUser: AuthUser = {
        id: "c2ffbc99-9c0b-4ef8-bb6d-6bb9bd380a33",
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
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder") &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem(LOCAL_USER_KEY);
      window.location.href = "/login";
    }
  }
}
