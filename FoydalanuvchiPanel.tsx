import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Globe, Volume2, X, ChevronLeft, ChevronRight, Star, Settings, Key, AlertCircle } from "lucide-react";
import { CrmState, MenuItem, Translations } from "../types";

interface FoydalanuvchiPanelProps {
  state: CrmState;
  t: Translations;
  onPanelChange: (panel: 'user' | 'staff' | 'admin') => void;
  onSetTheme: (theme: 'light' | 'dark') => void;
  onSetLang: (lang: string) => void;
}

export default function FoydalanuvchiPanel({
  state,
  t,
  onPanelChange,
  onSetTheme,
  onSetLang,
}: FoydalanuvchiPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showBooklet, setShowBooklet] = useState(false);
  const [bookletPage, setBookletPage] = useState(0);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioError, setAudioError] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  // Automatically open booklet on first visit
  useEffect(() => {
    const visited = localStorage.getItem("oshxona_booklet_seen");
    if (!visited && state.booklet.active) {
      setShowBooklet(true);
      localStorage.setItem("oshxona_booklet_seen", "true");
    }
  }, [state.booklet.active]);

  // Handle Text To Speech
  const playTTS = async (item: MenuItem) => {
    if (isPlayingAudio) return;
    setIsPlayingAudio(true);
    setAudioError("");

    const textToSpeak = item.voiceText || `${item.name}. ${item.description}. Narxi ${item.price.toLocaleString()} so'm.`;

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToSpeak, voice: "Kore" }),
      });

      const data = await response.json();
      if (data.success && data.audio) {
        // Decode base64 to audio blob
        const binaryString = atob(data.audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audio.play();
        audio.onended = () => setIsPlayingAudio(false);
      } else {
        // Fallback to Web Speech API if server-side TTS fails or key not configured
        console.warn("Server-side TTS failed, using Web Speech API fallback...");
        speakFallback(textToSpeak);
      }
    } catch (e) {
      console.error("TTS generation error:", e);
      speakFallback(textToSpeak);
    }
  };

  const speakFallback = (text: string) => {
    if (!window.speechSynthesis) {
      setAudioError("Ushbu brauzerda ovozli eshittirish tizimi ishlamaydi.");
      setIsPlayingAudio(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    // Find Uzbek or similar localized voice if available, otherwise use default
    utterance.lang = state.config.activeLang === "uz" ? "tr-TR" : state.config.activeLang === "ru" ? "ru-RU" : "en-US";
    utterance.rate = 0.9;
    
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => {
      setAudioError("Ovoz tizimida xatolik yuz berdi.");
      setIsPlayingAudio(false);
    };
    window.speechSynthesis.speak(utterance);
  };

  // List unique categories
  const categories = ["All", ...Array.from(new Set(state.menu.map((item) => item.category)))];

  // Filtering products: matches name, category, or search keywords (e.g. "ichimliklar" matches category)
  const filteredMenu = state.menu.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesCategory;

    const matchesSearch =
      item.name.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query);

    return matchesSearch;
  });

  // Render Booklet Page Content
  const bookletPages = state.booklet.pages.length > 0 ? state.booklet.pages : ["Yo'riqnoma sahifalari mavjud emas."];

  return (
    <div className="w-full min-h-screen pb-16 relative">
      {/* HEADER SECTION */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/80 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          
          {/* Logo & Kitchen Name */}
          <div className="flex items-center gap-3">
            <img
              src={state.config.logoUrl}
              alt="Logo"
              referrerPolicy="no-referrer"
              className="rounded-full shadow-md object-cover transition-all"
              style={{ width: `${state.config.logoWidth}px`, height: `${state.config.logoWidth}px` }}
            />
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-amber-600 dark:text-amber-500 tracking-tight">
                Lazzat CRM
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                {t.welcome}
              </p>
            </div>
          </div>

          {/* Smart Search Bar */}
          <div className="flex-1 max-w-md relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800 border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white dark:placeholder-zinc-500 transition-all"
            />
          </div>

          {/* Utility menu: Translate, Settings, Panels switcher */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                <Globe className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
                <span className="uppercase text-xs">{state.config.activeLang}</span>
              </button>
              <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-100 dark:border-zinc-700 py-1 hidden group-hover:block z-50">
                {state.languages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => onSetLang(lang)}
                    className={`w-full px-4 py-2 text-left text-xs font-semibold uppercase hover:bg-amber-50 dark:hover:bg-zinc-700 transition-colors ${
                      state.config.activeLang === lang ? "text-amber-600 dark:text-amber-400" : "text-zinc-700 dark:text-zinc-200"
                    }`}
                  >
                    {lang === "uz" ? "O'zbekcha" : lang === "ru" ? "Русский" : "English"}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Action Settings Popup Toggle */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <Settings className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
            </button>

            {/* Guide Booklet Trigger */}
            <button
              onClick={() => {
                setBookletPage(0);
                setShowBooklet(true);
              }}
              className="px-3.5 py-1.5 rounded-full bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 shadow-sm transition-colors"
            >
              📖 Ma'lumot
            </button>
          </div>
        </div>
      </header>

      {/* SETTINGS MENU MODAL OVERLAY */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-zinc-100 dark:border-zinc-800 relative"
            >
              <button
                onClick={() => setShowSettings(false)}
                className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                ⚙️ {t.settings}
              </h2>

              <div className="space-y-4">
                {/* Dark mode switch */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{t.darkLight}</span>
                  <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-full p-1 border border-zinc-200 dark:border-zinc-700">
                    <button
                      onClick={() => onSetTheme("light")}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                        state.config.theme === "light" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-400"
                      }`}
                    >
                      Kunduz
                    </button>
                    <button
                      onClick={() => onSetTheme("dark")}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                        state.config.theme === "dark" ? "bg-zinc-700 text-white shadow-xs" : "text-zinc-400"
                      }`}
                    >
                      Tungi
                    </button>
                  </div>
                </div>

                <hr className="border-zinc-100 dark:border-zinc-800" />

                {/* Switch to panels (Oshpaz/Afitsiant, Admin) */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Tizim bo'limlari</span>
                  <button
                    onClick={() => {
                      setShowSettings(false);
                      onPanelChange("staff");
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors text-left"
                  >
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">👨‍🍳 {t.staffPanel}</span>
                    <Key className="w-3.5 h-3.5 text-zinc-400" />
                  </button>
                  <button
                    onClick={() => {
                      setShowSettings(false);
                      onPanelChange("admin");
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors text-left"
                  >
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">🔑 {t.adminPanel}</span>
                    <Key className="w-3.5 h-3.5 text-zinc-400" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADVERTISEMENT SPACE: TOP */}
      {state.ads.map((ad) => {
        if (!ad.active || ad.position !== "top") return null;
        return (
          <div key={ad.id} className="max-w-7xl mx-auto px-4 mt-4">
            <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className="block relative rounded-2xl overflow-hidden shadow-md group">
              {ad.type === "image" && (
                <img src={ad.contentUrl} alt="Ad" referrerPolicy="no-referrer" className="w-full h-32 md:h-44 object-cover group-hover:scale-[1.01] transition-transform duration-300" />
              )}
              {ad.type === "video" && (
                <video src={ad.contentUrl} autoPlay loop muted playsInline className="w-full h-32 md:h-44 object-cover" />
              )}
              <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                REKLAMA
              </span>
            </a>
          </div>
        );
      })}

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 mt-6">
        
        {/* Categories Carousel */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                  : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 border border-zinc-100 dark:border-zinc-800"
              }`}
            >
              {cat === "All" ? "Barchasi" : cat}
            </button>
          ))}
        </div>

        {/* Menu Grid - Premium layout style mirroring the user's uploaded images */}
        {filteredMenu.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
            {filteredMenu.map((item) => (
              <motion.div
                key={item.id}
                layoutId={`item-${item.id}`}
                onClick={() => setSelectedItem(item)}
                className="bg-white dark:bg-zinc-800 rounded-2xl overflow-hidden shadow-xs border border-zinc-100 dark:border-zinc-700 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col group"
              >
                {/* Food Image Container */}
                <div className="relative aspect-square overflow-hidden bg-zinc-100">
                  <img
                    src={item.image}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Rating Badge */}
                  <span className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    {item.rating}
                  </span>

                  {/* Stock status indicator */}
                  <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shadow-sm ${
                    item.stock > 10 
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : item.stock > 0
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                  }`}>
                    {item.stock > 0 ? `${item.stock} ta` : "Tugadi"}
                  </span>
                </div>

                {/* Content details */}
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      {item.category}
                    </span>
                    <h3 className="text-sm md:text-base font-bold text-zinc-900 dark:text-white line-clamp-1 mt-0.5 group-hover:text-amber-600 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-700/50 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-zinc-400 font-mono">Narxi:</span>
                      <span className="text-sm font-extrabold text-zinc-900 dark:text-white">
                        {item.price.toLocaleString()} so'm
                      </span>
                    </div>
                    {/* Speaker trigger preview button */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        playTTS(item);
                      }}
                      className="p-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-zinc-700 dark:hover:bg-zinc-600 rounded-full text-amber-600 dark:text-amber-400 transition-colors"
                      title="Ovozli eshitish"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center bg-white dark:bg-zinc-800 rounded-2xl shadow-xs border border-zinc-100 dark:border-zinc-700">
            <p className="text-zinc-500 dark:text-zinc-400">Qidiruv bo'yicha hech qanday taom topilmadi.</p>
          </div>
        )}
      </main>

      {/* DETAILED DIALOG WITH VOICE OVER */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              layoutId={`item-${selectedItem.id}`}
              className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl relative border border-zinc-200 dark:border-zinc-800"
            >
              <button
                onClick={() => {
                  setSelectedItem(null);
                  window.speechSynthesis?.cancel();
                  setIsPlayingAudio(false);
                }}
                className="absolute right-4 top-4 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white z-10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="aspect-video w-full relative">
                <img
                  src={selectedItem.image}
                  alt={selectedItem.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-xs text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  {selectedItem.rating} (Oshpaz bahosi)
                </span>
              </div>

              <div className="p-6">
                <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                  {selectedItem.category}
                </span>
                <h2 className="text-xl md:text-2xl font-extrabold text-zinc-900 dark:text-white mt-1">
                  {selectedItem.name}
                </h2>

                <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-3 leading-relaxed">
                  {selectedItem.description}
                </p>

                {/* Pricing & Stock block */}
                <div className="grid grid-cols-2 gap-4 mt-5 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800">
                  <div>
                    <span className="text-xs text-zinc-400 block">{t.price}:</span>
                    <span className="text-lg font-black text-zinc-950 dark:text-white">
                      {selectedItem.price.toLocaleString()} so'm
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 block">{t.stock}:</span>
                    <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                      {selectedItem.stock > 0 ? `${selectedItem.stock} ta bor` : "Tugagan 🛑"}
                    </span>
                  </div>
                </div>

                {audioError && (
                  <div className="mt-3 flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 text-xs">
                    <AlertCircle className="w-4 h-4" />
                    <span>{audioError}</span>
                  </div>
                )}

                {/* Speach Activation Button */}
                <div className="mt-6">
                  <button
                    onClick={() => playTTS(selectedItem)}
                    disabled={isPlayingAudio}
                    className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2.5 shadow-md transition-all ${
                      isPlayingAudio
                        ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 cursor-not-allowed animate-pulse"
                        : "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/15"
                    }`}
                  >
                    <Volume2 className={`w-5 h-5 ${isPlayingAudio ? "animate-bounce" : ""}`} />
                    <span>{isPlayingAudio ? "O'qilmoqda..." : t.listen}</span>
                  </button>
                  <p className="text-[10px] text-center text-zinc-400 mt-2">
                    Kattalar va qariyalarga taom ta'rifini ovozli tushuntirib berish tizimi.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REALISTIC SPIRAL NOTEBOOK WELCOME BOOKLET */}
      <AnimatePresence>
        {showBooklet && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ rotate: -5, scale: 0.9, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 5, scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className="bg-[#fcfbe3] text-zinc-800 rounded-2xl w-full max-w-md shadow-2xl relative border-2 border-[#e6dec3] flex flex-col overflow-hidden"
              style={{ fontFamily: "'Georgia', serif" }}
            >
              {/* Spiral binding rings decoration at the top */}
              <div className="bg-[#ebd9a6] h-10 w-full flex justify-around px-4 items-center border-b-2 border-[#e6dec3] relative">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div key={idx} className="w-3.5 h-6 rounded-full bg-gradient-to-b from-zinc-400 via-zinc-200 to-zinc-400 shadow-sm border border-zinc-500" />
                ))}
                {/* Red X close button */}
                <button
                  onClick={() => setShowBooklet(false)}
                  className="absolute right-4 top-2 text-zinc-800 hover:text-red-600 bg-white/40 hover:bg-white/80 rounded-full p-1 border border-zinc-400 shadow-xs transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Booklet Page content */}
              <div className="p-6 md:p-8 flex-1 min-h-[250px] flex flex-col justify-between relative bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
                {/* Ruled lines background simulation */}
                <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(#000_1px,transparent_1px)] [background-size:100%_24px] top-6" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between border-b-2 border-red-200 pb-2 mb-4">
                    <span className="text-sm font-extrabold text-red-500 uppercase tracking-widest font-sans">
                      📖 {state.booklet.title}
                    </span>
                    <span className="text-xs font-mono text-zinc-400">
                      Varaq: {bookletPage + 1}/{bookletPages.length}
                    </span>
                  </div>

                  <p className="text-base md:text-lg text-zinc-900 leading-8 indent-4 font-medium italic select-none">
                    {bookletPages[bookletPage]}
                  </p>
                </div>

                {/* Page turning pagination controls */}
                <div className="relative z-10 mt-8 flex items-center justify-between border-t border-zinc-200 pt-4">
                  <button
                    onClick={() => setBookletPage((prev) => Math.max(0, prev - 1))}
                    disabled={bookletPage === 0}
                    className="flex items-center gap-1 text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:text-amber-600 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    <span>Oldingi</span>
                  </button>

                  <div className="flex gap-1">
                    {bookletPages.map((_, i) => (
                      <span
                        key={i}
                        className={`w-2 h-2 rounded-full transition-all ${bookletPage === i ? "bg-amber-600 scale-125" : "bg-zinc-300"}`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      if (bookletPage === bookletPages.length - 1) {
                        setShowBooklet(false);
                      } else {
                        setBookletPage((prev) => prev + 1);
                      }
                    }}
                    className="flex items-center gap-1 text-sm font-bold text-amber-700 hover:text-amber-900 font-sans"
                  >
                    <span>{bookletPage === bookletPages.length - 1 ? "Menyuga o'tish ✅" : "Keyingi"}</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADVERTISEMENT SPACE: BOTTOM */}
      {state.ads.map((ad) => {
        if (!ad.active || ad.position !== "bottom") return null;
        return (
          <div key={ad.id} className="max-w-7xl mx-auto px-4 mt-6">
            <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className="block relative rounded-2xl overflow-hidden shadow-md group">
              {ad.type === "image" && (
                <img src={ad.contentUrl} alt="Ad" referrerPolicy="no-referrer" className="w-full h-24 md:h-36 object-cover group-hover:scale-[1.01] transition-transform duration-300" />
              )}
              {ad.type === "video" && (
                <video src={ad.contentUrl} autoPlay loop muted playsInline className="w-full h-24 md:h-36 object-cover" />
              )}
              <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                REKLAMA
              </span>
            </a>
          </div>
        );
      })}
    </div>
  );
}
