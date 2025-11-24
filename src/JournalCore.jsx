import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PenTool, Calendar, Smile, Meh, Frown, CloudRain, Sun, Save, Trash2, Plus, Quote, Loader2 } from "lucide-react";
import { supabase } from "./supabaseClient";
import { useTheme } from "./ThemeContext"; // <-- IMPORT

const MOODS = {
  GREAT: { icon: Sun, color: "text-amber-400", bg: "bg-amber-500/20" },
  GOOD: { icon: Smile, color: "text-emerald-400", bg: "bg-emerald-500/20" },
  NEUTRAL: { icon: Meh, color: "text-slate-400", bg: "bg-slate-500/20" },
  BAD: { icon: Frown, color: "text-indigo-400", bg: "bg-indigo-500/20" },
  TERRIBLE: { icon: CloudRain, color: "text-rose-400", bg: "bg-rose-500/20" },
};

const EntryItem = ({ entry, isActive, onClick, theme }) => {
  const moodConfig = MOODS[entry.mood] || MOODS.NEUTRAL;
  const MoodIcon = moodConfig.icon;
  const dateStr = new Date(entry.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <button onClick={onClick} className={`w-full text-left p-4 rounded-2xl border transition-all mb-3 group ${isActive ? `bg-white/10 border-white/20 shadow-lg` : `${theme.colors.panel} border-transparent hover:bg-white/5`}`}>
      <div className="flex justify-between items-start mb-2"><span className={`text-xs font-bold ${theme.colors.textDim} uppercase tracking-wider`}>{dateStr}</span><div className={`p-1 rounded-md ${moodConfig.bg} ${moodConfig.color}`}><MoodIcon size={12} /></div></div>
      <h4 className={`font-serif font-bold text-lg truncate transition-colors ${isActive ? "text-white" : `${theme.colors.text}`}`}>{entry.title || "Sans titre"}</h4>
      <p className={`text-sm line-clamp-2 font-serif mt-1 opacity-80 ${theme.colors.textDim}`}>{entry.content}</p>
    </button>
  );
};

export default function JournalCore() {
  const { theme } = useTheme(); // <-- HOOK THÈME
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [currentMood, setCurrentMood] = useState("NEUTRAL");

  const fetchEntries = async () => { try { const { data, error } = await supabase.from('journal_entries').select('*').order('created_at', { ascending: false }); if(error) throw error; setEntries(data); } catch (e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { fetchEntries(); }, []);

  const handleSelect = (entry) => { setSelectedId(entry.id); setTitle(entry.title || ""); setContent(entry.content || ""); setCurrentMood(entry.mood || "NEUTRAL"); };
  const handleNew = () => { setSelectedId(null); setTitle(""); setContent(""); setCurrentMood("NEUTRAL"); };

  const handleSave = async () => {
    if (!content.trim() && !title.trim()) return;
    const entryData = { title, content, mood: currentMood };
    if (selectedId) { setEntries(entries.map(e => e.id === selectedId ? { ...e, ...entryData } : e)); } else { const tempId = Date.now(); setEntries([{ ...entryData, id: tempId, created_at: new Date().toISOString() }, ...entries]); }
    try { if (selectedId) { await supabase.from('journal_entries').update(entryData).eq('id', selectedId); } else { await supabase.from('journal_entries').insert([entryData]); fetchEntries(); } } catch (e) { console.error(e); fetchEntries(); }
    if (!selectedId) handleNew();
  };

  const handleDelete = async () => { if(!selectedId || !window.confirm("Supprimer ?")) return; setEntries(entries.filter(e => e.id !== selectedId)); handleNew(); try { await supabase.from('journal_entries').delete().eq('id', selectedId); } catch (e) { console.error(e); } };

  return (
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div><h2 className={`text-2xl font-bold ${theme.colors.text} flex items-center gap-3`}><div className={`p-2 ${theme.colors.primary} rounded-lg shadow-lg ${theme.colors.glow}`}><PenTool size={20} className="text-white" /></div>Journal Intime</h2><p className={`${theme.colors.textDim} text-sm mt-1`}>Cultivez votre jardin intérieur.</p></div>
        <button onClick={handleNew} className={`px-6 py-3 rounded-full ${theme.colors.primary} ${theme.colors.primaryHover} text-white font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95`}><Plus size={18} /> <span className="hidden md:inline">Nouvelle Entrée</span></button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-200px)]">
        <div className={`lg:w-1/3 flex flex-col ${theme.colors.panel} border ${theme.colors.border} rounded-3xl p-4 backdrop-blur-xl overflow-hidden`}>
           <div className={`flex items-center gap-2 mb-4 px-2 ${theme.colors.textDim}`}><Calendar size={14} /> <span className="text-xs font-bold uppercase tracking-widest">Historique</span></div>
           <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              {loading ? <div className="flex justify-center p-10"><Loader2 className={`animate-spin ${theme.colors.accent}`}/></div> : entries.length > 0 ? entries.map(entry => <EntryItem key={entry.id} entry={entry} isActive={selectedId === entry.id} onClick={() => handleSelect(entry)} theme={theme} />) : <div className={`text-center ${theme.colors.textDim} mt-10 p-4`}>Commencez à écrire.</div>}
           </div>
        </div>

        <div className={`lg:w-2/3 ${theme.colors.panel} border ${theme.colors.border} rounded-3xl p-8 backdrop-blur-xl flex flex-col relative group transition-all`}>
            <div className={`flex items-center justify-between mb-6 pb-6 border-b ${theme.colors.border}`}>
                <div className="flex gap-2">{Object.keys(MOODS).map(m => { const M = MOODS[m]; const isSelected = currentMood === m; return (<button key={m} onClick={() => setCurrentMood(m)} className={`p-2 rounded-xl transition-all ${isSelected ? `bg-white/10 ${M.color} shadow-md scale-110` : `${theme.colors.textDim} hover:bg-white/5`}`}><M.icon size={20} /></button>)})}</div>
                <div className="flex gap-2">{selectedId && <button onClick={handleDelete} className={`p-2 ${theme.colors.textDim} hover:text-rose-500 transition-colors`}><Trash2 size={20} /></button>}<button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-xl transition-all font-bold text-sm border border-emerald-500/20"><Save size={16} /> Enregistrer</button></div>
            </div>
            <div className="flex-1 flex flex-col">
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Titre..." className={`bg-transparent text-3xl md:text-4xl font-serif font-bold ${theme.colors.text} placeholder:${theme.colors.textDim} outline-none mb-6`} />
                <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Qu'avez-vous appris aujourd'hui ?" className={`flex-1 bg-transparent text-lg font-serif ${theme.colors.text} placeholder:${theme.colors.textDim} outline-none resize-none leading-relaxed custom-scrollbar`} />
            </div>
            <div className={`absolute bottom-4 right-8 ${theme.colors.textDim} opacity-10 pointer-events-none`}><Quote size={120} /></div>
        </div>
      </div>
    </div>
  );
}