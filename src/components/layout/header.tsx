"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  User,
  Home,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { AuthService } from "@/services/auth.service";
import { useRouter } from "next/navigation";

export const Header = () => {
  const router = useRouter();

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    setIsMobileMenuOpen(false);
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
      <header className="fixed top-0 left-0 right-0 h-16 sm:h-20 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="h-full flex items-center justify-between px-4 sm:px-6 lg:px-8 max-w-9xl mx-auto">
          {/* Logo Section */}
          <div
            className="flex items-center gap-2 sm:gap-4 cursor-pointer group flex-shrink-0"
            onClick={() => router.push("/dashboard")}
          >
            <div className="relative">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-blue-600 via-purple-600 to-indigo-600 flex items-center justify-center group-hover:scale-105 transition-all duration-300">
                <span className="text-white font-bold text-sm sm:text-xl">
                  A
                </span>
              </div>
              <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-tr from-green-400 to-emerald-500 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg sm:text-xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Adrify
              </h1>
              <p className="text-xs text-slate-500 font-medium tracking-wide">
                Créer • Vérifier • Partager
              </p>
            </div>
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-4 lg:mx-8">
            <div
              className={`relative w-full transition-all duration-300 ${
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

          

          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-2 lg:gap-3 flex-shrink-0">
            {!isAuth ? (
              <>
                <button
                  className="px-3 lg:px-5 py-2 lg:py-2.5 cursor-pointer rounded-xl font-semibold text-slate-700 bg-white/60 border border-slate-200/60 backdrop-blur-sm hover:bg-white/90 hover:border-slate-300/60 transition-all duration-300 text-sm"
                  onClick={() => router.push("/auth/login")}
                >
                  Connexion
                </button>
                <button
                  className="px-3 lg:px-5 py-2 lg:py-2.5 cursor-pointer rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 text-sm"
                  onClick={() => router.push("/auth/register")}
                >
                  Inscription
                </button>
              </>
            ) : (
              <>
                {/* Create Address Button - Hidden on small screens */}
                <button
                  onClick={() => router.push("/dashboard/addresses/new")}
                  className="hidden lg:flex group px-5 py-2.5 cursor-pointer rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 items-center gap-2"
                >
                  <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                  Nouvelle adresse
                </button>

                {/* Plus button for medium screens */}
                <button
                  onClick={() => router.push("/dashboard/addresses/new")}
                  className="lg:hidden p-2.5 cursor-pointer rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105"
                >
                  <Plus className="w-4 h-4 text-white" />
                </button>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="p-2 sm:p-2.5 cursor-pointer rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105"
                  >
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </button>

                  {/* Desktop Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 top-12 sm:top-14 w-56 sm:w-60 bg-white/95 backdrop-blur-xl rounded-xl border border-slate-200/60 overflow-hidden animate-in slide-in-from-top-2 duration-200 z-50">
                      <div className="p-3 sm:p-4 border-b border-slate-200/50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                            {initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-800 text-sm truncate">
                              {profile?.name}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
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
                            onClick={() => {
                              router.push(item.url);
                              setIsDropdownOpen(false);
                            }}
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

          {/* Mobile Menu Button */}
          <div className="sm:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 sm:hidden">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute top-16 left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-slate-200/50 animate-in slide-in-from-top-2 duration-200">
            {/* Mobile Search */}
            <div className="p-4 border-b border-slate-200/50">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearch}
                  placeholder="Rechercher une adresse..."
                  className="w-full h-12 px-4 pr-12 bg-slate-50 rounded-xl placeholder-slate-400 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Search className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Mobile Menu Items */}
            {!isAuth ? (
              <div className="p-4 space-y-3">
                <button
                  className="w-full px-4 py-3 cursor-pointer rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all duration-300 text-center"
                  onClick={() => {
                    router.push("/auth/login");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Connexion
                </button>
                <button
                  className="w-full px-4 py-3 cursor-pointer rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 text-center"
                  onClick={() => {
                    router.push("/auth/register");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Inscription
                </button>
              </div>
            ) : (
              <div className="p-4">
                {/* User Info */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 text-sm truncate">
                      {profile?.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {profile?.email}
                    </p>
                  </div>
                </div>

                {/* Mobile Menu Items */}
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      router.push("/dashboard/addresses/new");
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                  >
                    <Plus className="w-4 h-4" />
                    Nouvelle adresse
                  </button>

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
                      onClick={() => {
                        router.push(item.url);
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-50 transition-all duration-200 text-left"
                    >
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                      <span className="font-medium text-slate-700">
                        {item.label}
                      </span>
                    </button>
                  ))}

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-red-50 transition-all duration-200 text-left"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span className="font-medium text-red-600">
                      Déconnexion
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Desktop Click outside to close dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </>
  );
};
