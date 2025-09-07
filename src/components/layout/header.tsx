"use client";

import React, { useState, useEffect } from "react";
import { Search, Plus, User, Home, Settings, LogOut } from "lucide-react";
import { AuthService } from "@/services/auth.service";
import { useRouter } from "next/navigation"

export const Header = () => {
  const router = useRouter();

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [profile, setProfile] = useState<{
    name: string;
    email: string;
  } | null>(null);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      console.log("Searching for:", searchQuery);
    }
  };

  const handleLogout = async () => {
    await AuthService.logout();
    setIsAuth(false);
    setProfile(null);
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await AuthService.profile();
        setProfile({ name: data.name, email: data.email });
        setIsAuth(true);
      } catch {
        setIsAuth(false);
        setProfile(null);
      }
    };
    fetchProfile();
  }, []);

  // Avatar initials
  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-20 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="h-full flex items-center justify-between px-8 max-w-9xl mx-auto">
          {/* Logo Section */}
          <div
            className="flex items-center gap-4 cursor-pointer group"
            onClick={() => router.push("/dashboard")}
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-purple-600 to-indigo-600 flex items-center justify-center group-hover:scale-105 transition-all duration-300">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-tr from-green-400 to-emerald-500 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Adrify
              </h1>
              <p className="text-xs text-slate-500 font-medium tracking-wide">
                Créer • Vérifier • Partager
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-8">
            <div
              className={`relative transition-all duration-300 ${
                isSearchFocused ? "scale-[1.02]" : ""
              }`}
            >
              <div
                className={`relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-sm border-2 transition-all duration-300 ${
                  isSearchFocused ? "border-blue-400" : "border-slate-200/60"
                }`}
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  onKeyDown={handleSearch}
                  placeholder="Rechercher une adresse, un quartier..."
                  className="w-full h-12 px-5 pr-14 bg-transparent placeholder-slate-400 text-slate-700 font-medium focus:outline-none"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div
                    className={`p-2 rounded-xl transition-all duration-300 cursor-pointer ${
                      searchQuery
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    <Search className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {!isAuth ? (
              <>
                <button
                  className="px-5 py-2.5 cursor-pointer rounded-xl font-semibold text-slate-700 bg-white/60 border border-slate-200/60 backdrop-blur-sm hover:bg-white/90 hover:border-slate-300/60 transition-all duration-300"
                  onClick={() => router.push("/auth/login")}
                >
                  Connexion
                </button>
                <button
                  className="px-5 py-2.5 cursor-pointer rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105"
                  onClick={() => router.push("/auth/register")}
                >
                  Inscription
                </button>
              </>
            ) : (
              <>
                {/* Create Address Button */}
                <button
                  onClick={() => router.push("/dashboard/addresses/new")}
                  className="group px-5 py-2.5 cursor-pointer rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                  Nouvelle adresse
                </button>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="p-2.5 cursor-pointer rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105"
                  >
                    <User className="w-5 h-5 text-white" />
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 top-14 w-60 bg-white/95 backdrop-blur-xl rounded-xl border border-slate-200/60 overflow-hidden animate-in slide-in-from-top-2 duration-200 z-50">
                      <div className="p-4 border-b border-slate-200/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">
                              {profile?.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {profile?.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-2">
                        {[
                          {
                            icon: Home,
                            label: "Dashboard",
                            url: "/dashboard",
                            color: "text-blue-600",
                          },
                          {
                            icon: User,
                            label: "Profil",
                            url: "/dashboard/user",
                            color: "text-purple-600",
                          },
                          {
                            icon: Settings,
                            label: "Paramètres",
                            url: "/dashboard/settings",
                            color: "text-slate-600",
                          },
                        ].map((item, index) => (
                          <button
                            key={index}
                            onClick={() => router.push(item.url)}
                            className="w-full cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-all duration-200 text-left group"
                          >
                            <item.icon
                              className={`w-4 h-4 ${item.color} group-hover:scale-110 transition-transform duration-200`}
                            />
                            <span className="font-medium text-slate-700 text-sm">
                              {item.label}
                            </span>
                          </button>
                        ))}

                        <hr className="my-2 border-slate-200/50" />

                        <button
                          onClick={handleLogout}
                          className="w-full cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 transition-all duration-200 text-left group"
                        >
                          <LogOut className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform duration-200" />
                          <span className="font-medium text-red-600 text-sm">
                            Déconnexion
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </>
  );
};
