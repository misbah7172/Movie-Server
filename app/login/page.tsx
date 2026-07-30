"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthService, ADMIN_EMAIL } from "../../lib/auth";
import { Play, LogIn, Mail, Lock, UserPlus, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await AuthService.loginWithEmail(email, password);
      if (user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message || "Failed to log in. Check your credentials.");
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!username || !email || !password) {
      setError("Please fill out all required signup fields.");
      setLoading(false);
      return;
    }

    try {
      const user = await AuthService.signUpWithEmail(username, email, password);
      if (user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create account.");
      setLoading(false);
    }
  };

  const handleQuickAdminLogin = async () => {
    setEmail(ADMIN_EMAIL);
    setPassword("12345");
    setLoading(true);
    try {
      await AuthService.loginWithEmail(ADMIN_EMAIL, "12345");
      router.push("/admin");
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#08080a] flex items-center justify-center p-4 select-none overflow-hidden">
      {/* Background Hero Artwork Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1920&auto=format&fit=crop"
          alt="Background"
          className="w-full h-full object-cover filter brightness-25 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08080a] via-[#08080a]/80 to-[#08080a]/60" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md glass-panel rounded-3xl p-8 border border-zinc-800 shadow-2xl space-y-6"
      >
        {/* CineStream Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#E50914]/20 border border-[#E50914]/40 rounded-full text-[#E50914] text-xs font-bold uppercase tracking-wider mb-2">
            <Play className="w-3.5 h-3.5 fill-[#E50914]" />
            <span>CineStream Media Platform</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">
            Sign In / <span className="text-[#E50914]">Register</span>
          </h1>
          <p className="text-xs text-zinc-400">
            Role-Based Access Control for your personal movie server
          </p>
        </div>

        {/* Tab Toggle: Login vs Sign Up */}
        <div className="grid grid-cols-2 p-1 bg-zinc-900/90 rounded-xl border border-zinc-800">
          <button
            onClick={() => {
              setActiveTab("login");
              setError("");
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-2 ${
              activeTab === "login"
                ? "bg-[#E50914] text-white shadow-lg shadow-[#E50914]/40"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("signup");
              setError("");
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-2 ${
              activeTab === "signup"
                ? "bg-[#E50914] text-white shadow-lg shadow-[#E50914]/40"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Sign Up</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        {/* Login Form */}
        {activeTab === "login" ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-zinc-900/90 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#E50914]"
                  required
                />
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-zinc-900/90 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#E50914]"
                  required
                />
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#E50914] hover:bg-[#B81D24] text-white font-bold text-sm rounded-xl shadow-lg shadow-[#E50914]/40 flex items-center justify-center space-x-2 transition-transform transform active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? "Authenticating..." : "Sign In to Stream"}</span>
            </button>
          </form>
        ) : (
          /* Sign Up Form */
          <form onSubmit={handleSignUpSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                Full Name / Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="John Doe"
                className="w-full p-3 bg-zinc-900/90 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#E50914]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-zinc-900/90 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#E50914]"
                  required
                />
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-zinc-900/90 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#E50914]"
                  required
                />
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#E50914] hover:bg-[#B81D24] text-white font-bold text-sm rounded-xl shadow-lg shadow-[#E50914]/40 flex items-center justify-center space-x-2 transition-transform transform active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? "Creating Account..." : "Create Free Account"}</span>
            </button>
          </form>
        )}

        {/* Preset Admin Quick Login */}
        <div className="border-t border-zinc-800/80 pt-4 space-y-3">
          <p className="text-xs font-semibold text-center text-zinc-400 uppercase">
            Preset Admin Access
          </p>

          <button
            onClick={handleQuickAdminLogin}
            className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-amber-500/50 text-amber-400 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-colors shadow-lg"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Login as Preset Admin ({ADMIN_EMAIL})</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
