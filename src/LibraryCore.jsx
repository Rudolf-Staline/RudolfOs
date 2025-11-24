import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Book, Plus, Star, Check, BookOpen, Loader2, Trash2, Search } from "lucide-react";
import { supabase } from "./supabaseClient";
import { useTheme } from "./ThemeContext"; // <-- Intégration du thème

const STATUS_LABELS = {
    'WISH': 'À lire',
    'READING': 'Lecture en cours',
    'FINISHED': 'Terminé'
};

const BookCard = ({ book, onUpdateStatus, onDelete, theme }) => (
    <div className={`group ${theme.colors.panel} border ${theme.colors.border} hover:border-white/20 p-4 rounded-2xl backdrop-blur-xl flex gap-4 relative overflow-hidden transition-all`}>
        <div className={`w-20 h-28 rounded-lg shadow-lg flex-shrink-0 ${book.cover_color} flex items-center justify-center text-white/20`}>
            <Book size={32} />
        </div>
        <div className="flex-1 flex flex-col justify-center z-10">
            <h3 className={`font-bold ${theme.colors.text} text-lg leading-tight mb-1 line-clamp-2`}>{book.title}</h3>
            <p className={`text-sm ${theme.colors.textDim} mb-3`}>{book.author}</p>
            
            <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${book.status === 'READING' ? `bg-indigo-500/20 text-indigo-300 border-indigo-500/30` : `bg-white/5 ${theme.colors.textDim} border-white/10`}`}>
                    {STATUS_LABELS[book.status]}
                </span>
                {book.status === 'FINISHED' && (
                    <div className="flex text-amber-400 text-xs">
                        {Array.from({length: book.rating || 5}).map((_, i) => <Star key={i} size={10} fill="currentColor"/>)}
                    </div>
                )}
            </div>
        </div>

        {/* Actions Overlay */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
            <button onClick={() => onDelete(book.id)} className="p-2 bg-black/50 rounded-full text-rose-500 hover:bg-rose-500 hover:text-white transition-colors"><Trash2 size={14}/></button>
            {book.status !== 'FINISHED' && (
                <button onClick={() => onUpdateStatus(book.id, 'FINISHED')} className="p-2 bg-black/50 rounded-full text-emerald-500 hover:bg-emerald-500 hover:text-white transition-colors"><Check size={14}/></button>
            )}
            {book.status === 'WISH' && (
                <button onClick={() => onUpdateStatus(book.id, 'READING')} className="p-2 bg-black/50 rounded-full text-indigo-500 hover:bg-indigo-500 hover:text-white transition-colors"><BookOpen size={14}/></button>
            )}
        </div>
    </div>
);

export default function LibraryCore() {
    const { theme } = useTheme(); // <-- Hook Thème
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newBook, setNewBook] = useState({ title: "", author: "" });

    const fetchBooks = async () => {
        try {
            const { data } = await supabase.from('library_books').select('*').order('created_at', { ascending: false });
            setBooks(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBooks(); }, []);

    const handleAdd = async () => {
        if(!newBook.title) return;
        const colors = ["bg-blue-900", "bg-red-900", "bg-green-900", "bg-amber-900", "bg-purple-900", "bg-slate-800"];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        await supabase.from('library_books').insert([{ ...newBook, cover_color: randomColor }]);
        setIsAdding(false);
        setNewBook({ title: "", author: "" });
        fetchBooks();
    };

    const handleUpdate = async (id, status) => {
        await supabase.from('library_books').update({ status, rating: status === 'FINISHED' ? 5 : 0 }).eq('id', id);
        fetchBooks();
    };

    const handleDelete = async (id) => {
        if(!window.confirm("Supprimer ce livre ?")) return;
        await supabase.from('library_books').delete().eq('id', id);
        fetchBooks();
    };

    return (
        <div className="p-4 md:p-8 w-full max-w-7xl mx-auto h-full flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-center mb-8">
                <h2 className={`text-2xl font-bold ${theme.colors.text} flex items-center gap-3`}>
                    <div className={`p-2 bg-amber-700 rounded-lg shadow-lg`}><Book size={20} className="text-white" /></div> Bibliothèque
                </h2>
                <button onClick={() => setIsAdding(!isAdding)} className={`w-10 h-10 ${theme.colors.primary} rounded-xl flex items-center justify-center text-white hover:opacity-90 transition-opacity shadow-lg`}>
                    <Plus size={20}/>
                </button>
            </div>

            <AnimatePresence>
                {isAdding && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className={`${theme.colors.panel} p-4 rounded-2xl border ${theme.colors.border} mb-8 flex flex-col md:flex-row gap-4 overflow-hidden`}
                    >
                        <input 
                            value={newBook.title} onChange={e => setNewBook({...newBook, title: e.target.value})} 
                            placeholder="Titre du livre" 
                            className={`flex-1 bg-black/20 border ${theme.colors.border} rounded-xl p-3 ${theme.colors.text} outline-none focus:border-indigo-500 transition-colors`}
                        />
                        <input 
                            value={newBook.author} onChange={e => setNewBook({...newBook, author: e.target.value})} 
                            placeholder="Auteur" 
                            className={`md:w-64 bg-black/20 border ${theme.colors.border} rounded-xl p-3 ${theme.colors.text} outline-none focus:border-indigo-500 transition-colors`}
                        />
                        <button onClick={handleAdd} className={`bg-white text-black font-bold px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors`}>Ajouter</button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pb-20 flex-1">
                {loading ? (
                    <div className="col-span-full flex justify-center"><Loader2 className={`animate-spin ${theme.colors.accent}`}/></div>
                ) : books.length > 0 ? (
                    books.map(b => <BookCard key={b.id} book={b} onUpdateStatus={handleUpdate} onDelete={handleDelete} theme={theme} />)
                ) : (
                    <div className={`col-span-full text-center ${theme.colors.textDim} py-20`}>Votre bibliothèque est vide. Ajoutez un livre.</div>
                )}
            </div>
        </div>
    );
}