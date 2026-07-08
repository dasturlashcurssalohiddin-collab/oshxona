import React, { useState } from "react";
import { motion } from "motion/react";
import { Plus, Minus, Search, Sparkles, Edit3, Key, AlertCircle, Save, ArrowLeft, RefreshCw, ChefHat, UserCheck } from "lucide-react";
import { CrmState, MenuItem, Translations } from "../types";

interface StaffPanelProps {
  state: CrmState;
  t: Translations;
  onUpdateState: (newState: Partial<CrmState>) => Promise<void>;
  onBackToMenu: () => void;
}

export default function StaffPanel({
  state,
  t,
  onUpdateState,
  onBackToMenu,
}: StaffPanelProps) {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<'all' | 'chef' | 'waiter'>('all');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Editable fields for Chef (no price edit!)
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editVoiceText, setEditVoiceText] = useState("");

  // Handle Authentication
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default staff password is "1234", but can be verified against a config variable if created,
    // let's use a standard default or a config-based custom password
    const correctPassword = (state.config as any).staffPassword || "1234";

    if (password === correctPassword) {
      setIsAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("Xato parol! Qayta urinib ko'ring yoki Admin bilan bog'laning.");
    }
  };

  // Log action to server
  const logAction = async (actionText: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
    const logEntry = {
      id: Math.random().toString(),
      time: timeStr,
      action: actionText,
    };

    const updatedStats = {
      ...state.stats,
      ordersLog: [logEntry, ...(state.stats.ordersLog || [])].slice(0, 50),
    };

    await onUpdateState({ stats: updatedStats });
  };

  // Adjust stock quantity (+ or -)
  const adjustStock = async (itemId: string, delta: number) => {
    const updatedMenu = state.menu.map((item) => {
      if (item.id === itemId) {
        const newStock = Math.max(0, item.stock + delta);
        // Log action
        const actionText = delta > 0
          ? `${item.category}: ${item.name} zaxirasi ${item.stock} dan ${newStock} ga oshirildi (${selectedRole === 'chef' ? 'Oshpaz' : 'Afitsiant'} tomonidan)`
          : `${item.category}: ${item.name} zaxirasi ${item.stock} dan ${newStock} ga kamaytirildi (Afitsiant stol buyurtmasi)`;
        logAction(actionText);
        return { ...item, stock: newStock };
      }
      return item;
    });

    await onUpdateState({ menu: updatedMenu });
  };

  // Restore/reset stock to a default (e.g. 20)
  const restoreStock = async (itemId: string) => {
    const updatedMenu = state.menu.map((item) => {
      if (item.id === itemId) {
        const actionText = `${item.category}: ${item.name} zaxirasi to'ldirildi (Mavjud: 30 ta)`;
        logAction(actionText);
        return { ...item, stock: 30 };
      }
      return item;
    });
    await onUpdateState({ menu: updatedMenu });
  };

  // Save exchange edits (Oshpaz edits: title & description only, NO price edit!)
  const handleSaveEdit = async () => {
    if (!editingItem) return;

    const updatedMenu = state.menu.map((item) => {
      if (item.id === editingItem.id) {
        return {
          ...item,
          name: editName,
          description: editDesc,
          voiceText: editVoiceText || `${editName}. ${editDesc}. Narxi ${item.price.toLocaleString()} so'm.`,
        };
      }
      return item;
    });

    await onUpdateState({ menu: updatedMenu });
    logAction(`Tahrir: ${editingItem.name} ma'lumotlari Oshpaz tomonidan o'zgartirildi (🖊️ Exchange)`);
    setEditingItem(null);
  };

  // Filter menu items
  const filteredMenu = state.menu.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white dark:bg-zinc-950 p-8 rounded-3xl shadow-xl max-w-md w-full border border-zinc-200 dark:border-zinc-800"
        >
          <div className="flex flex-col items-center mb-6">
            <span className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-full text-amber-500 mb-3">
              <ChefHat className="w-10 h-10" />
            </span>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white text-center">
              {t.staffPanel}
            </h1>
            <p className="text-xs text-zinc-500 text-center mt-1">
              Oshpaz va Afitsiantlar xizmat ko'rsatish tizimi
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-zinc-400 block mb-1.5 uppercase tracking-wider">
                Xodim Paroli
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                  <Key className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  placeholder="Xodim parolini kiriting (masalan: 1234)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white"
                />
              </div>
            </div>

            {authError && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded-xl text-xs">
                <AlertCircle className="w-4 h-4" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md transition-colors"
            >
              {t.enter}
            </button>
          </form>

          <button
            onClick={onBackToMenu}
            className="w-full mt-4 flex items-center justify-center gap-2 text-xs font-bold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.backToMenu}</span>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 min-h-screen">
      
      {/* Top Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6 mb-6">
        <div>
          <button
            onClick={onBackToMenu}
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Mijoz Menyu Oynasiga</span>
          </button>
          <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
            👨‍🍳 {t.staffPanel}
          </h1>
          <p className="text-xs text-zinc-500">
            Zaxirani boshqarish va taom ma'lumotlarini tezkor tahrirlash (Exchange)
          </p>
        </div>

        {/* Roles Filter Switches */}
        <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1 border border-zinc-200 dark:border-zinc-700 self-start md:self-auto">
          <button
            onClick={() => setSelectedRole('all')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              selectedRole === 'all' ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs" : "text-zinc-400"
            }`}
          >
            Barchasi
          </button>
          <button
            onClick={() => setSelectedRole('chef')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedRole === 'chef' ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs" : "text-zinc-400"
            }`}
          >
            <ChefHat className="w-3.5 h-3.5" />
            Oshpaz
          </button>
          <button
            onClick={() => setSelectedRole('waiter')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedRole === 'waiter' ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs" : "text-zinc-400"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Afitsiant
          </button>
        </div>
      </div>

      {/* Search and logs block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main List Management */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              placeholder="Zaxirani qidirish (nomi yoki kategoriyasi)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white shadow-xs"
            />
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 text-xs text-zinc-500 font-extrabold uppercase">
                  <th className="p-4">Taom / Ichimlik</th>
                  <th className="p-4">Kategoriya</th>
                  <th className="p-4 text-center">Zaxira (Soni)</th>
                  <th className="p-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
                {filteredMenu.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-10 h-10 object-cover rounded-lg border border-zinc-100 dark:border-zinc-700"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <span className="font-extrabold text-zinc-900 dark:text-white block">{item.name}</span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                          {item.price.toLocaleString()} so'm
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-zinc-600 dark:text-zinc-400">{item.category}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-3">
                        {/* Waiter/Staff Subtract Counter */}
                        <button
                          onClick={() => adjustStock(item.id, -1)}
                          disabled={item.stock === 0}
                          className="p-1 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors disabled:opacity-30"
                          title="Bitta kamaytirish (Buyurtma)"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        
                        <span className={`w-10 text-center font-mono font-black text-base ${
                          item.stock === 0 ? "text-red-600" : "text-zinc-900 dark:text-white"
                        }`}>
                          {item.stock}
                        </span>

                        {/* Waiter/Staff Add Counter */}
                        <button
                          onClick={() => adjustStock(item.id, 1)}
                          className="p-1 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                          title="Bitta qo'shish"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-right space-x-1.5">
                      {/* Chef Restore Stock Button */}
                      {(selectedRole === 'all' || selectedRole === 'chef') && (
                        <button
                          onClick={() => restoreStock(item.id)}
                          className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors inline-flex items-center gap-1"
                          title="Zaxirani To'ldirish (Restore)"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Tiklash</span>
                        </button>
                      )}

                      {/* Chef Edit Info (Exchange) - ONLY name and desc, NO price edit! */}
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setEditName(item.name);
                          setEditDesc(item.description);
                          setEditVoiceText(item.voiceText);
                        }}
                        className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors inline-flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>🖊️ O'zgartirish</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Logs (Right Column) */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
          <div>
            <h2 className="font-extrabold text-zinc-900 dark:text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
              📊 So'nggi Buyurtmalar va Harakatlar
            </h2>
            <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
              {state.stats.ordersLog && state.stats.ordersLog.length > 0 ? (
                state.stats.ordersLog.map((log) => (
                  <div key={log.id} className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700">
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono mb-1">
                      <span>Xodim Harakati</span>
                      <span>{log.time}</span>
                    </div>
                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                      {log.action}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-zinc-400 text-center py-6">Xozircha buyurtma harakatlari yo'q.</p>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2.5 text-xs text-zinc-500 bg-amber-500/5 p-3 rounded-lg border border-amber-500/10">
              <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
              <span>Oshpaz va afitsiantlar bu yerda faqat ovqat zaxirasini kamaytirishi yoki taom matnini yangilashi mumkin.</span>
            </div>
          </div>
        </div>
      </div>

      {/* DIALOG FOR "🖊️ Exchange" EDITING (NO price change option for Chef!) */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 max-w-md w-full rounded-2xl p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-lg font-black text-zinc-900 dark:text-white mb-4 flex items-center gap-1.5">
              <Edit3 className="w-5 h-5 text-blue-500" />
              Taom Ma'lumotini Tahrirlash (Exchange)
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">Taom Nomi</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">Taom Ta'rifi (Description)</label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-zinc-400 block">Ovozli Ta'rif (Text to Speech)</label>
                  <span className="text-[10px] text-amber-500 font-bold">Ovozli aytib beriladi</span>
                </div>
                <textarea
                  rows={2}
                  value={editVoiceText}
                  onChange={(e) => setEditVoiceText(e.target.value)}
                  placeholder="Agar bo'sh qoldirilsa, nomi va ta'rifi avtomatik o'qiladi."
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-medium">
                ⚠️ Oshpaz taom narxini o'zgartira olmaydi. Bu faqat Admin panel ruxsatida bo'ladi.
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setEditingItem(null)}
                className="flex-1 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-bold transition-colors"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
