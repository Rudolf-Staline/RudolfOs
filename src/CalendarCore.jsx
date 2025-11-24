import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Plus, 
  MoreHorizontal,
  CheckCircle2,
  Loader2,
  X,
  Save,
  Trash2
} from "lucide-react";
import { supabase } from "./supabaseClient";

// --- CONFIG ---
const EVENT_TYPES = {
  ACADEMIC: { label: "Cours / Exam", color: "bg-blue-500", text: "text-blue-400", border: "border-blue-500/30" },
  DEEP_WORK: { label: "Focus", color: "bg-indigo-500", text: "text-indigo-400", border: "border-indigo-500/30" },
  SOCIAL: { label: "Perso", color: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500/30" },
  DEADLINE: { label: "Deadline", color: "bg-rose-500", text: "text-rose-400", border: "border-rose-500/30" },
};

// --- HELPERS ---
const daysOfWeek = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

// --- COMPONENTS ---

const EventCard = ({ event, onDelete }) => {
  const style = EVENT_TYPES[event.type] || EVENT_TYPES.ACADEMIC;
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-2xl bg-slate-900/50 border ${style.border} backdrop-blur-md mb-3 group hover:bg-slate-800/50 transition-colors cursor-pointer`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className={`text-[10px] font-bold px-2 py-1 rounded-md bg-slate-950 border border-white/5 ${style.text} uppercase tracking-wide`}>
          {style.label}
        </div>
        <button onClick={() => onDelete(event.id)} className="text-slate-600 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
            <Trash2 size={16}/>
        </button>
      </div>
      <h4 className="text-white font-bold text-sm mb-1">{event.title}</h4>
      <div className="flex items-center gap-4 text-xs text-slate-400">
        {event.time_range && <span className="flex items-center gap-1"><Clock size={12}/> {event.time_range}</span>}
        {event.location && <span className="flex items-center gap-1"><MapPin size={12}/> {event.location}</span>}
      </div>
    </motion.div>
  );
};

const AddEventModal = ({ selectedDate, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        title: "",
        type: "ACADEMIC",
        time_range: "09:00 - 10:00",
        location: ""
    });

    const handleSubmit = () => {
        if(!formData.title) return;
        onSave({ ...formData, date: selectedDate.toISOString() });
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl"
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white">Nouvel Événement</h3>
                    <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold">Titre</label>
                        <input 
                            className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-indigo-500"
                            value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                            placeholder="Ex: Partiel Maths"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold">Type</label>
                            <select 
                                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-slate-300 outline-none"
                                value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}
                            >
                                {Object.keys(EVENT_TYPES).map(k => <option key={k} value={k}>{EVENT_TYPES[k].label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold">Horaire</label>
                            <input 
                                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white outline-none"
                                value={formData.time_range} onChange={e => setFormData({...formData, time_range: e.target.value})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold">Lieu (Optionnel)</label>
                        <input 
                            className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white outline-none"
                            value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}
                            placeholder="Ex: Amphi B"
                        />
                    </div>

                    <button onClick={handleSubmit} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 mt-2">
                        <Save size={18} /> Créer
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default function CalendarCore() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // --- DATA FETCHING ---
  const fetchEvents = async () => {
      try {
          const { data, error } = await supabase.from('events').select('*');
          if (error) throw error;
          // Conversion des strings dates en Objets JS pour faciliter la comparaison
          const processed = data.map(e => ({ ...e, dateObj: new Date(e.date) }));
          setEvents(processed);
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleAddEvent = async (eventData) => {
      try {
          const { error } = await supabase.from('events').insert([eventData]);
          if(error) throw error;
          setIsAdding(false);
          fetchEvents();
      } catch(e) { console.error(e); }
  };

  const handleDeleteEvent = async (id) => {
      if(!window.confirm("Supprimer cet événement ?")) return;
      try {
          await supabase.from('events').delete().eq('id', id);
          setEvents(events.filter(e => e.id !== id));
      } catch(e) { console.error(e); }
  };

  // --- CALENDAR LOGIC ---
  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1; 
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // Filter events for selected day
  const selectedEvents = events.filter(e => 
      e.dateObj.getDate() === selectedDate.getDate() && 
      e.dateObj.getMonth() === selectedDate.getMonth() &&
      e.dateObj.getFullYear() === selectedDate.getFullYear()
  );

  return (
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto h-full min-h-[80vh] flex flex-col relative">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
        <div>
           <h2 className="text-2xl font-bold text-white flex items-center gap-3">
             <div className="p-2 bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/30"><CalendarIcon size={20} /></div>
             Agenda & Planification
           </h2>
        </div>
        
        <div className="flex items-center bg-slate-900/50 p-1 rounded-full border border-white/5 backdrop-blur-md">
            <button onClick={prevMonth} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={20}/></button>
            <span className="px-6 font-mono font-bold text-white w-32 text-center">
                {monthNames[currentDate.getMonth()].substring(0, 3)} {currentDate.getFullYear()}
            </span>
            <button onClick={nextMonth} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"><ChevronRight size={20}/></button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 flex-1">
        
        {/* CALENDAR GRID */}
        <div className="lg:w-2/3 bg-slate-900/30 border border-white/5 rounded-3xl p-6 backdrop-blur-xl flex flex-col">
            <div className="grid grid-cols-7 mb-4">
                {daysOfWeek.map(day => (
                    <div key={day} className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest py-2">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-2 flex-1">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const currentDayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum);
                    
                    const isToday = dayNum === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
                    const isSelected = dayNum === selectedDate.getDate() && currentDate.getMonth() === selectedDate.getMonth();
                    
                    const dayEvents = events.filter(e => 
                        e.dateObj.getDate() === dayNum && 
                        e.dateObj.getMonth() === currentDate.getMonth() &&
                        e.dateObj.getFullYear() === currentDate.getFullYear()
                    );

                    return (
                        <motion.button
                            key={dayNum}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedDate(currentDayDate)}
                            className={`relative rounded-2xl flex flex-col items-center justify-start pt-3 transition-all min-h-[80px] border ${
                                isSelected 
                                ? "bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-500/20 z-10" 
                                : isToday 
                                    ? "bg-slate-800 border-white/20" 
                                    : "bg-slate-900/50 border-white/5 hover:bg-slate-800 hover:border-white/10"
                            }`}
                        >
                            <span className={`text-sm font-bold ${isSelected || isToday ? "text-white" : "text-slate-400"}`}>
                                {dayNum}
                            </span>
                            
                            <div className="flex gap-1 mt-2 flex-wrap justify-center px-2">
                                {dayEvents.slice(0, 4).map((ev, idx) => (
                                    <div key={idx} className={`w-1.5 h-1.5 rounded-full ${EVENT_TYPES[ev.type]?.color || 'bg-white'}`} />
                                ))}
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </div>

        {/* SIDEBAR DETAIL */}
        <div className="lg:w-1/3 flex flex-col">
            <div className="bg-slate-900/30 border border-white/5 rounded-3xl p-6 backdrop-blur-xl h-full flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-white font-bold text-lg capitalize">
                            {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </h3>
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                            {selectedEvents.length} Événement(s)
                        </span>
                    </div>
                    <button onClick={() => setIsAdding(true)} className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 transition-all">
                        <Plus size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loading ? <div className="flex justify-center"><Loader2 className="animate-spin text-indigo-500"/></div> : 
                     selectedEvents.length > 0 ? (
                        selectedEvents.map(ev => <EventCard key={ev.id} event={ev} onDelete={handleDeleteEvent} />)
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4 opacity-60">
                            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                                <CheckCircle2 size={32} />
                            </div>
                            <p className="text-sm">Aucun événement.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

      </div>

      {/* MODAL */}
      <AnimatePresence>
        {isAdding && (
            <AddEventModal 
                selectedDate={selectedDate} 
                onClose={() => setIsAdding(false)} 
                onSave={handleAddEvent} 
            />
        )}
      </AnimatePresence>
    </div>
  );
}