import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CrmState, Translations } from "./types";
import FoydalanuvchiPanel from "./components/FoydalanuvchiPanel";
import StaffPanel from "./components/StaffPanel";
import AdminPanel from "./components/AdminPanel";
import Effects from "./components/Effects";
import { ChefHat, RefreshCw, AlertCircle } from "lucide-react";

export default function App() {
  const [state, setState] = useState<CrmState | null>(null);
  const [activePanel, setActivePanel] = useState<'user' | 'staff' | 'admin'>('user');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch state on mount
  const fetchState = async () => {
    try {
      const response = await fetch("/api/state");
      const data = await response.json();
      if (data.success && data.state) {
        setState(data.state);
        // Apply theme on load
        applyTheme(data.state.config.theme);
      } else {
        setError("Ma'lumotlar bazasini yuklashda xatolik yuz berdi.");
      }
    } catch (e) {
      console.error("Error fetching state:", e);
      setError("Server bilan aloqa o'rnatib bo'lmadi.");
    } finally {
      setLoading(false);
    }
  };

  // Log user visit on mount
  const logVisit = async () => {
    try {
      await fetch("/api/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "Kirish", user: "Mehmon (Mobil)" }),
      });
    } catch (e) {
      console.error("Error logging visit:", e);
    }
  };

  useEffect(() => {
    fetchState();
    logVisit();
  }, []);

  // Update backend and local state
  const handleUpdateState = async (updatedFields: Partial<CrmState>) => {
    if (!state) return;
    const newState = { ...state, ...updatedFields };
    // Optimistic local update
    setState(newState);

    try {
      const response = await fetch("/api/state/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      });
      const data = await response.json();
      if (!data.success) {
        console.error("Failed to sync state to server:", data.message);
      }
    } catch (e) {
      console.error("Failed to connect to server to save state:", e);
    }
  };

  // Helper: Theme applier
  const applyTheme = (theme: 'light' | 'dark') => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Set Theme Wrapper
  const handleSetTheme = async (theme: 'light' | 'dark') => {
    if (!state) return;
    applyTheme(theme);
    const updatedConfig = { ...state.config, theme };
    await handleUpdateState({ config: updatedConfig });
  };

  // Set Language Wrapper
  const handleSetLang = async (lang: string) => {
    if (!state) return;
    const updatedConfig = { ...state.config, activeLang: lang as any };
    await handleUpdateState({ config: updatedConfig });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-10 h-10 text-amber-500 animate-spin" />
          <h2 className="text-sm font-bold tracking-widest uppercase text-zinc-400">
            Lazzat CRM Yuklanmoqda...
          </h2>
        </div>
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col items-center text-center gap-4">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <h2 className="text-lg font-bold">Xatolik yuz berdi</h2>
          <p className="text-sm text-zinc-400">{error || "Tizim yuklanishida xatolik."}</p>
          <button
            onClick={() => {
              setLoading(true);
              setError("");
              fetchState();
            }}
            className="px-4 py-2 bg-amber-500 text-black text-xs font-bold rounded-xl hover:bg-amber-600 transition-colors"
          >
            Qayta yuklash 🔄
          </button>
        </div>
      </div>
    );
  }

  // Get active translations
  const activeLang = state.config.activeLang || "uz";
  const t: Translations = state.translations[activeLang] || state.translations["uz"];

  // Background Styles Calculation
  const bgType = state.config.backgroundType;
  const bgValue = state.config.backgroundValue;

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden font-sans text-zinc-800 dark:text-zinc-100 transition-colors duration-200">
      
      {/* 1. DYNAMIC BACKGROUND CONTAINER */}
      <div className="fixed inset-0 -z-50 pointer-events-none overflow-hidden bg-zinc-100 dark:bg-zinc-950">
        {bgType === "color" && (
          <div className="w-full h-full" style={{ backgroundColor: bgValue }} />
        )}

        {bgType === "image" && (
          <div
            className="w-full h-full bg-cover bg-center transition-all duration-500"
            style={{ backgroundImage: `url(${bgValue})` }}
          >
            <div className="w-full h-full bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xs" />
          </div>
        )}

        {bgType === "gif" && (
          <div
            className="w-full h-full bg-cover bg-center transition-all duration-500"
            style={{ backgroundImage: `url(${bgValue})` }}
          >
            <div className="w-full h-full bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xs" />
          </div>
        )}

        {bgType === "video" && (
          <div className="relative w-full h-full">
            <video
              src={bgValue}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover opacity-30 dark:opacity-20"
            />
            <div className="absolute inset-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xs" />
          </div>
        )}
      </div>

      {/* 2. DYNAMIC FLOATING PARTICLES EFFECTS */}
      <Effects active={state.config.effectsEnabled} />

      {/* 3. MULTI-PANEL VIEW MANAGER */}
      <AnimatePresence mode="wait">
        {activePanel === "user" && (
          <motion.div
            key="user"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="w-full h-full"
          >
            <FoydalanuvchiPanel
              state={state}
              t={t}
              onPanelChange={setActivePanel}
              onSetTheme={handleSetTheme}
              onSetLang={handleSetLang}
            />
          </motion.div>
        )}

        {activePanel === "staff" && (
          <motion.div
            key="staff"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="w-full h-full"
          >
            <StaffPanel
              state={state}
              t={t}
              onUpdateState={handleUpdateState}
              onBackToMenu={() => setActivePanel("user")}
            />
          </motion.div>
        )}

        {activePanel === "admin" && (
          <motion.div
            key="admin"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
            className="w-full h-full"
          >
            <AdminPanel
              state={state}
              t={t}
              onUpdateState={handleUpdateState}
              onBackToMenu={() => setActivePanel("user")}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
