"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { AuthService, AuthUser } from "@/lib/auth";
import { User, Shield, Mail, Calendar, Camera } from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(AuthService.getCurrentUserSync());
  }, []);

  return (
    <div className="min-h-screen bg-[#08080a] text-white">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white uppercase flex items-center space-x-3">
            <User className="w-8 h-8 text-[#E50914]" />
            <span>User <span className="text-[#E50914]">Profile</span></span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage your account credentials and personal avatar
          </p>
        </div>

        <div className="glass-panel p-8 rounded-2xl border border-zinc-800 space-y-8">
          {/* Avatar Header */}
          <div className="flex items-center space-x-6">
            <div className="relative">
              <img
                src={
                  user?.avatar_url ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop"
                }
                alt="Avatar"
                className="w-24 h-24 rounded-full border-2 border-[#E50914] object-cover shadow-xl"
              />
              <button className="absolute bottom-0 right-0 p-2 bg-[#E50914] text-white rounded-full shadow-lg">
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white">{user?.username}</h2>
              <p className="text-sm text-zinc-400">{user?.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-[#E50914]/20 border border-[#E50914]/40 text-[#E50914] rounded-md text-xs font-bold uppercase">
                Role: {user?.role}
              </span>
            </div>
          </div>

          <div className="space-y-4 border-t border-zinc-800 pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={user?.username || ""}
                  disabled
                  className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
