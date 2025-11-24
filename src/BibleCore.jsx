import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  BookHeart, 
  ChevronRight, 
  ChevronLeft, 
  Search, 
  CheckCircle2,
  Loader2,
  Menu,
  AlertTriangle
} from "lucide-react";
import { supabase } from "./supabaseClient";

// --- CONFIG BOLLS.LIFE API ---
// Mapping des IDs pour l'API Bolls (1 = Genèse, 40 = Matthieu, etc.)
const BIBLE_BOOKS = [
  { id: 1, name: "Genèse", chapters: 50, section: "Ancien Testament" },
  { id: 19, name: "Psaumes", chapters: 150, section: "Ancien Testament" },
  { id: 20, name: "Proverbes", chapters: 31, section: "Ancien Testament" },
  { id: 40, name: "Matthieu", chapters: 28, section: "Nouveau Testament" },
  { id: 41, name: "Marc", chapters: 16, section: "Nouveau Testament" },
  { id: 42, name: "Luc", chapters: 24, section: "Nouveau Testament" },
  { id: 43, name: "Jean", chapters: 21, section: "Nouveau Testament" },
  { id: 45, name: "Romains", chapters: 16, section: "Nouveau Testament" },
  { id: 66, name: "Apocalypse", chapters: 22, section: "Nouveau Testament" },
];

// Mapping des codes de version App -> API Bolls
const VERSION_MAP = {
  'ls1910': 'LSG',   // Louis Segond
  'martin': 'MARTIN', // Bible Martin
  'kjv': 'KJV'       // King James
};

export default function BibleCore({ version = "ls1910" }) {
  const [currentBook, setCurrentBook] = useState(BIBLE_BOOKS[3]); // Matthieu par défaut
  const [chapter, setChapter] = useState(1);
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRead, setIsRead] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // --- DATA FETCHING ---

  useEffect(() => {
    const fetchChapter = async () => {
      setLoading(true);
      setError(null);
      setVerses([]); // Reset immédiat pour éviter d'afficher l'ancien texte
      
      const apiVersion = VERSION_MAP[version] || 'LSG';

      try {
        // 1. Appel API Bolls.life
        const res = await fetch(`https://bolls.life/get-chapter/${apiVersion}/${currentBook.id}/${chapter}/`);
        
        if (!res.ok) throw new Error("Erreur lors du chargement du texte");
        
        const data = await res.json();
        
        // Bolls renvoie un tableau direct d'objets [{ verse: 1, text: "..." }]
        // On nettoie le texte (parfois il y a des balises HTML <br>)
        const cleanedData = data.map(v => ({
            verse: v.verse,
            text: v.text.replace(/<[^>]*>?/gm, '') // Enlève le HTML éventuel
        }));

        setVerses(cleanedData);
        
        // 2. Vérifier progression Supabase
        // On utilise un ID composite string pour stocker en base : "LIVRE_CHAPITRE" (ex: "40_1")
        const { data: progress } = await supabase
            .from('bible_progress')
            .select('*')
            .eq('book_id', currentBook.id.toString())
            .eq('chapter', chapter)
            .single();
            
        setIsRead(!!progress);

      } catch (e) {
        console.error("Bible API Error", e);
        setError("Impossible de charger le texte. Vérifiez votre connexion.");
      } finally {
        setLoading(false);
      }
    };

    fetchChapter();
  }, [currentBook, chapter, version]);

  // --- ACTIONS ---

  const handleMarkRead = async () => {
      if (isRead) return;
      setIsRead(true); // Optimistic
      try {
          const { error } = await supabase.from('bible_progress').insert([{
              book_id: currentBook.id.toString(),
              chapter: chapter
          }]);
          if (error) throw error;
      } catch (e) {
          console.error("Save error", e);
          setIsRead(false);
      }
  };

  const handleNext = () => {
      if (chapter < currentBook.chapters) setChapter(c => c + 1);
  };

  const handlePrev = () => {
      if (chapter > 1) setChapter(c => c - 1);
  };

  return (
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto h-full flex flex-col">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-2 bg-slate-800 rounded-lg text-white">
                <Menu size={20} />
            </button>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-amber-600 rounded-lg shadow-lg shadow-amber-600/20"><BookHeart size={20} /></div>
                Lectio Divina
            </h2>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-full border border-white/5">
            <button onClick={() => setFontSize(Math.max(14, fontSize - 2))} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white text-xs font-serif">A-</button>
            <button onClick={() => setFontSize(Math.min(32, fontSize + 2))} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white text-lg font-serif">A+</button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 h-full min-h-0">
        
        {/* LEFT SIDEBAR: Navigation */}
        {sidebarOpen && (
            <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col gap-6 h-full">
                <div className="flex-1 bg-slate-900/30 border border-white/5 rounded-3xl p-4 backdrop-blur-xl overflow-hidden flex flex-col">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input placeholder="Filtrer..." className="w-full bg-slate-950 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-amber-500/50 outline-none" />
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-1">
                        {BIBLE_BOOKS.map(book => (
                            <button 
                                key={book.id}
                                onClick={() => { setCurrentBook(book); setChapter(1); if(window.innerWidth < 768) setSidebarOpen(false); }}
                                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${currentBook.id === book.id ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
                            >
                                <div className="text-left">
                                    <span className="font-bold text-sm block">{book.name}</span>
                                    <span className="text-[10px] text-slate-600 uppercase">{book.section}</span>
                                </div>
                                {currentBook.id === book.id && <ChevronRight size={16} />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* RIGHT CONTENT: Reader */}
        <div className="flex-1 flex flex-col h-full min-h-0">
            
            {/* Navigation Chapitre */}
            <div className="flex items-center justify-between bg-slate-900/50 border border-white/5 p-4 rounded-t-3xl backdrop-blur-xl">
                <button onClick={handlePrev} disabled={chapter <= 1} className="p-2 hover:bg-white/10 rounded-full disabled:opacity-30 text-white transition-colors">
                    <ChevronLeft />
                </button>
                <div className="text-center">
                    <h3 className="text-white font-serif font-bold text-xl">{currentBook.name}</h3>
                    <span className="text-amber-500 text-xs font-bold uppercase tracking-widest">Chapitre {chapter}</span>
                </div>
                <button onClick={handleNext} disabled={chapter >= currentBook.chapters} className="p-2 hover:bg-white/10 rounded-full disabled:opacity-30 text-white transition-colors">
                    <ChevronRight />
                </button>
            </div>
            
            {/* Texte */}
            <div className="flex-1 bg-slate-900/30 border-x border-b border-white/5 rounded-b-3xl p-8 md:p-12 backdrop-blur-xl overflow-y-auto custom-scrollbar relative scroll-smooth">
                {loading ? (
                    <div className="flex h-full items-center justify-center">
                        <Loader2 className="animate-spin text-amber-500" size={48} />
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full text-rose-400 gap-4">
                        <AlertTriangle size={48} />
                        <p>{error}</p>
                        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-white/5 rounded-lg text-white text-sm">Réessayer</button>
                    </div>
                ) : (
                    <div className="max-w-2xl mx-auto">
                        <div className="space-y-6 mb-16">
                            {verses.map((verse) => (
                                <p 
                                    key={verse.verse} 
                                    className="text-slate-300 leading-relaxed font-serif hover:text-white transition-colors cursor-text selection:bg-amber-500/30"
                                    style={{ fontSize: `${fontSize}px`, lineHeight: '1.8' }}
                                >
                                    <sup className="text-amber-500/60 text-xs mr-2 font-sans font-bold select-none">{verse.verse}</sup>
                                    {verse.text}
                                </p>
                            ))}
                        </div>

                        <div className="flex justify-center pb-10">
                            <button 
                                onClick={handleMarkRead}
                                disabled={isRead}
                                className={`flex items-center gap-3 px-8 py-4 rounded-full transition-all group ${
                                    isRead 
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 cursor-default" 
                                    : "bg-slate-800 hover:bg-amber-600 text-slate-400 hover:text-white shadow-lg"
                                }`}
                            >
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isRead ? 'border-emerald-400' : 'border-slate-500 group-hover:border-white'}`}>
                                    <CheckCircle2 size={14} className={isRead ? "opacity-100" : "opacity-0 group-hover:opacity-100"} />
                                </div>
                                <span className="font-bold text-sm uppercase tracking-wider">
                                    {isRead ? "Chapitre Terminé" : "Marquer comme lu"}
                                </span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}