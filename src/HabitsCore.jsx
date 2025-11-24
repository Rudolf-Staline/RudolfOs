import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, 
  Check, 
  Plus, 
  Trash2, 
  Flame, 
  CalendarDays,
  Loader2,
  X
} from "lucide-react";
import { supabase } from "./supabaseClient";
import { useTheme } from "./ThemeContext"; // <-- Intégration Thème
import { useNotification } from "./NotificationContext"; // <-- Intégration Notifs

// --- UTILS ---
const getLast7Days = () => {
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d);
  }
  return dates;
};

// --- COMPONENTS ---

const HabitRow = ({ habit, logs, onToggle, onDelete, theme }) => {
  const days = getLast7Days();
  
  // Calcul simple du total (pour la démo)
  const totalDone = logs.length;
  
  // On extrait les dates validées sous forme de string YYYY-MM-DD
  const logDates = logs.map(l => l.date);
  
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`${theme.colors.panel} border ${theme.colors.border} rounded-2xl p-6 backdrop-blur-xl flex flex-col md:flex-row items-center gap-6 group hover:border-white/20 transition-all`}
    >
      {/* Info Habitude */}
      <div className="flex-1 flex items-center gap-4 w-full md:w-auto">
        <div className={`w-12 h-12 rounded-xl ${habit.color} bg-opacity-20 flex items-center justify-center text-white shadow-lg`}>
          <Activity size={20} />
        </div>
        <div className="flex-1">
          <h3 className={`font-bold ${theme.colors.text} text-lg`}>{habit.name}</h3>
          <div className={`flex items-center gap-1 text-xs ${theme.colors.textDim}`}>
             <Flame size={12} className={totalDone > 0 ? "text-orange-500" : "text-slate-600"} />
             <span>{totalDone} jours validés</span>
          </div>
        </div>
      </div>

      {/* La Grille des 7 jours */}
      <div className="flex items-center gap-2 md:gap-3 justify-between w-full md:w-auto">
        {days.map((date, index) => {
          // Formatage YYYY-MM-DD pour comparaison stable
          const offset = date.getTimezoneOffset();
          const localDate = new Date(date.getTime() - (offset*60*1000));
          const dateStr = localDate.toISOString().split('T')[0];

          const isDone = logDates.includes(dateStr);
          const isToday = index === 6;

          return (
            <div key={dateStr} className="flex flex-col items-center gap-2">
              <span className={`text-[10px] font-mono uppercase ${isToday ? `font-bold ${theme.colors.text}` : theme.colors.textDim}`}>
                {date.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 2)}
              </span>
              <button
                onClick={() => onToggle(habit.id, dateStr, isDone)}
                className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isDone 
                  ? `${habit.color} text-white shadow-lg scale-100` 
                  : `bg-black/20 border ${theme.colors.border} ${theme.colors.textDim} hover:bg-white/5`
                }`}
              >
                {isDone && <Check size={18} strokeWidth={3} />}
              </button>
            </div>
          );
        })}
      </div>

      {/* Delete Action */}
      <button 
        onClick={() => onDelete(habit.id)}
        className={`opacity-0 group-hover:opacity-100 p-2 ${theme.colors.textDim} hover:text-rose-500 transition-colors`}
      >
        <Trash2 size={18} />
      </button>
    </motion.div>
  );
};

const NewHabitModal = ({ onClose, onSave, theme }) => {
    const [name, setName] = useState("");
    const [color, setColor] = useState("bg-indigo-500");

    const colors = [
        "bg-indigo-500", "bg-emerald-500", "bg-rose-500", "bg-amber-500", "bg-purple-500", "bg-cyan-500"
    ];

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className={`${theme.colors.bg} border ${theme.colors.border} rounded-3xl p-8 w-full max-w-sm shadow-2xl`}
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-xl font-bold ${theme.colors.text}`}>Nouvelle Habitude</h3>
                    <button onClick={onClose}><X className={`${theme.colors.textDim} hover:text-white`} /></button>
                </div>
                
                <input 
                    autoFocus
                    value={name} onChange={e => setName(e.target.value)}
                    placeholder="Ex: Méditation, Sport..."
                    className={`w-full bg-black/20 border ${theme.colors.border} rounded-xl p-4 ${theme.colors.text} outline-none focus:border-indigo-500 mb-6`}
                />
                
                <div className="grid grid-cols-6 gap-2 mb-8">
                    {colors.map(c => (
                        <button 
                            key={c} 
                            onClick={() => setColor(c)}
                            className={`w-8 h-8 rounded-full ${c} ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'opacity-50 hover:opacity-100'} transition-all`}
                        />
                    ))}
                </div>
                
                <button onClick={() => onSave(name, color)} className={`w-full py-3 rounded-xl ${theme.colors.primary} ${theme.colors.primaryHover} text-white font-bold shadow-lg`}>
                    Créer
                </button>
            </motion.div>
        </div>
    );
};

export default function HabitsCore() {
  const { theme } = useTheme(); // Hook Thème
  const { notify } = useNotification(); // Hook Notif
  
  const [habits, setHabits] = useState([]);
  const [logs, setLogs] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // --- DATA ---
  const fetchData = async () => {
      try {
          // 1. Get Habits
          const { data: habitsData, error: habitsError } = await supabase.from('habits').select('*').order('created_at');
          if (habitsError) throw habitsError;
          setHabits(habitsData);

          // 2. Get Logs
          const { data: logsData, error: logsError } = await supabase.from('habit_logs').select('*');
          if (logsError) throw logsError;
          setLogs(logsData);

      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => { fetchData(); }, []);

  // --- ACTIONS ---
  const handleCreate = async (name, color) => {
      if (!name.trim()) return;
      try {
          const { error } = await supabase.from('habits').insert([{ name, color }]);
          if (error) throw error;
          setIsCreating(false);
          fetchData();
          notify("Nouvelle habitude créée !", "SUCCESS");
      } catch(e) { 
          console.error(e);
          notify("Erreur lors de la création.", "ERROR");
      }
  };

  const handleDelete = async (id) => {
      if(!window.confirm("Arrêter de suivre cette habitude ?")) return;
      
      // Optimistic UI
      setHabits(habits.filter(h => h.id !== id));
      
      try {
          await supabase.from('habits').delete().eq('id', id);
          notify("Habitude supprimée.", "INFO");
      } catch(e) { console.error(e); fetchData(); }
  };

  const handleToggle = async (habitId, dateStr, isDone) => {
      // Optimistic UI
      if (isDone) {
          setLogs(logs.filter(l => !(l.habit_id === habitId && l.date === dateStr)));
          await supabase.from('habit_logs').delete().match({ habit_id: habitId, date: dateStr });
      } else {
          setLogs([...logs, { habit_id: habitId, date: dateStr }]);
          await supabase.from('habit_logs').insert([{ habit_id: habitId, date: dateStr }]);
          notify("Bien joué ! Continue comme ça.", "SUCCESS");
      }
  };

  return (
    <div className="p-4 md:p-8 w-full max-w-6xl mx-auto h-full relative">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div>
           <h2 className={`text-2xl font-bold ${theme.colors.text} flex items-center gap-3`}>
             <div className={`p-2 bg-emerald-500 rounded-lg shadow-lg shadow-emerald-500/30`}><CalendarDays size={20} className="text-white"/></div>
             Routine & Discipline
           </h2>
           <p className={`${theme.colors.textDim} text-sm mt-1`}>La constance est la clé de la maîtrise.</p>
        </div>
        
        <button 
            onClick={() => setIsCreating(true)}
            className={`h-12 w-12 rounded-2xl ${theme.colors.primary} ${theme.colors.primaryHover} text-white flex items-center justify-center shadow-lg transition-all active:scale-95`}
        >
            <Plus size={24} />
        </button>
      </div>

      {/* Grid */}
      <div className="space-y-4 pb-20 overflow-y-auto custom-scrollbar" style={{maxHeight: 'calc(100vh - 200px)'}}>
          {loading ? (
              <div className="flex justify-center py-10"><Loader2 className={`animate-spin ${theme.colors.accent}`}/></div>
          ) : habits.length > 0 ? (
              habits.map(habit => (
                  <HabitRow 
                    key={habit.id} 
                    habit={habit} 
                    logs={logs.filter(l => l.habit_id === habit.id)} 
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    theme={theme}
                  />
              ))
          ) : (
              <div className={`text-center ${theme.colors.textDim} py-10`}>
                  Aucune habitude définie. Créez-en une pour commencer votre routine.
              </div>
          )}
      </div>

      {/* Modal */}
      <AnimatePresence>
          {isCreating && <NewHabitModal onClose={() => setIsCreating(false)} onSave={handleCreate} theme={theme} />}
      </AnimatePresence>

    </div>
  );
}