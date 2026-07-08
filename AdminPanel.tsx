import React, { useState } from "react";
import { motion } from "motion/react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Plus, Trash2, Edit3, Key, AlertCircle, Save, ArrowLeft, Settings, Image, Eye, HelpCircle, LayoutGrid, Monitor, PlaySquare, VolumeX, Database, Sliders, RefreshCw, BarChart2 } from "lucide-react";
import { CrmState, MenuItem, Translations, Ad } from "../types";
import ImageInput from "./ImageInput";

// Google Translate (bepul, ochiq "gtx" endpoint) orqali matnni tarjima qilish.
// API kaliti talab qilinmaydi. Agar internet/tarmoq bilan muammo bo'lsa,
// asl (o'zbekcha) matn qaytariladi, shunda tizim hech qachon buzilmaydi.
async function translateWithGoogle(
  text: string,
  targetLang: string,
  sourceLang: string = "uz"
): Promise<string> {
  if (!text || !text.trim()) return text;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(
      text
    )}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Tarjima xizmati javob bermadi");
    const data = await res.json();
    // Google javobi: [[["tarjima","asl",null,null,...], ...], ...]
    const translated = data?.[0]?.map((chunk: any) => chunk[0]).join("") || text;
    return translated;
  } catch (err) {
    console.warn("Google Translate xatolik:", err);
    return text; // xatolik bo'lsa, asl matnni saqlab qolamiz
  }
}

interface AdminPanelProps {
  state: CrmState;
  t: Translations;
  onUpdateState: (newState: Partial<CrmState>) => Promise<void>;
  onBackToMenu: () => void;
}

export default function AdminPanel({
  state,
  t,
  onUpdateState,
  onBackToMenu,
}: AdminPanelProps) {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [activeTab, setActiveTab] = useState<'dashboard' | 'menu' | 'design' | 'booklet' | 'ads' | 'languages'>('dashboard');
  const [timeframe, setTimeframe] = useState<'hour' | 'day' | 'month' | 'year'>('day');

  // Food Management State
  const [isAddingFood, setIsAddingFood] = useState(false);
  const [editingFood, setEditingFood] = useState<MenuItem | null>(null);
  
  // Fields for Add/Edit Food
  const [foodName, setFoodName] = useState("");
  const [foodCategory, setFoodCategory] = useState("");
  const [foodDesc, setFoodDesc] = useState("");
  const [foodPrice, setFoodPrice] = useState(0);
  const [foodImage, setFoodImage] = useState("");
  const [foodStock, setFoodStock] = useState(0);
  const [foodRating, setFoodRating] = useState(4.8);
  const [foodVoiceText, setFoodVoiceText] = useState("");

  // Design/Background configurations
  const [themeInput, setThemeInput] = useState<'light' | 'dark'>(state.config.theme);
  const [bgType, setBgType] = useState<'color' | 'image' | 'gif' | 'video'>(state.config.backgroundType);
  const [bgValue, setBgValue] = useState(state.config.backgroundValue);
  const [logoUrlInput, setLogoUrlInput] = useState(state.config.logoUrl);
  const [logoWidthInput, setLogoWidthInput] = useState(state.config.logoWidth);
  const [effectsInput, setEffectsInput] = useState(state.config.effectsEnabled);

  // Security password managers
  const [staffPass, setStaffPass] = useState((state.config as any).staffPassword || "1234");
  const [adminPass, setAdminPass] = useState((state.config as any).adminPassword || "9999");

  // Booklet State Managers
  const [bookletTitle, setBookletTitle] = useState(state.booklet.title);
  const [bookletActive, setBookletActive] = useState(state.booklet.active);
  const [bookletPagesList, setBookletPagesList] = useState<string[]>([...state.booklet.pages]);
  const [newBookletPageText, setNewBookletPageText] = useState("");

  // Ads state managers
  const [adsList, setAdsList] = useState<Ad[]>([...state.ads]);

  // Language management
  const [newLangCode, setNewLangCode] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState("");

  // Authentication
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = (state.config as any).adminPassword || "9999";
    if (password === correctPassword) {
      setIsAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("Xato admin paroli! Qayta urinib ko'ring.");
    }
  };

  // Update Config on Save
  const handleSaveConfig = async () => {
    const updatedConfig = {
      ...state.config,
      theme: themeInput,
      backgroundType: bgType,
      backgroundValue: bgValue,
      logoUrl: logoUrlInput,
      logoWidth: logoWidthInput,
      effectsEnabled: effectsInput,
      staffPassword: staffPass,
      adminPassword: adminPass,
    };

    await onUpdateState({ config: updatedConfig as any });
    alert("Dizayn va xavfsizlik sozlamalari muvaffaqiyatli saqlandi! ✅");
  };

  // Add/Edit Food item
  const handleSaveFood = async () => {
    if (!foodName || !foodCategory) {
      alert("Iltimos, taom nomi va toifasini kiriting.");
      return;
    }

    const defaultImages = [
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=500&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&auto=format&fit=crop&q=60"
    ];

    const finalImage = foodImage.trim() || defaultImages[Math.floor(Math.random() * defaultImages.length)];
    const cleanVoice = foodVoiceText.trim() || `${foodName}. Narxi ${foodPrice.toLocaleString()} so'm.`;

    if (editingFood) {
      // Edit food
      const updatedMenu = state.menu.map((item) => {
        if (item.id === editingFood.id) {
          return {
            ...item,
            name: foodName,
            category: foodCategory,
            description: foodDesc,
            price: Number(foodPrice),
            image: finalImage,
            stock: Number(foodStock),
            rating: Number(foodRating),
            voiceText: cleanVoice,
          };
        }
        return item;
      });
      await onUpdateState({ menu: updatedMenu });
      setEditingFood(null);
    } else {
      // Add new food
      const newFood: MenuItem = {
        id: Math.random().toString(),
        name: foodName,
        category: foodCategory,
        description: foodDesc,
        price: Number(foodPrice),
        image: finalImage,
        stock: Number(foodStock),
        rating: Number(foodRating),
        voiceText: cleanVoice,
      };
      await onUpdateState({ menu: [newFood, ...state.menu] });
      setIsAddingFood(false);
    }

    // Reset fields
    resetFoodFields();
  };

  const resetFoodFields = () => {
    setFoodName("");
    setFoodCategory("");
    setFoodDesc("");
    setFoodPrice(0);
    setFoodImage("");
    setFoodStock(0);
    setFoodRating(4.8);
    setFoodVoiceText("");
  };

  const handleDeleteFood = async (id: string) => {
    if (confirm("Ushbu taomni butunlay o'chirib tashlamoqchimisiz?")) {
      const updatedMenu = state.menu.filter((item) => item.id !== id);
      await onUpdateState({ menu: updatedMenu });
    }
  };

  // Welcome Booklet Controllers
  const handleSaveBooklet = async () => {
    const updatedBooklet = {
      active: bookletActive,
      title: bookletTitle,
      pages: bookletPagesList,
    };
    await onUpdateState({ booklet: updatedBooklet });
    alert("Ma'lumot bloknoti sozlamalari yangilandi! ✅");
  };

  const handleAddBookletPage = () => {
    if (newBookletPageText.trim()) {
      setBookletPagesList([...bookletPagesList, newBookletPageText.trim()]);
      setNewBookletPageText("");
    }
  };

  const handleDeleteBookletPage = (index: number) => {
    const updated = bookletPagesList.filter((_, i) => i !== index);
    setBookletPagesList(updated);
  };

  // Ads manager
  const handleSaveAds = async () => {
    await onUpdateState({ ads: adsList });
    alert("Reklama sozlamalari muvaffaqiyatli saqlandi! ✅");
  };

  const handleUpdateAdField = (id: string, field: keyof Ad, value: any) => {
    const updated = adsList.map((ad) => {
      if (ad.id === id) {
        return { ...ad, [field]: value };
      }
      return ad;
    });
    setAdsList(updated);
  };

  // Language translation logic — Google Translate orqali avtomatik tarjima
  const handleAddLanguage = async () => {
    const code = newLangCode.toLowerCase().trim();
    if (!code || state.languages.includes(code)) {
      setTranslateError("Bu til allaqachon mavjud yoki noto'g'ri til kodi kiritildi.");
      return;
    }

    setTranslateError("");
    setIsTranslating(true);
    try {
      const sourceTexts = state.translations["uz"];
      const keys = Object.keys(sourceTexts) as (keyof Translations)[];

      // Har bir matnni Google Translate orqali parallel tarjima qilamiz
      const translatedValues = await Promise.all(
        keys.map((key) => translateWithGoogle(sourceTexts[key], code, "uz"))
      );

      const translatedObject = {} as Translations;
      keys.forEach((key, idx) => {
        translatedObject[key] = translatedValues[idx];
      });

      const newTranslations = { ...state.translations };
      newTranslations[code] = translatedObject;

      const updatedLangs = [...state.languages, code];
      await onUpdateState({
        languages: updatedLangs,
        translations: newTranslations as any,
      });
      setNewLangCode("");
      alert(`"${code}" tili Google Translate orqali avtomatik tarjima qilinib qo'shildi! Kerak bo'lsa, matnlarni qo'lda ham tahrirlashingiz mumkin. ✅`);
    } catch (err) {
      setTranslateError("Tarjima qilishda xatolik yuz berdi. Internet aloqasini tekshiring.");
    } finally {
      setIsTranslating(false);
    }
  };

  // Map charts data dynamically based on timeframe
  const getChartData = () => {
    if (timeframe === "hour") {
      return state.stats.hourlyVisits.map((val, idx) => ({ name: `${idx * 2}:00`, 'Kirishlar': val }));
    } else if (timeframe === "day") {
      const days = ["Dush", "Sesh", "Chor", "Pay", "Jum", "Shan", "Yak"];
      return state.stats.dailyVisits.map((val, idx) => ({ name: days[idx % 7], 'Kirishlar': val }));
    } else if (timeframe === "month") {
      const months = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun"];
      return state.stats.monthlyVisits.map((val, idx) => ({ name: months[idx % 6], 'Kirishlar': val }));
    } else {
      return state.stats.yearlyVisits.map((val, idx) => ({ name: `${2024 + idx}-Yil`, 'Kirishlar': val }));
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center p-4 text-white">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-zinc-950 p-8 rounded-3xl shadow-2xl max-w-md w-full border border-zinc-800"
        >
          <div className="flex flex-col items-center mb-6">
            <span className="p-4 bg-amber-500/10 rounded-full text-amber-500 mb-3 border border-amber-500/20">
              <Database className="w-10 h-10" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-center">
              Lazzat CRM Admin Panel
            </h1>
            <p className="text-xs text-zinc-500 text-center mt-1">
              Butun tizimni to'liq boshqarish va tahlillar oynasi
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-zinc-400 block mb-1.5 uppercase tracking-wider">
                Xavfsiz Kirish Paroli (Admin)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                  <Key className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  placeholder="Admin parolini kiriting (masalan: 9999)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-white"
                />
              </div>
            </div>

            {authError && (
              <div className="flex items-center gap-2 text-red-400 bg-red-950/20 p-3 rounded-xl text-xs border border-red-500/20">
                <AlertCircle className="w-4 h-4" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-sm shadow-md transition-colors"
            >
              Tizimga Kirish
            </button>
          </form>

          <button
            onClick={onBackToMenu}
            className="w-full mt-4 flex items-center justify-center gap-2 text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Mijoz Oynasiga Qaytish</span>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-950 text-zinc-100 min-h-screen">
      {/* Top Navbar */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-amber-500/10 rounded-xl text-amber-500 border border-amber-500/20">
              <Database className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black text-white">Lazzat CRM Admin Control</h1>
              <p className="text-xs text-zinc-400">100% Saytni boshqarish va tahrirlash oynasi</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onBackToMenu}
              className="px-4 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Menyuga qaytish</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 h-fit space-y-1">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block px-3 mb-2">CRM bo'limlari</span>
          
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2.5 ${
              activeTab === 'dashboard' ? "bg-amber-500 text-black shadow-md" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            Analitika va Statistika
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2.5 ${
              activeTab === 'menu' ? "bg-amber-500 text-black shadow-md" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Taomlar va Menyuni Boshqarish
          </button>

          <button
            onClick={() => setActiveTab('design')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2.5 ${
              activeTab === 'design' ? "bg-amber-500 text-black shadow-md" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <Monitor className="w-4 h-4" />
            Logo va Dizayn (Background)
          </button>

          <button
            onClick={() => setActiveTab('booklet')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2.5 ${
              activeTab === 'booklet' ? "bg-amber-500 text-black shadow-md" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <Eye className="w-4 h-4" />
            Ma'lumot Qog'ozi (Booklet)
          </button>

          <button
            onClick={() => setActiveTab('ads')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2.5 ${
              activeTab === 'ads' ? "bg-amber-500 text-black shadow-md" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <PlaySquare className="w-4 h-4" />
            Reklama Bannerlari
          </button>

          <button
            onClick={() => setActiveTab('languages')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2.5 ${
              activeTab === 'languages' ? "bg-amber-500 text-black shadow-md" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <Settings className="w-4 h-4" />
            Tillar va Tarjimalar
          </button>
        </div>

        {/* Content Container (Right Columns) */}
        <div className="lg:col-span-3 bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 min-h-[500px]">
          
          {/* TAB 1: ANALYTICS & STATS */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats highlights card row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
                  <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider block">Jami Tashriflar</span>
                  <span className="text-2xl font-black text-white mt-1 block">{state.stats.totalVisits} ta</span>
                </div>
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
                  <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider block">Faol Foydalanuvchilar</span>
                  <span className="text-2xl font-black text-green-400 mt-1 block">{state.stats.activeUsers} ta</span>
                </div>
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
                  <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider block">Sotilgan Mahsulotlar</span>
                  <span className="text-2xl font-black text-amber-500 mt-1 block">
                    {state.stats.ordersLog ? state.stats.ordersLog.length : 0} ta
                  </span>
                </div>
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
                  <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider block">Menyu Taomlari</span>
                  <span className="text-2xl font-black text-blue-400 mt-1 block">{state.menu.length} ta</span>
                </div>
              </div>

              {/* Chart Visualizer */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wide">📉 Tashriflar Dinamikasi Grafigi</h2>
                    <p className="text-[10px] text-zinc-500 font-mono">Real-vaqtda foydalanuvchilar kirish va chiqish soni tahlili</p>
                  </div>
                  {/* Timeframe switch */}
                  <div className="flex bg-zinc-800 rounded-lg p-0.5 border border-zinc-700 self-start sm:self-auto">
                    {['hour', 'day', 'month', 'year'].map((tFrame) => (
                      <button
                        key={tFrame}
                        onClick={() => setTimeframe(tFrame as any)}
                        className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all ${
                          timeframe === tFrame ? "bg-amber-500 text-black shadow-xs" : "text-zinc-400"
                        }`}
                      >
                        {tFrame === "hour" ? "1 Soat" : tFrame === "day" ? "1 Kun" : tFrame === "month" ? "1 Oy" : "1 Yil"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="name" stroke="#71717a" fontSize={10} fontFamily="monospace" />
                      <YAxis stroke="#71717a" fontSize={10} fontFamily="monospace" />
                      <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a" }} />
                      <Area type="monotone" dataKey="Kirishlar" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVisits)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Logs history */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Orders historical log */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 mb-3">🛒 Afitsiant va Oshpaz jurnali</h3>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {state.stats.ordersLog?.map((log) => (
                      <div key={log.id} className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs">
                        <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                          <span>Buyurtma amali</span>
                          <span>{log.time}</span>
                        </div>
                        <p className="text-zinc-300">{log.action}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Visit action logs */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 mb-3">👤 Tashrifchilar Kirish jurnali</h3>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {state.stats.visitsLog?.map((log, idx) => (
                      <div key={idx} className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs flex justify-between items-center">
                        <div>
                          <span className="font-bold text-green-400 mr-2">● {log.type}</span>
                          <span className="text-zinc-300">{log.user}</span>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono">{log.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MENU & DISHES MANAGEMENT */}
          {activeTab === 'menu' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold uppercase tracking-wide">🍔 Taomlar Ro'yxati va Menyuni boshqarish</h2>
                  <p className="text-[10px] text-zinc-500">Bu yerdan yangi taom qo'shish, o'chirish va narxlarni tahrirlash mumkin.</p>
                </div>
                <button
                  onClick={() => {
                    resetFoodFields();
                    setEditingFood(null);
                    setIsAddingFood(true);
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold rounded-xl shadow-md transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Yangi Taom Qo'shish
                </button>
              </div>

              {/* Form Block for Adding/Editing Food */}
              {(isAddingFood || editingFood) && (
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4">
                  <h3 className="text-sm font-extrabold text-amber-500">
                    {editingFood ? "🖊️ Taom ma'lumotlarini tahrirlash" : "✨ Yangi taom qo'shish formasi"}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 block mb-1">Taom Nomi</label>
                      <input
                        type="text"
                        value={foodName}
                        onChange={(e) => setFoodName(e.target.value)}
                        placeholder="Masalan: Tandir Somsa"
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 block mb-1">Kategoriya (Toifa)</label>
                      <input
                        type="text"
                        value={foodCategory}
                        onChange={(e) => setFoodCategory(e.target.value)}
                        placeholder="Masalan: Taomlar, Ichimliklar, Shirinliklar"
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 block mb-1">Taom Ta'rifi (Description)</label>
                    <textarea
                      rows={2}
                      value={foodDesc}
                      onChange={(e) => setFoodDesc(e.target.value)}
                      placeholder="Taom tarkibi va lazzati haqida batafsil ma'lumot kiriting."
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 block mb-1">Narxi (So'm)</label>
                      <input
                        type="number"
                        value={foodPrice}
                        onChange={(e) => setFoodPrice(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 block mb-1">Dastlabki Zaxira Soni</label>
                      <input
                        type="number"
                        value={foodStock}
                        onChange={(e) => setFoodStock(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 block mb-1">Reyting (Yulduzlar)</label>
                      <input
                        type="number"
                        step="0.1"
                        max="5"
                        value={foodRating}
                        onChange={(e) => setFoodRating(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-white"
                      />
                    </div>
                    <ImageInput
                      label="Taom Rasmi"
                      value={foodImage}
                      onChange={setFoodImage}
                      placeholder="Link kiriting, rasmni joylang (Ctrl+V) yoki bo'sh qoldiring"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 block mb-1">Ovozli Ta'rif (TTS text)</label>
                    <textarea
                      rows={2}
                      value={foodVoiceText}
                      onChange={(e) => setFoodVoiceText(e.target.value)}
                      placeholder="Qariyalarga ovozli o'qiladigan matn (bo'sh qolsa avtomatik generatsiya qilinadi)"
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-white"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => {
                        setIsAddingFood(false);
                        setEditingFood(null);
                      }}
                      className="px-4 py-2 bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Bekor qilish
                    </button>
                    <button
                      onClick={handleSaveFood}
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-xl text-xs font-extrabold transition-colors flex items-center gap-1"
                    >
                      <Save className="w-4 h-4" />
                      Saqlash
                    </button>
                  </div>
                </div>
              )}

              {/* Menu items table list */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-800 border-b border-zinc-700 text-zinc-400 font-extrabold uppercase">
                      <th className="p-4">Rasm & Nomi</th>
                      <th className="p-4">Kategoriya</th>
                      <th className="p-4">Narxi</th>
                      <th className="p-4 text-center">Zaxira</th>
                      <th className="p-4 text-center">Reyting</th>
                      <th className="p-4 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 text-zinc-300">
                    {state.menu.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="p-4 flex items-center gap-3">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-9 h-9 object-cover rounded-lg border border-zinc-800"
                            referrerPolicy="no-referrer"
                          />
                          <span className="font-extrabold text-white text-sm">{item.name}</span>
                        </td>
                        <td className="p-4 font-semibold text-zinc-400">{item.category}</td>
                        <td className="p-4 font-bold text-white font-mono">{item.price.toLocaleString()} so'm</td>
                        <td className="p-4 text-center font-mono">{item.stock} ta</td>
                        <td className="p-4 text-center font-mono">⭐ {item.rating}</td>
                        <td className="p-4 text-right space-x-1.5">
                          <button
                            onClick={() => {
                              setEditingFood(item);
                              setFoodName(item.name);
                              setFoodCategory(item.category);
                              setFoodDesc(item.description);
                              setFoodPrice(item.price);
                              setFoodImage(item.image);
                              setFoodStock(item.stock);
                              setFoodRating(item.rating);
                              setFoodVoiceText(item.voiceText);
                            }}
                            className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors inline-flex"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteFood(item.id)}
                            className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors inline-flex"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: DESIGN, LOGO & BACKGROUND (with video background customizer!) */}
          {activeTab === 'design' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold uppercase tracking-wide">🎨 Logo va Tizim Orqa foni (Background)</h2>
                <p className="text-[10px] text-zinc-500">Mijozlar menyusining dizayni, foni, logosi va uning o'lchamini sozlashingiz mumkin.</p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-5">
                {/* Logo URL & dynamic Width Slider */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ImageInput
                    label="Logotip"
                    value={logoUrlInput}
                    onChange={setLogoUrlInput}
                  />
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 block mb-1">
                      Logo Kattaligi (Width): {logoWidthInput}px
                    </label>
                    <input
                      type="range"
                      min="40"
                      max="180"
                      value={logoWidthInput}
                      onChange={(e) => setLogoWidthInput(Number(e.target.value))}
                      className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500 mt-3"
                    />
                  </div>
                </div>

                <hr className="border-zinc-800" />

                {/* Background selector (Video, Gif, Image, Color supported!) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 block mb-1">Mavzu Fon Turi</label>
                    <select
                      value={bgType}
                      onChange={(e) => setBgType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-white font-bold"
                    >
                      <option value="color">Oddiy Rang (Hex)</option>
                      <option value="image">Statik Rasm</option>
                      <option value="gif">GIF Harakatli Fon</option>
                      <option value="video">Harakatli Video Loop</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    {bgType === "color" ? (
                      <>
                        <label className="text-[10px] font-bold text-zinc-400 block mb-1">Orqa Fon Rang Kodi</label>
                        <input
                          type="text"
                          value={bgValue}
                          onChange={(e) => setBgValue(e.target.value)}
                          placeholder="Masalan: #f3f4f6"
                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-white font-mono"
                        />
                      </>
                    ) : (
                      <ImageInput
                        label="Orqa Fon Fayli"
                        value={bgValue}
                        onChange={setBgValue}
                        accept={bgType === "video" ? "video/*" : "image/*"}
                        placeholder="Link kiriting, faylni joylang (Ctrl+V) yoki tanlang"
                      />
                    )}
                  </div>
                </div>

                <hr className="border-zinc-800" />

                {/* Floating animations particle option */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold block">Uchar effektlar animatsiyasi (Falling elements)</span>
                    <span className="text-[10px] text-zinc-500">Mijozlar panelida ovqat va choy barglari kabi kichik harakatli detallar uchib yurishi</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={effectsInput}
                    onChange={(e) => setEffectsInput(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-zinc-950 border-zinc-800 focus:ring-amber-500"
                  />
                </div>

                <hr className="border-zinc-800" />

                {/* Passwords Management */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-red-400 block mb-1">👨‍🍳 Oshpaz & Afitsiant Paroli (2-Panel)</label>
                    <input
                      type="text"
                      value={staffPass}
                      onChange={(e) => setStaffPass(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-red-500 block mb-1">🔑 Admin Tizim Paroli (3-Panel)</label>
                    <input
                      type="text"
                      value={adminPass}
                      onChange={(e) => setAdminPass(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-white font-bold"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    onClick={handleSaveConfig}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black rounded-xl text-xs font-extrabold transition-colors flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    Dizaynni Saqlash
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BOOKLET HANDLER */}
          {activeTab === 'booklet' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold uppercase tracking-wide">📖 Ma'lumot qog'ozi (Yo'riqnoma bloknoti)</h2>
                <p className="text-[10px] text-zinc-500">Mijozlar birinchi kirganda chiqadigan bloknot qog'ozi dizayni va uning varoqlaridagi matnlar.</p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold block">Bloknotni Mijozlarga Ko'rsatish (Active)</span>
                  <input
                    type="checkbox"
                    checked={bookletActive}
                    onChange={(e) => setBookletActive(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-zinc-950 border-zinc-800 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 block mb-1">Bloknot Sarlavhasi (Title)</label>
                  <input
                    type="text"
                    value={bookletTitle}
                    onChange={(e) => setBookletTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 block mb-1.5">Mavjud Varaqlar Matnlari (Pages)</label>
                  <div className="space-y-2">
                    {bookletPagesList.map((page, idx) => (
                      <div key={idx} className="flex items-start gap-2 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                        <span className="text-[10px] font-mono font-bold text-amber-500 shrink-0 mt-0.5">Varaq {idx + 1}:</span>
                        <p className="text-xs text-zinc-300 flex-1">{page}</p>
                        <button
                          onClick={() => handleDeleteBookletPage(idx)}
                          className="text-red-400 hover:text-red-600 p-1 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800">
                  <label className="text-[10px] font-bold text-zinc-400 block mb-1">Yangi Varaq Qo'shish Matni</label>
                  <div className="flex gap-2">
                    <textarea
                      rows={2}
                      value={newBookletPageText}
                      onChange={(e) => setNewBookletPageText(e.target.value)}
                      placeholder="Yangi varoq matnini yozing..."
                      className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-white"
                    />
                    <button
                      onClick={handleAddBookletPage}
                      className="px-4 bg-amber-500 hover:bg-amber-600 text-black rounded-xl text-xs font-bold transition-all flex items-center justify-center whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Qo'shish
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    onClick={handleSaveBooklet}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black rounded-xl text-xs font-extrabold transition-colors flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    Bloknotni Saqlash
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ADVERTISEMENTS CONTROLLER */}
          {activeTab === 'ads' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold uppercase tracking-wide">📣 Reklama Bannerlari va Tizimi</h2>
                <p className="text-[10px] text-zinc-500">Mijozlar menyusining tepasi yoki pastida turadigan rasm, video va gifli reklamalarni boshqarish.</p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-6">
                {adsList.map((ad, index) => (
                  <div key={ad.id} className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-4">
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                      <span className="text-xs font-bold text-amber-500 font-mono">Reklama #{index + 1}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500">Faollik:</span>
                        <input
                          type="checkbox"
                          checked={ad.active}
                          onChange={(e) => handleUpdateAdField(ad.id, "active", e.target.checked)}
                          className="w-4 h-4 rounded text-amber-500 bg-zinc-950 border-zinc-800 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 block mb-1">Reklama turi</label>
                        <select
                          value={ad.type}
                          onChange={(e) => handleUpdateAdField(ad.id, "type", e.target.value as any)}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white"
                        >
                          <option value="image">Statik Rasm</option>
                          <option value="video">Harakatli Video</option>
                          <option value="gif">GIF Animatsiya</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 block mb-1">Joylashuv O'rni</label>
                        <select
                          value={ad.position}
                          onChange={(e) => handleUpdateAdField(ad.id, "position", e.target.value as any)}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white"
                        >
                          <option value="top">Tepa Banner</option>
                          <option value="bottom">Pastki Banner</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 block mb-1">Nishon URL Manzil (O'tish linki)</label>
                        <input
                          type="text"
                          value={ad.linkUrl}
                          onChange={(e) => handleUpdateAdField(ad.id, "linkUrl", e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white"
                        />
                      </div>
                    </div>

                    <ImageInput
                      label="Reklama Kontenti (Rasm, Gif yoki Video)"
                      value={ad.contentUrl}
                      onChange={(v) => handleUpdateAdField(ad.id, "contentUrl", v)}
                      accept={ad.type === "video" ? "video/*" : "image/*"}
                    />
                  </div>
                ))}

                <div className="flex justify-end pt-3 border-t border-zinc-800">
                  <button
                    onClick={handleSaveAds}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black rounded-xl text-xs font-extrabold transition-colors flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    Reklamani Saqlash
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: LANGUAGES MANAGER */}
          {activeTab === 'languages' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold uppercase tracking-wide">🌐 Tillar va Tarjimalar Boshqaruvi</h2>
                <p className="text-[10px] text-zinc-500">Mijozlar menyusi tepadagi translate tizimiga real tillar qo'shish va ularni sozlash.</p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-400 block mb-2">Mavjud Tillari Ro'yxati</label>
                  <div className="flex flex-wrap gap-2">
                    {state.languages.map((lang) => (
                      <span
                        key={lang}
                        className="px-3.5 py-1.5 bg-zinc-950 border border-zinc-800 text-white rounded-lg text-xs font-extrabold uppercase font-mono"
                      >
                        {lang === "uz" ? "🇺🇿 O'zbekcha" : lang === "ru" ? "🇷🇺 Русский" : lang === "en" ? "🇬🇧 English" : `🌍 ${lang}`}
                      </span>
                    ))}
                  </div>
                </div>

                <hr className="border-zinc-800" />

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 block mb-1">Yangi til kodi qo'shish (e.g. de, fr, tr, es)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Masalan: tr"
                      value={newLangCode}
                      onChange={(e) => setNewLangCode(e.target.value)}
                      maxLength={3}
                      disabled={isTranslating}
                      className="w-32 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-white font-bold disabled:opacity-50"
                    />
                    <button
                      onClick={handleAddLanguage}
                      disabled={isTranslating}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-xl text-xs font-bold transition-all flex items-center justify-center whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isTranslating ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                          Tarjima qilinmoqda...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-1" />
                          Yangi til qo'shish
                        </>
                      )}
                    </button>
                  </div>
                  {translateError && (
                    <p className="text-[10px] text-red-400 mt-1.5 font-bold">{translateError}</p>
                  )}
                  <p className="text-[10px] text-zinc-500 mt-1.5 leading-relaxed">
                    Til kodini kiritganingizda (masalan <span className="font-mono">tr</span> — turkcha, <span className="font-mono">de</span> — nemischa, <span className="font-mono">fr</span> — fransuzcha, <span className="font-mono">es</span> — ispancha) barcha interfeys matnlari <b>Google Translate</b> orqali avtomatik shu tilga tarjima qilinadi va mijozlar menyusidagi translate paneliga qo'shiladi. Kerak bo'lsa, tarjimani keyinroq qo'lda ham tuzatishingiz mumkin.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
