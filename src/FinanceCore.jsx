import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, TrendingDown, Wallet, Plus, ArrowUpRight, ArrowDownLeft, MoreHorizontal, 
  DollarSign, Coffee, Server, Briefcase, ShoppingCart, Loader2 
} from "lucide-react";
import { AreaChart, Area, Tooltip, ResponsiveContainer, XAxis, CartesianGrid } from "recharts";
import { supabase } from "./supabaseClient";
import { useTheme } from "./ThemeContext"; // <-- IMPORT

const CATEGORY_ICONS = { 'WORK': Briefcase, 'TECH': Server, 'FOOD': Coffee, 'SHOPPING': ShoppingCart, 'OTHER': DollarSign };

const StatCard = ({ label, value, trend, positive, theme }) => (
  <div className={`${theme.colors.panel} border ${theme.colors.border} rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden group`}>
    <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20 -mr-10 -mt-10 transition-colors duration-500 ${positive ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
    <h3 className={`${theme.colors.textDim} text-xs font-bold uppercase tracking-widest mb-2`}>{label}</h3>
    <div className={`text-2xl font-bold ${theme.colors.text} mb-2`}>{value}</div>
    <div className={`flex items-center text-xs font-medium ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
      {positive ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />} {trend}
    </div>
  </div>
);

const TransactionItem = ({ t, onDelete, currency, theme }) => {
  const Icon = CATEGORY_ICONS[t.category] || DollarSign;
  const dateStr = new Date(t.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} layout className={`flex items-center justify-between p-4 hover:bg-white/5 rounded-2xl transition-colors group cursor-default`}>
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
          <Icon size={18} />
        </div>
        <div>
          <div className={`text-sm font-medium ${theme.colors.text}`}>{t.label}</div>
          <div className={`text-xs ${theme.colors.textDim}`}>{dateStr}</div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className={`text-sm font-bold font-mono ${t.type === 'INCOME' ? 'text-emerald-400' : theme.colors.text}`}>
            {t.type === 'INCOME' ? '+' : '-'}{t.amount.toFixed(2)} {currency}
        </div>
        <button onClick={() => onDelete(t.id)} className={`opacity-0 group-hover:opacity-100 ${theme.colors.textDim} hover:text-rose-500 transition-all`}><MoreHorizontal size={16} /></button>
      </div>
    </motion.div>
  );
};

export default function FinanceCore({ currency = "€" }) {
  const { theme } = useTheme(); // <-- HOOK
  const [view, setView] = useState("OVERVIEW");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("OTHER");

  const fetchData = async () => {
    try {
        const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setTransactions(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (type) => {
    if(!amount || !label) return;
    const val = parseFloat(amount);
    const newT = { id: Date.now(), label, amount: val, type, category, created_at: new Date().toISOString() };
    setTransactions([newT, ...transactions]);
    setView("OVERVIEW"); setAmount(""); setLabel("");
    await supabase.from('transactions').insert([{ label, amount: val, type, category }]);
    fetchData();
  };

  const handleDelete = async (id) => {
      if(!window.confirm("Supprimer ?")) return;
      setTransactions(transactions.filter(t => t.id !== id));
      await supabase.from('transactions').delete().eq('id', id);
  };

  const balance = transactions.reduce((acc, t) => t.type === 'INCOME' ? acc + t.amount : acc - t.amount, 0);
  const currentMonth = new Date().getMonth();
  const expenses = transactions.filter(t => t.type === 'EXPENSE' && new Date(t.created_at).getMonth() === currentMonth).reduce((acc, t) => acc + t.amount, 0);

  const chartData = useMemo(() => {
      const sorted = [...transactions].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      const grouped = {};
      let runningBalance = 0;
      sorted.forEach(t => {
          const dateKey = new Date(t.created_at).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
          runningBalance += (t.type === 'INCOME' ? t.amount : -t.amount);
          grouped[dateKey] = runningBalance;
      });
      return Object.keys(grouped).map(day => ({ day, solde: grouped[day] })).slice(-7);
  }, [transactions]);

  return (
    <div className="p-4 md:p-8 w-full max-w-6xl mx-auto min-h-[80vh]">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
           <h2 className={`text-2xl font-bold ${theme.colors.text} flex items-center gap-3`}>
             <div className={`p-2 rounded-lg shadow-lg ${theme.colors.primary} ${theme.colors.glow}`}><Wallet size={20} className="text-white" /></div>
             Portefeuille
           </h2>
        </div>
        <div className={`flex ${theme.colors.panel} p-1 rounded-full border ${theme.colors.border} backdrop-blur-md`}>
            <button onClick={() => setView("OVERVIEW")} className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${view === "OVERVIEW" ? `${theme.colors.primary} text-white shadow-md` : `${theme.colors.textDim} hover:text-white`}`}>Aperçu</button>
            <button onClick={() => setView("ADD")} className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${view === "ADD" ? `${theme.colors.primary} text-white shadow-md` : `${theme.colors.textDim} hover:text-white`}`}><Plus size={14} /> Nouveau</button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === "OVERVIEW" && (
            <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <StatCard theme={theme} label="Solde Total" value={`${balance.toFixed(2)} ${currency}`} trend="Global" positive={balance >= 0} />
                        <StatCard theme={theme} label="Dépenses (Mois)" value={`${expenses.toFixed(2)} ${currency}`} trend="Sorties" positive={false} />
                    </div>
                    <div className={`${theme.colors.panel} border ${theme.colors.border} rounded-3xl p-6 backdrop-blur-xl h-[300px] relative`}>
                        {loading ? <div className="flex h-full items-center justify-center"><Loader2 className={`animate-spin ${theme.colors.accent}`}/></div> : 
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs><linearGradient id="colorSolde" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }} itemStyle={{ color: '#818cf8' }} />
                                    <Area type="monotone" dataKey="solde" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSolde)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        }
                    </div>
                </div>
                <div className={`${theme.colors.panel} border ${theme.colors.border} rounded-3xl p-6 backdrop-blur-xl flex flex-col h-full min-h-[400px]`}>
                    <h3 className={`${theme.colors.textDim} text-xs font-bold uppercase tracking-widest mb-6`}>Récent</h3>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                        {loading ? <Loader2 className="animate-spin mx-auto"/> : transactions.map(t => <TransactionItem key={t.id} t={t} onDelete={handleDelete} currency={currency} theme={theme} />)}
                    </div>
                </div>
            </motion.div>
        )}

        {view === "ADD" && (
            <motion.div key="add" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`w-full max-w-lg mx-auto ${theme.colors.panel} border ${theme.colors.border} p-8 rounded-3xl backdrop-blur-xl mt-10`}>
                <h3 className={`text-center text-xl font-bold ${theme.colors.text} mb-8`}>Nouvelle Transaction</h3>
                <div className="relative mb-6 group">
                    <span className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme.colors.textDim} text-lg font-mono`}>{currency}</span>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className={`w-full bg-black/20 border ${theme.colors.border} rounded-2xl py-4 pl-10 pr-4 text-2xl ${theme.colors.text} outline-none focus:border-indigo-500/50 transition-all font-mono`} autoFocus />
                </div>
                <div className="mb-6"><input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="Titre" className={`w-full bg-black/20 border ${theme.colors.border} rounded-2xl py-4 px-6 text-base ${theme.colors.text} outline-none focus:border-indigo-500/50 transition-all`} /></div>
                <div className="mb-8"><select value={category} onChange={e => setCategory(e.target.value)} className={`w-full bg-black/20 border ${theme.colors.border} rounded-2xl py-4 px-6 text-base ${theme.colors.textDim} outline-none appearance-none`}>
                        <option value="OTHER">Autre</option><option value="WORK">Travail / Revenu</option><option value="TECH">Tech</option><option value="FOOD">Alimentation</option><option value="SHOPPING">Achats</option>
                </select></div>
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => handleAdd('EXPENSE')} className="py-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400 font-bold hover:bg-rose-500 hover:text-white transition-all flex flex-col items-center gap-2"><ArrowDownLeft size={20} /> Dépense</button>
                    <button onClick={() => handleAdd('INCOME')} className="py-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 font-bold hover:bg-emerald-500 hover:text-white transition-all flex flex-col items-center gap-2"><ArrowUpRight size={20} /> Revenu</button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}