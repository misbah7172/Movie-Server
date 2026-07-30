"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AuthService, AuthUser } from "../../lib/auth";
import {
  Play,
  Search,
  Film,
  Grid,
  Layers,
  Heart,
  History,
  Shield,
  Settings,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setUser(AuthService.getCurrentUserSync());

    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navLinks = [
    { name: "Home", href: "/", icon: Play },
    { name: "Movies", href: "/movies", icon: Film },
    { name: "Collections", href: "/collections", icon: Layers },
    { name: "Genres", href: "/genres", icon: Grid },
    { name: "Favorites", href: "/favorites", icon: Heart },
    { name: "History", href: "/history", icon: History },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass-nav shadow-lg shadow-black/60 py-3" : "bg-gradient-to-b from-black/90 via-black/40 to-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-[#E50914] flex items-center justify-center shadow-md shadow-[#E50914]/40 group-hover:scale-105 transition-transform">
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            </div>
            <span className="text-xl font-black tracking-tight text-white uppercase">
              Cine<span className="text-[#E50914]">Stream</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-[#E50914] flex items-center space-x-1.5 ${
                    active ? "text-[#E50914] font-semibold" : "text-zinc-300"
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden md:flex items-center space-x-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search title, actor, genre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 lg:w-64 pl-9 pr-4 py-1.5 text-xs bg-zinc-900/80 border border-zinc-700/80 rounded-full text-white placeholder-zinc-400 focus:outline-none focus:w-72 focus:border-[#E50914] transition-all"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2" />
          </form>

          {user?.role === "admin" && (
            <Link
              href="/admin"
              className="px-3 py-1.5 bg-[#E50914]/20 border border-[#E50914]/40 text-[#E50914] hover:bg-[#E50914] hover:text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin</span>
            </Link>
          )}

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-2 focus:outline-none"
            >
              <img
                src={
                  user?.avatar_url ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop"
                }
                alt="Avatar"
                className="w-8 h-8 rounded-full border border-zinc-700 object-cover hover:border-[#E50914] transition-colors"
              />
            </button>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 glass-panel rounded-xl shadow-2xl py-2 z-50 text-sm border border-zinc-800"
                >
                  <div className="px-4 py-2 border-b border-zinc-800">
                    <p className="font-semibold text-white">{user?.username}</p>
                    <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
                  </div>

                  <Link
                    href="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center space-x-2.5 px-4 py-2 text-zinc-300 hover:bg-zinc-800/80 hover:text-white transition-colors"
                  >
                    <User className="w-4 h-4 text-zinc-400" />
                    <span>Profile</span>
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center space-x-2.5 px-4 py-2 text-zinc-300 hover:bg-zinc-800/80 hover:text-white transition-colors"
                  >
                    <Settings className="w-4 h-4 text-zinc-400" />
                    <span>Settings</span>
                  </Link>

                  {user?.role === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center space-x-2.5 px-4 py-2 text-[#E50914] hover:bg-zinc-800/80 transition-colors"
                    >
                      <Shield className="w-4 h-4" />
                      <span>Admin Dashboard</span>
                    </Link>
                  )}

                  <div className="border-t border-zinc-800 my-1" />

                  <button
                    onClick={() => AuthService.logout()}
                    className="w-full flex items-center space-x-2.5 px-4 py-2 text-red-400 hover:bg-zinc-800/80 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="md:hidden flex items-center space-x-3">
          <Link href="/search" className="text-zinc-300 p-2">
            <Search className="w-5 h-5" />
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-zinc-300 p-2 focus:outline-none"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden glass-panel border-b border-zinc-800 px-6 py-4 space-y-3"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 py-2 text-zinc-300 hover:text-[#E50914]"
              >
                <link.icon className="w-5 h-5 text-[#E50914]" />
                <span className="font-medium">{link.name}</span>
              </Link>
            ))}
            {user?.role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 py-2 text-[#E50914] font-semibold"
              >
                <Shield className="w-5 h-5" />
                <span>Admin Dashboard</span>
              </Link>
            )}
            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-400">Signed in as {user?.username}</span>
              <button
                onClick={() => AuthService.logout()}
                className="text-xs text-red-400 font-semibold"
              >
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
