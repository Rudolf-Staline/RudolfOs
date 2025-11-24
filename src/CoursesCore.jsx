import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Library, Calculator, Binary, Atom, Briefcase, FileText, Plus, Search, CheckCircle2, Clock, AlertCircle, Eye, X, Save, Loader2, Trash2 } from "lucide-react";
import { supabase } from "./supabaseClient";
import { useTheme } from "./ThemeContext"; // <-- Theme

const SUBJECTS = [
  { id: "MATH", label: "Mathématiques", icon: Calculator, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  { id: "PHYS", label: "Physique", icon: Atom, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  { id: "INFO", label: "Informatique", icon: Binary, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  { id: "MNGT", label: "Management", icon: Briefcase, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
];

const STATUS_CONFIG = {
  MASTERED: { label: "Maîtrisé", color: "text-emerald-400", icon: CheckCircle2 },
  LEARNING: { label: "En cours", color: "text-amber-400", icon: Clock },
  REVIEW: { label: "À revoir", color: "text-rose-400", icon: AlertCircle },
};

const SheetCard = ({ sheet, onDelete, theme }) => {
  const subject = SUBJECTS.find(s => s.id === sheet.subject) || SUBJECTS[0];
  const status = STATUS_CONFIG[sheet.status] || STATUS_CONFIG.LEARNING;
  const StatusIcon = status.icon;

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ y: -5 }} className={`group ${theme.colors.panel} border ${theme.colors.border} hover:border-white/20 rounded-2xl p-6 backdrop-blur-xl cursor-pointer relative overflow-hidden transition-all duration-300`}>
      <div className={`absolute top-0 left-0 w-full h-1 ${subject.bg.replace('/10', '')}`} />
      <div className="flex justify-between items-start mb-4"><span className={`text-[10px] font-bold px-2 py-1 rounded-lg border uppercase tracking-wider ${subject.color} ${subject.bg} ${subject.border}`}>{subject.label}</span><div className={`flex items-center gap-1 text-xs font-bold ${status.color}`}><StatusIcon size={14} /> {status.label}</div></div>
      <h3 className={`text-lg font-bold ${theme.colors.text} mb-2 font-serif group-hover:${theme.colors.accent} transition-colors`}>{sheet.title}</h3>
      <p className={`${theme.colors.textDim} text-sm line-clamp-3 mb-6 font-mono opacity-80 leading-relaxed`}>{sheet.preview}</p>
      <div className={`flex items-center justify-between pt-4 border-t ${theme.colors.border} text-xs ${theme.colors.textDim}`}><span>ID: {sheet.id}</span><button onClick={() => onDelete(sheet.id)} className="opacity-0 group-hover:opacity-100 p-2 hover:bg-rose-500/20 hover:text-rose-400 rounded-full transition-colors"><Trash2 size={16} /></button></div>
    </motion.div>
  );
};

const CreateModal = ({ onClose, onSave, theme }) => {
    const [formData, setFormData] = useState({ title: "", subject: "MATH", status: "LEARNING", preview: "" });
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className={`${theme.colors.bg} border ${theme.colors.border} rounded-3xl p-8 w-full max-w-md shadow-2xl`}>
                <div className="flex justify-between mb-6"><h3 className={`text-xl font-bold ${theme.colors.text}`}>Nouvelle Fiche</h3><button onClick={onClose}><X className={`${theme.colors.textDim} hover:text-white`} /></button></div>
                <div className="space-y-4">
                    <input placeholder="Titre" className={`w-full bg-black/20 border ${theme.colors.border} rounded-xl p-3 ${theme.colors.text} outline-none focus:border-indigo-500`} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                    <div className="grid grid-cols-2 gap-4">
                        <select className={`bg-black/20 border ${theme.colors.border} rounded-xl p-3 ${theme.colors.textDim} outline-none`} value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})}>{SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
                        <select className={`bg-black/20 border ${theme.colors.border} rounded-xl p-3 ${theme.colors.textDim} outline-none`} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}><option value="LEARNING">En cours</option><option value="MASTERED">Maîtrisé</option><option value="REVIEW">À revoir</option></select>
                    </div>
                    <textarea placeholder="Résumé..." className={`w-full bg-black/20 border ${theme.colors.border} rounded-xl p-3 ${theme.colors.text} outline-none focus:border-indigo-500 h-32 resize-none font-mono text-sm`} value={formData.preview} onChange={e => setFormData({...formData, preview: e.target.value})} />
                    <button onClick={() => onSave(formData)} className={`w-full py-3 ${theme.colors.primary} ${theme.colors.primaryHover} text-white font-bold rounded-xl flex items-center justify-center gap-2`}><Save size={18} /> Enregistrer</button>
                </div>
            </div>
        </motion.div>
    );
};

export default function CoursesCore() {
  const { theme } = useTheme();
  const [activeSubject, setActiveSubject] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [sheets, setSheets] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSheets = async () => { try { const { data, error } = await supabase.from('study_sheets').select('*').order('created_at', { ascending: false }); if (error) throw error; setSheets(data); } catch (e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { fetchSheets(); }, []);
  const handleCreate = async (data) => { try { const { error } = await supabase.from('study_sheets').insert([data]); if (error) throw error; setIsCreating(false); fetchSheets(); } catch (e) { console.error(e); } };
  const handleDelete = async (id) => { if(!window.confirm("Supprimer ?")) return; try { await supabase.from('study_sheets').delete().eq('id', id); setSheets(sheets.filter(s => s.id !== id)); } catch(e) { console.error(e); } };
  const filtered = sheets.filter(s => { const matchSubject = activeSubject === "ALL" || s.subject === activeSubject; const matchSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()); return matchSubject && matchSearch; });

  return (
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto h-full flex flex-col relative">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
        <div><h2 className={`text-2xl font-bold ${theme.colors.text} flex items-center gap-3`}><div className={`p-2 ${theme.colors.primary} rounded-lg shadow-lg`}><Library size={20} className="text-white"/></div>Fiches & Révisions</h2></div>
        <div className="flex gap-4 w-full md:w-auto"><div className="relative group flex-1 md:w-64"><Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.colors.textDim}`} size={18} /><input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Chercher..." className={`w-full ${theme.colors.panel} border ${theme.colors.border} rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-all ${theme.colors.text}`} /></div><button onClick={() => setIsCreating(true)} className={`h-12 w-12 rounded-2xl ${theme.colors.primary} ${theme.colors.primaryHover} text-white flex items-center justify-center shadow-lg transition-all active:scale-95`}><Plus size={24} /></button></div>
      </div>
      <div className="flex flex-col lg:flex-row gap-8 h-full min-h-0">
        <div className="lg:w-64 flex-shrink-0 space-y-2">
            <button onClick={() => setActiveSubject("ALL")} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between ${activeSubject === "ALL" ? `${theme.colors.primary} text-white shadow-lg` : `${theme.colors.textDim} hover:bg-white/5 hover:text-white`}`}><span>Toutes</span><span className="bg-black/20 px-2 py-0.5 rounded text-xs">{sheets.length}</span></button>
            <div className={`h-[1px] ${theme.colors.border} my-2 mx-4`} />
            {SUBJECTS.map(sub => (<button key={sub.id} onClick={() => setActiveSubject(sub.id)} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between group ${activeSubject === sub.id ? `bg-white/10 border ${sub.border} ${sub.color}` : `${theme.colors.textDim} hover:bg-white/5 hover:text-white`}`}><div className="flex items-center gap-3"><sub.icon size={18} /><span>{sub.label}</span></div></button>))}
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? <div className="flex justify-center pt-20"><Loader2 className={`animate-spin ${theme.colors.accent}`}/></div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">{filtered.map(sheet => <SheetCard key={sheet.id} sheet={sheet} onDelete={handleDelete} theme={theme} />)}<button onClick={() => setIsCreating(true)} className={`border-2 border-dashed ${theme.colors.border} hover:border-indigo-500/30 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[200px] ${theme.colors.textDim} hover:${theme.colors.accent} transition-all group`}><div className="w-12 h-12 rounded-full bg-white/5 group-hover:bg-indigo-500/10 flex items-center justify-center mb-4 transition-colors"><FileText size={24} /></div><span className="font-bold text-sm uppercase tracking-widest">Nouvelle Fiche</span></button></div>}
        </div>
      </div>
      <AnimatePresence>{isCreating && <CreateModal onClose={() => setIsCreating(false)} onSave={handleCreate} theme={theme} />}</AnimatePresence>
    </div>
  );
}