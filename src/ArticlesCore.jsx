import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Plus, Search, Tag, Clock, Save, Edit3, ChevronLeft, Loader2, Trash2 } from "lucide-react";
import { supabase } from "./supabaseClient";
import { useTheme } from "./ThemeContext"; // <-- Theme

const COLORS = { "Philo": "bg-purple-500/10 text-purple-400 border-purple-500/20", "Dev": "bg-blue-500/10 text-blue-400 border-blue-500/20", "Japon": "bg-rose-500/10 text-rose-400 border-rose-500/20", "default": "bg-white/5 text-slate-400 border-white/10" };

const ArticleCard = ({ article, onClick, theme }) => (
  <motion.div layoutId={`card-${article.id}`} onClick={onClick} className={`group ${theme.colors.panel} border ${theme.colors.border} hover:border-white/20 rounded-3xl p-6 cursor-pointer backdrop-blur-xl transition-all duration-300 flex flex-col h-64`}>
    <div className="flex justify-between items-start mb-4"><div className="flex gap-2 flex-wrap">{article.tags && article.tags.map(tag => (<span key={tag} className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md border ${COLORS[tag] || COLORS.default}`}>{tag}</span>))}</div></div>
    <h3 className={`text-xl font-bold ${theme.colors.text} mb-2 line-clamp-2 group-hover:${theme.colors.accent} transition-colors`}>{article.title || "Sans titre"}</h3>
    <p className={`${theme.colors.textDim} text-sm line-clamp-3 mb-auto leading-relaxed font-serif`}>{article.content}</p>
    <div className={`flex items-center gap-2 ${theme.colors.textDim} text-xs mt-4 pt-4 border-t ${theme.colors.border}`}><Clock size={12} /><span>{new Date(article.created_at).toLocaleDateString()}</span></div>
  </motion.div>
);

const Editor = ({ article, onClose, onSave, onDelete, theme }) => {
  const [title, setTitle] = useState(article?.title || "");
  const [content, setContent] = useState(article?.content || "");
  const [tagsStr, setTagsStr] = useState(article?.tags ? article.tags.join(", ") : "");

  const handleSave = () => { const tagsArray = tagsStr.split(',').map(t => t.trim()).filter(t => t !== ""); onSave({ ...article, title, content, tags: tagsArray }); };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className={`absolute inset-0 ${theme.colors.bg} z-50 flex flex-col`}>
      <div className={`h-20 border-b ${theme.colors.border} flex items-center justify-between px-8 ${theme.colors.panel} backdrop-blur-md`}>
        <div className="flex items-center gap-4"><button onClick={onClose} className={`p-2 hover:bg-white/5 rounded-full ${theme.colors.textDim} hover:text-white transition-colors`}><ChevronLeft size={24} /></button><span className={`text-sm font-bold ${theme.colors.textDim} uppercase tracking-widest`}>{article?.id ? "Édition" : "Nouvelle Note"}</span></div>
        <div className="flex items-center gap-3">{article?.id && <button onClick={() => onDelete(article.id)} className={`p-2 ${theme.colors.textDim} hover:text-rose-500 transition-colors`}><Trash2 size={20} /></button>}<button onClick={handleSave} className={`px-6 py-2 rounded-xl ${theme.colors.primary} ${theme.colors.primaryHover} text-white font-bold text-sm shadow-lg transition-all flex items-center gap-2`}><Save size={16} /> Sauvegarder</button></div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-3xl mx-auto py-12 px-6">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre..." className={`w-full bg-transparent text-4xl md:text-5xl font-bold ${theme.colors.text} placeholder:${theme.colors.textDim} outline-none mb-8`} />
          <div className={`flex items-center gap-2 mb-12 ${theme.colors.panel} p-2 rounded-xl border ${theme.colors.border} w-full`}><Tag size={16} className={`${theme.colors.textDim} ml-2`} /><input value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} placeholder="Tags (ex: Philo, Code)..." className={`bg-transparent text-sm ${theme.colors.textDim} w-full outline-none`} /></div>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Écrivez ici..." className={`w-full h-[60vh] bg-transparent text-lg ${theme.colors.text} placeholder:${theme.colors.textDim} outline-none resize-none leading-relaxed font-serif`} />
        </div>
      </div>
    </motion.div>
  );
};

export default function ArticlesCore() {
  const { theme } = useTheme();
  const [view, setView] = useState("GRID");
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchArticles = async () => { try { const { data, error } = await supabase.from('knowledge_articles').select('*').order('created_at', { ascending: false }); if(error) throw error; setArticles(data); } catch(e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { fetchArticles(); }, []);
  const handleSave = async (articleData) => { try { const { error } = await supabase.from('knowledge_articles').upsert([articleData]); if (error) throw error; fetchArticles(); setView("GRID"); } catch (e) { console.error(e); } };
  const handleDelete = async (id) => { if(!window.confirm("Supprimer ?")) return; try { await supabase.from('knowledge_articles').delete().eq('id', id); fetchArticles(); setView("GRID"); } catch (e) { console.error(e); } };
  const filtered = articles.filter(a => (a.title?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || (a.tags || []).some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));

  return (
    <div className="relative h-full w-full">
      <AnimatePresence mode="wait">
        {view === "GRID" && (
          <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
              <div><h2 className={`text-3xl font-bold ${theme.colors.text} mb-2 flex items-center gap-3`}><div className="p-2 bg-pink-500 rounded-xl shadow-lg shadow-pink-500/20"><BookOpen size={24} className="text-white"/></div>Base de Connaissance</h2></div>
              <div className="flex gap-4 w-full md:w-auto"><div className="relative group flex-1 md:w-64"><Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.colors.textDim}`} size={18} /><input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Rechercher..." className={`w-full ${theme.colors.panel} border ${theme.colors.border} rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-pink-500/50 transition-all ${theme.colors.text}`} /></div><button onClick={() => { setSelectedArticle(null); setView("EDIT"); }} className={`h-12 w-12 rounded-2xl ${theme.colors.primary} ${theme.colors.primaryHover} text-white flex items-center justify-center shadow-lg transition-all active:scale-95`}><Plus size={24} /></button></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
              {loading ? <div className="col-span-full flex justify-center"><Loader2 className={`animate-spin ${theme.colors.accent}`}/></div> : filtered.map(article => <ArticleCard key={article.id} article={article} onClick={() => { setSelectedArticle(article); setView("EDIT"); }} theme={theme} />)}
              {!loading && <button onClick={() => { setSelectedArticle(null); setView("EDIT"); }} className={`group border-2 border-dashed ${theme.colors.border} hover:border-indigo-500/30 rounded-3xl p-6 flex flex-col items-center justify-center h-64 ${theme.colors.textDim} hover:${theme.colors.accent} transition-all`}><div className="w-16 h-16 rounded-full bg-white/5 group-hover:bg-indigo-500/10 flex items-center justify-center mb-4 transition-colors"><Edit3 size={24} /></div><span className="font-bold text-sm">Nouvelle Note</span></button>}
            </div>
          </motion.div>
        )}
        {view === "EDIT" && <Editor article={selectedArticle} onClose={() => setView("GRID")} onSave={handleSave} onDelete={handleDelete} theme={theme} />}
      </AnimatePresence>
    </div>
  );
}