import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Search, Plus, AlertCircle, Box, TrendingUp, X, Save, ShoppingCart, Loader2 } from "lucide-react";
import { supabase } from "./supabaseClient";
import { useTheme } from "./ThemeContext"; // <-- IMPORT

// --- COMPONENTS ---

const StatBadge = ({ icon: Icon, label, value, color, theme }) => (
  <div className={`flex items-center gap-3 ${theme.colors.panel} border ${theme.colors.border} px-5 py-3 rounded-2xl backdrop-blur-md`}>
    <div className={`p-2 rounded-lg ${color} bg-opacity-20 text-white`}><Icon size={18} /></div>
    <div><div className={`text-[10px] ${theme.colors.textDim} uppercase font-bold tracking-wider`}>{label}</div><div className={`text-lg font-bold ${theme.colors.text} font-mono`}>{value}</div></div>
  </div>
);

const ProductCard = ({ item, onClick, currency, theme }) => {
  const isLowStock = item.quantity <= item.min_stock;
  const target = (item.min_stock * 3) || 10; 
  const stockPercent = Math.min(100, (item.quantity / target) * 100);
  const getBgColor = (cat) => { if(cat === 'Hardware') return 'bg-blue-500'; if(cat === 'Software') return 'bg-purple-500'; if(cat === 'Consommable') return 'bg-amber-600'; return 'bg-slate-600'; };

  return (
    <motion.div layout onClick={onClick} className={`group relative ${theme.colors.panel} border ${isLowStock ? 'border-rose-500/30' : theme.colors.border} hover:border-white/20 rounded-3xl p-5 cursor-pointer backdrop-blur-xl transition-all duration-300 overflow-hidden`}>
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`w-12 h-12 rounded-2xl ${getBgColor(item.category)} flex items-center justify-center text-white shadow-lg`}><Package size={20} /></div>
        <div className="text-right"><span className={`block text-lg font-bold ${theme.colors.text} font-mono`}>{item.price} {currency}</span><span className={`text-[10px] ${theme.colors.textDim} uppercase font-bold`}>Unitaire</span></div>
      </div>
      <div className="relative z-10">
        <h3 className={`text-base font-bold ${theme.colors.text} mb-1 group-hover:${theme.colors.accent} transition-colors truncate`}>{item.name}</h3>
        <div className="flex items-center gap-2 mb-4"><span className={`text-xs px-2 py-0.5 rounded bg-white/5 ${theme.colors.textDim} border border-white/5`}>{item.category}</span>{isLowStock && <span className="flex items-center gap-1 text-xs text-rose-400 font-bold"><AlertCircle size={10} /> Stock Faible</span>}</div>
        <div className="space-y-1"><div className={`flex justify-between text-xs font-medium ${theme.colors.textDim}`}><span>Stock: {item.quantity}</span><span>Seuil: {item.min_stock}</span></div><div className="h-2 w-full bg-black/20 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${stockPercent}%` }} className={`h-full rounded-full ${isLowStock ? 'bg-rose-500' : 'bg-emerald-500'}`} /></div></div>
      </div>
    </motion.div>
  );
};

const EditDrawer = ({ item, onClose, onSave, onDelete, currency, theme }) => {
    const [formData, setFormData] = useState(item || { name: "", category: "Consommable", price: 0, quantity: 0, min_stock: 1 });

    return (
        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} 
            className={`absolute top-0 right-0 bottom-0 w-full md:w-[450px] ${theme.colors.bg} border-l ${theme.colors.border} shadow-2xl z-50 p-8 flex flex-col`}
        >
            <div className="flex items-center justify-between mb-8"><h3 className={`text-xl font-bold ${theme.colors.text}`}>{item ? "Modifier l'article" : "Nouvel Article"}</h3><button onClick={onClose} className={`p-2 hover:bg-white/10 rounded-full ${theme.colors.textDim} hover:text-white transition-colors`}><X size={20}/></button></div>
            <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar">
                <div className="space-y-2"><label className={`text-xs font-bold ${theme.colors.textDim} uppercase tracking-wider`}>Désignation</label><input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={`w-full bg-black/20 border ${theme.colors.border} rounded-xl p-4 ${theme.colors.text} focus:border-indigo-500 transition-all outline-none`} placeholder="Ex: Disque Dur 1To"/></div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><label className={`text-xs font-bold ${theme.colors.textDim} uppercase tracking-wider`}>Catégorie</label><select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className={`w-full bg-black/20 border ${theme.colors.border} rounded-xl p-4 ${theme.colors.text} outline-none appearance-none`}><option>Hardware</option><option>Software</option><option>Consommable</option><option>Service</option><option>Divers</option></select></div>
                    <div className="space-y-2"><label className={`text-xs font-bold ${theme.colors.textDim} uppercase tracking-wider`}>Prix ({currency})</label><input type="number" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} className={`w-full bg-black/20 border ${theme.colors.border} rounded-xl p-4 ${theme.colors.text} outline-none font-mono`}/></div>
                </div>
                <div className={`p-6 bg-black/20 rounded-2xl border ${theme.colors.border} space-y-6`}>
                    <div className={`flex items-center gap-2 ${theme.colors.accent} mb-2`}><Box size={18} /> <span className="font-bold text-sm">Gestion du Stock</span></div>
                    <div className="flex items-center justify-between"><label className={`text-sm ${theme.colors.textDim}`}>Quantité Actuelle</label><div className="flex items-center gap-3 bg-black/40 rounded-lg p-1"><button onClick={() => setFormData({...formData, quantity: Math.max(0, formData.quantity - 1)})} className="w-8 h-8 rounded bg-white/5 hover:bg-white/10 text-white font-bold">-</button><span className={`w-8 text-center font-mono font-bold ${theme.colors.text}`}>{formData.quantity}</span><button onClick={() => setFormData({...formData, quantity: formData.quantity + 1})} className="w-8 h-8 rounded bg-white/5 hover:bg-white/10 text-white font-bold">+</button></div></div>
                    <div className="flex items-center justify-between"><label className={`text-sm ${theme.colors.textDim}`}>Seuil d'alerte</label><input type="number" value={formData.min_stock} onChange={e => setFormData({...formData, min_stock: parseInt(e.target.value)})} className={`w-16 bg-black/40 border ${theme.colors.border} rounded-lg p-2 text-center ${theme.colors.text} font-mono text-sm`}/></div>
                </div>
            </div>
            <div className={`mt-8 pt-6 border-t ${theme.colors.border} flex gap-4`}>
                {item && <button onClick={() => { onDelete(item.id); onClose(); }} className="px-4 py-4 bg-rose-500/10 text-rose-400 font-bold rounded-xl hover:bg-rose-500 hover:text-white transition-all">Supprimer</button>}
                <button onClick={() => { onSave(formData); onClose(); }} className={`flex-1 py-4 ${theme.colors.primary} ${theme.colors.primaryHover} text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2`}><Save size={20} /> Enregistrer</button>
            </div>
        </motion.div>
    );
};

export default function InventoryCore({ currency = "€" }) {
  const { theme } = useTheme(); // <-- HOOK THÈME
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchInventory = async () => { try { const { data, error } = await supabase.from('inventory').select('*').order('name'); if(error) throw error; setItems(data); } catch (e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { fetchInventory(); }, []);

  const handleSave = async (itemData) => {
    if (itemData.id) { setItems(items.map(i => i.id === itemData.id ? itemData : i)); } else { const tempId = Date.now(); setItems([...items, { ...itemData, id: tempId }]); }
    try { const { error } = await supabase.from('inventory').upsert([itemData]); if(error) throw error; fetchInventory(); } catch (e) { console.error(e); fetchInventory(); }
  };

  const handleDelete = async (id) => {
      if(!window.confirm("Supprimer définitivement ?")) return;
      setItems(items.filter(i => i.id !== id));
      await supabase.from('inventory').delete().eq('id', id);
  };

  const filtered = items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalValue = items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
  const lowStockCount = items.filter(i => i.quantity <= i.min_stock).length;

  return (
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto h-full relative overflow-hidden">
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <StatBadge icon={Box} label="Total Références" value={items.length} color="bg-blue-500" theme={theme} />
        <StatBadge icon={TrendingUp} label="Valeur Stock" value={`${totalValue.toFixed(2)} ${currency}`} color="bg-emerald-500" theme={theme} />
        <StatBadge icon={AlertCircle} label="Alertes Stock" value={lowStockCount} color="bg-rose-500" theme={theme} />
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h2 className={`text-2xl font-bold ${theme.colors.text} flex items-center gap-3`}><div className={`p-2 ${theme.colors.primary} rounded-lg shadow-lg ${theme.colors.glow}`}><ShoppingCart size={20} className="text-white" /></div>Inventaire</h2>
        <div className="flex gap-4 w-full md:w-auto">
            <div className="relative group flex-1 md:w-64">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.colors.textDim} group-hover:${theme.colors.accent} transition-colors`} size={18} />
                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Chercher..." className={`w-full ${theme.colors.panel} border ${theme.colors.border} rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-all ${theme.colors.text}`} />
            </div>
            <button onClick={() => { setSelectedItem(null); setDrawerOpen(true); }} className={`h-12 w-12 rounded-2xl ${theme.colors.primary} ${theme.colors.primaryHover} text-white flex items-center justify-center shadow-lg transition-all active:scale-95`}><Plus size={24} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-20 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(100vh - 250px)' }}>
        {loading ? <div className="col-span-full flex justify-center p-10"><Loader2 className={`animate-spin ${theme.colors.accent}`}/></div> : filtered.map(item => <ProductCard key={item.id} item={item} currency={currency} onClick={() => { setSelectedItem(item); setDrawerOpen(true); }} theme={theme} />)}
        {!loading && <button onClick={() => { setSelectedItem(null); setDrawerOpen(true); }} className={`border-2 border-dashed ${theme.colors.border} hover:border-indigo-500/30 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[200px] ${theme.colors.textDim} hover:${theme.colors.accent} transition-all group`}><div className="w-12 h-12 rounded-full bg-white/5 group-hover:bg-indigo-500/10 flex items-center justify-center mb-4 transition-colors"><Plus size={24} /></div><span className="font-bold text-sm uppercase tracking-widest">Ajouter Référence</span></button>}
      </div>

      <AnimatePresence>{drawerOpen && (<><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawerOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40" /><EditDrawer item={selectedItem} currency={currency} theme={theme} onClose={() => setDrawerOpen(false)} onSave={handleSave} onDelete={handleDelete} /></>)}</AnimatePresence>
    </div>
  );
}