// src/components/Header.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Bell, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { db } from "../db";

const API_BASE = "http://127.0.0.1:8000/api";

type Profile = {
  name: string;
  email: string;
  role: string;
  avatar_seed: string;
  avatar_url?: string | null;
};

type SettingsDTO = {
  profile: Profile;
};

const Header: React.FC = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile>({
    name: "User",
    email: "",
    role: "Administrator",
    avatar_seed: "User",
    avatar_url: null,
  });

  const handleLogout = () => {
    db.logout();
    window.dispatchEvent(new Event("auth-change"));
    navigate("/signin");
  };

  async function loadSettings() {
    try {
      const res = await fetch(`${API_BASE}/settings`);
      if (!res.ok) return;
      const json: SettingsDTO = await res.json();
      setProfile(json.profile);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    loadSettings();
    const onChanged = () => loadSettings();
    window.addEventListener("fishifox-settings-changed", onChanged);
    return () => window.removeEventListener("fishifox-settings-changed", onChanged);
  }, []);

  const avatarSrc = useMemo(() => {
    return (
      profile.avatar_url ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
        profile.avatar_seed || profile.name || "User"
      )}`
    );
  }, [profile.avatar_url, profile.avatar_seed, profile.name]);

  return (
    <header className="h-24 flex items-center justify-between px-10 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white/80 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-6 flex-1">
        <div className="flex items-center gap-3 flex-1 max-xl">{/* left area */}</div>
      </div>

      <div className="flex items-center gap-6">
        <button className="p-3 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all relative group">
          <Bell size={22} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-white dark:border-slate-900"></span>
        </button>

        <div className="flex items-center gap-4 pl-2 group relative">
          <div className="text-right hidden md:block">
            <p className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight leading-none">
              {profile.name}
            </p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              {profile.role}
            </p>
          </div>

          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 p-0.5 border border-primary/10 group-hover:border-primary/30 transition-all overflow-hidden">
              <img
                src={avatarSrc}
                alt="user"
                className="w-full h-full rounded-[0.9rem] object-cover bg-white dark:bg-slate-900"
              />
            </div>

            <button
              onClick={handleLogout}
              className="absolute -top-1 -right-1 p-1.5 bg-rose-500 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity transform hover:scale-110 active:scale-95"
              title="Sign Out"
            >
              <LogOut size={12} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;