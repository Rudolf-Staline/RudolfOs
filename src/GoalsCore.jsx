import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Target, Trophy, Mountain, CheckCircle2, Circle, Calendar, 
  TrendingUp, Plus, X, Trash2, Loader2 
} from "lucide-react";
import { supabase } from "./supabaseClient";
import { useTheme } from "./ThemeContext";
import { useNotification } from "./NotificationContext";

const CATEGORIES = {
  ACADEMIC: { label: "Études", color: "bg-blue-500", text: "text-blue-400", border: "border-blue-500/30", icon: Trophy },
  FINANCE: { label: "Finance", color: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500/30", icon: TrendingUp },
  SPIRITUAL: { label: "Esprit", color: "bg-amber-500", text: "text-amber-400", border: "border-amber-500/30", icon: Mountain },
  PERSONAL: { label: "Perso", color: "bg-rose-500", text: "text-rose-400", border: "border-rose-500/30", icon: Target },
};

const GoalCard = ({ goal, onClick, theme }) => {
  const style = CATEGORIES[goal.category] || CATEGORIES.PERSONAL;
  const Icon = style.icon;
  const milestones = goal.goal_milestones || [];
  const completed = milestones.filter(m => m.done).length;
  const progress = milestones.length === 0 ? 0 : Math.round((completed / milestones.length) * 100);

  return (
    <motion.div layoutId={`goal-${goal.id}`} onClick={onClick} className={`group relative p-6 rounded-3xl ${theme.colors.panel} border ${theme.colors.border} hover:border-white/20 backdrop-blur-xl cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-2xl`}>
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity ${style.color}`} />
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={`w-12 h-12 rounded-2xl ${style.color} bg-opacity-20 flex items-center justify-center ${style.text} border border-white/5`}><Icon size={24} /></div>
          <span className={`text-[10px] font-bold px-3 py-1 rounded-full bg-black/20 border border-white/10 uppercase tracking-wider ${style.text}`}>{goal.deadline || "En cours"}</span>
        </div>
        <h3 className={`text-xl font-bold ${theme.colors.text} mb-2 group-hover:${theme.colors.accent} transition-colors`}>{goal.title}</h3>
        <div className="space-y-2 mt-6">
          <div className={`flex justify-between text-xs font-medium ${theme.colors.textDim}`}><span>Progression</span><span className={theme.colors.text}>{progress}%</span></div>
          <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1 }} className={`h-full rounded-full ${style.color}`} /></div>
        </div>
        <div className={`mt-4 flex items-center gap-2 text-xs ${theme.colors.textDim}`}><CheckCircle2 size={12} /><span>{completed}/{milestones.length} jalons atteints</span></div>
      </div>
    </motion.div>
  );
};

const GoalDetail = ({ goal, onClose, onToggle, onAdd, onDeleteM, onDeleteG, theme }) => {
  const style = CATEGORIES[goal.category] || CATEGORIES.PERSONAL;
  const [newM, setNewM] = useState("");

  const handleAddSubmit = () => {
    if (newM.trim()) {
      onAdd(goal.id, newM);
      setNewM("");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div className={`w-full max-w-2xl ${theme.colors.bg} border ${theme.colors.border} rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]`} onClick={(e) => e.stopPropagation()} layoutId={`goal-${goal.id}`}>
        <div className="flex justify-between items-start mb-8">
            <div>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg ${style.bg} ${style.text} ${style.border} bg-opacity-10 border text-xs font-bold uppercase tracking-widest mb-4`}>{style.label}</div>
                <h2 className={`text-3xl font-bold ${theme.colors.text} mb-2`}>{goal.title}</h2>
                <div className={`flex items-center gap-2 ${theme.colors.textDim} text-sm`}><Calendar size={16} /> Target: {goal.deadline || "Non défini"}</div>
            </div>
            <button onClick={onClose} className={`p-2 rounded-full hover:bg-white/10 ${theme.colors.textDim} hover:text-white`}><X size={24} /></button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
          <h3 className={`text-sm font-bold ${theme.colors.textDim} uppercase tracking-widest border-b ${theme.colors.border} pb-2`}>Plan d'action</h3>
          <div className="space-y-2">
            {goal.goal_milestones && goal.goal_milestones.map((m) => (
              <div key={m.id} className={`group flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${m.done ? "bg-emerald-500/10 border-emerald-500/20" : `bg-black/20 ${theme.colors.border} hover:border-indigo-500/30`}`}>
                <div onClick={() => onToggle(m.id, !m.done)} className={`flex-shrink-0 transition-colors ${m.done ? "text-emerald-500" : theme.colors.textDim}`}>{m.done ? <CheckCircle2 size={24} /> : <Circle size={24} />}</div>
                <span className={`flex-1 text-sm font-medium transition-all ${m.done ? "text-emerald-100 line-through opacity-50" : theme.colors.text}`}>{m.text}</span>
                <button onClick={() => onDeleteM(m.id)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-500"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>
        <div className={`mt-6 pt-6 border-t ${theme.colors.border} flex flex-col gap-4`}>
           <div className="flex gap-2">
               <input 
                  value={newM} 
                  onChange={(e) => setNewM(e.target.value)} 
                  onKeyDown={(e) => { if(e.key === 'Enter') handleAddSubmit(); }} 
                  placeholder="Ajouter une étape clé..." 
                  className={`flex-1 bg-black/20 border ${theme.colors.border} rounded-xl px-4 py-3 text-sm ${theme.colors.text} outline-none focus:border-indigo-500`} 
               />
               <button onClick={handleAddSubmit} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white"><Plus size={20} /></button>
           </div>
           <button onClick={() => onDeleteG(goal.id)} className="text-xs text-rose-500 hover:text-rose-400 hover:underline self-start">Supprimer cet objectif</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function GoalsCore() {
  const { theme } = useTheme();
  const { notify } = useNotification();
  const [goals, setGoals] = useState([]);
  const [selId, setSelId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isC, setIsC] = useState(false);
  const [nT, setNT] = useState("");
  const [nC, setNC] = useState("PERSONAL");

  const fetchGoals = async () => { try { const { data, error } = await supabase.from('goals').select('*, goal_milestones(*)').order('created_at', { ascending: false }); if (error) throw error; setGoals(data.map(g => ({...g, goal_milestones: g.goal_milestones.sort((a, b) => a.id - b.id)}))); } catch (e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { fetchGoals(); }, []);

  const handleCreate = async () => { if(!nT.trim()) return; try { await supabase.from('goals').insert([{ title: nT, category: nC, deadline: "En cours" }]); setIsC(false); setNT(""); fetchGoals(); notify("Objectif créé !", "SUCCESS"); } catch(e) { notify("Erreur création", "ERROR"); } };
  const handleDeleteG = async (id) => { if(!window.confirm("Supprimer ?")) return; try { await supabase.from('goals').delete().eq('id', id); setSelId(null); fetchGoals(); notify("Objectif supprimé", "INFO"); } catch(e) { console.error(e); } };
  const handleAddM = async (gid, txt) => { try { await supabase.from('goal_milestones').insert([{ goal_id: gid, text: txt }]); fetchGoals(); } catch(e) { console.error(e); } };
  const handleToggleM = async (mid, stat) => { setGoals(prev => prev.map(g => ({...g, goal_milestones: g.goal_milestones.map(m => m.id === mid ? { ...m, done: stat } : m)}))); try { await supabase.from('goal_milestones').update({ done: stat }).eq('id', mid); fetchGoals(); } catch(e) { console.error(e); } };
  const handleDeleteM = async (mid) => { try { await supabase.from('goal_milestones').delete().eq('id', mid); fetchGoals(); } catch(e) { console.error(e); } };

  const selGoal = goals.find(g => g.id === selId);

  return (
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto h-full relative">
      <div className="flex justify-between items-center mb-10">
        <div><h2 className={`text-2xl font-bold ${theme.colors.text} flex items-center gap-3`}><div className="p-2 bg-rose-500 rounded-lg shadow-lg shadow-rose-500/30"><Target size={20} className="text-white" /></div>Objectifs Stratégiques</h2><p className={`${theme.colors.textDim} text-sm mt-1`}>Vision & Exécution.</p></div>
        <button onClick={() => setIsC(!isC)} className={`h-12 w-12 rounded-2xl ${theme.colors.primary} ${theme.colors.primaryHover} text-white flex items-center justify-center shadow-lg transition-all active:scale-95`}>{isC ? <X size={24}/> : <Plus size={24} />}</button>
      </div>

      <AnimatePresence>{isC && (
          <motion.div initial={{ height: 0, opacity: 0, marginBottom: 0 }} animate={{ height: 'auto', opacity: 1, marginBottom: 32 }} exit={{ height: 0, opacity: 0, marginBottom: 0 }} className="overflow-hidden">
              <div className={`${theme.colors.panel} border ${theme.colors.border} p-6 rounded-3xl flex flex-col md:flex-row gap-4 items-end`}>
                  <div className="flex-1 w-full space-y-2"><label className={`text-xs font-bold ${theme.colors.textDim} uppercase`}>Titre</label><input value={nT} onChange={e => setNT(e.target.value)} className={`w-full bg-black/20 border ${theme.colors.border} rounded-xl px-4 py-3 ${theme.colors.text} outline-none focus:border-indigo-500`} /></div>
                  <div className="w-full md:w-48 space-y-2"><label className={`text-xs font-bold ${theme.colors.textDim} uppercase`}>Catégorie</label><select value={nC} onChange={e => setNC(e.target.value)} className={`w-full bg-black/20 border ${theme.colors.border} rounded-xl px-4 py-3 ${theme.colors.text} outline-none appearance-none`}>{Object.keys(CATEGORIES).map(c => <option key={c} value={c}>{CATEGORIES[c].label}</option>)}</select></div>
                  <button onClick={handleCreate} className="w-full md:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg">Lancer</button>
              </div>
          </motion.div>
      )}</AnimatePresence>

      {loading ? <div className="flex justify-center pt-20"><Loader2 className={`animate-spin ${theme.colors.accent}`} size={40} /></div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">{goals.map(g => <GoalCard key={g.id} goal={g} onClick={() => setSelId(g.id)} theme={theme} />)}</div>}
      <AnimatePresence>{selId && selGoal && <GoalDetail goal={selGoal} onClose={() => setSelId(null)} onToggle={handleToggleM} onAdd={handleAddM} onDeleteM={handleDeleteM} onDeleteG={handleDeleteG} theme={theme} />}</AnimatePresence>
    </div>
  );
}