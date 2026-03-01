// src/App.tsx
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Services from "./pages/Services";
import Invoices from "./pages/Invoices";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import Expirations from "./pages/Expirations";
import Quotations from "./pages/Quotations";
import UpcomingInvoices from "./pages/UpcomingInvoices";
import Settings from "./pages/Settings";
import SignIn from "./pages/SignIn";

import { db } from "./db";

const API_BASE = "http://127.0.0.1:8000/api";

/** Only two modes + two accents */
type ThemeMode = "light" | "dark";
type Accent = "purple" | "teal";

type AppearanceDTO = {
  theme: ThemeMode;
  accent: Accent;
  reduced_motion: boolean;
};

function applyTheme(theme: ThemeMode) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

function applyAccent(accent: Accent) {
  document.documentElement.setAttribute("data-accent", accent);
}

function applyReducedMotion(on: boolean) {
  document.documentElement.classList.toggle("reduce-motion", on);
}

function applyAppearance(next: AppearanceDTO) {
  applyTheme(next.theme);
  applyAccent(next.accent);
  applyReducedMotion(!!next.reduced_motion);
}

function readAppearance(): AppearanceDTO | null {
  try {
    const raw = localStorage.getItem("fishifox-appearance");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed) return null;
    const theme: ThemeMode = parsed.theme === "dark" ? "dark" : "light";
    const accent: Accent = theme === "dark" ? "teal" : "purple"; // force map
    return { theme, accent, reduced_motion: !!parsed.reduced_motion };
  } catch {
    return null;
  }
}

function writeAppearance(next: AppearanceDTO) {
  try {
    localStorage.setItem("fishifox-appearance", JSON.stringify(next));
  } catch {}
}

/** Force: Light => Purple, Dark => Teal */
function normalizeAppearance(a: any): AppearanceDTO {
  const theme: ThemeMode = a?.theme === "dark" ? "dark" : "light";
  const reduced_motion = !!a?.reduced_motion;
  return theme === "dark"
    ? { theme: "dark", accent: "teal", reduced_motion }
    : { theme: "light", accent: "purple", reduced_motion };
}

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return db.isAuthenticated();
    } catch {
      return false;
    }
  });

  // Apply appearance immediately (all pages)
  useEffect(() => {
    const local = readAppearance();
    const initial = local ?? { theme: "light" as const, accent: "purple" as const, reduced_motion: false };
    const normalized = normalizeAppearance(initial);
    applyAppearance(normalized);
    writeAppearance(normalized);
  }, []);

  // React to Settings changes (and optional backend sync)
  useEffect(() => {
    const handler = async () => {
      const local = readAppearance();
      if (local) applyAppearance(normalizeAppearance(local));

      try {
        const res = await fetch(`${API_BASE}/settings`);
        if (res.ok) {
          const json = await res.json();
          const next = normalizeAppearance(json.appearance);
          applyAppearance(next);
          writeAppearance(next);
        }
      } catch {}
    };

    window.addEventListener("fishifox-settings-changed", handler as EventListener);
    return () => window.removeEventListener("fishifox-settings-changed", handler as EventListener);
  }, []);

  // Auth listener
  useEffect(() => {
    const handleAuthUpdate = () => {
      try {
        setIsAuthenticated(db.isAuthenticated());
      } catch {
        setIsAuthenticated(false);
      }
    };

    window.addEventListener("storage", handleAuthUpdate);
    window.addEventListener("auth-change", handleAuthUpdate as EventListener);

    return () => {
      window.removeEventListener("storage", handleAuthUpdate);
      window.removeEventListener("auth-change", handleAuthUpdate as EventListener);
    };
  }, []);

  return (
    <BrowserRouter>
      {!isAuthenticated ? (
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route path="*" element={<Navigate to="/signin" replace />} />
        </Routes>
      ) : (
        <div className="flex h-screen w-full overflow-hidden" style={{ background: "var(--sidebar-bg)" }}>
          <Sidebar />

          <div
            className="flex-1 overflow-hidden flex flex-col relative z-10 shadow-[0_0_80px_rgba(0,0,0,0.25)]"
            style={{
              background: "var(--panel-bg)",
              borderTopLeftRadius: "3.5rem",
              borderBottomLeftRadius: "3.5rem",
            }}
          >
            <Header />
            <main className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-14 custom-scrollbar">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/services" element={<Services />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/quotations" element={<Quotations />} />
                <Route path="/upcoming" element={<UpcomingInvoices />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:id" element={<ProjectDetails />} />
                <Route path="/expirations" element={<Expirations />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      )}
    </BrowserRouter>
  );
};

export default App;