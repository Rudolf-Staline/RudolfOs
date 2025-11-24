import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ListTodo, Plus, CheckCircle2, Circle, Trash2, Filter, Trophy, Loader2
} from "lucide-react";
import { supabase } from "./supabaseClient";
import { useNotification } from "./NotificationContext";
import { useTheme } from "./ThemeContext"; // <-- IMPORT

const PRIORITIES = {
  HIGH: { label: "Urgent", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
  MEDIUM: { label: "Normal", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  LOW: { label: "Faible", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
};

const TaskItem = ({ task, onToggle, onDelete, theme }) => {
    const priorityStyle = PRIORITIES[task.priority] || PRIORITIES.MEDIUM;
    return (
      <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} 
        className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${task.completed ? `${theme.colors.panel} ${theme.colors.border} opacity-50` : `${theme.colors.panel} ${theme.colors.border} hover:border-white/20 backdrop-blur-xl`}`}
      >
        <button onClick={() => onToggle(task.id, task.completed)} className={`flex-shrink-0 transition-colors ${task.completed ? "text-emerald-500" : `${theme.colors.textDim} hover:${theme.colors.accent}`}`}>{task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}</button>
        <div className="flex-1"><p className={`font-medium text-sm transition-all ${task.completed ? `${theme.colors.textDim} line-through` : theme.colors.text}`}>{task.text}</p><div className="flex items-center gap-3 mt-1"><span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold tracking-wider ${priorityStyle.color} ${priorityStyle.bg} ${priorityStyle.border}`}>{priorityStyle.label}</span><span className={`text-[10px] ${theme.colors.textDim} uppercase tracking-wider`}>{task.tag || "Général"}</span></div></div>
        <button onClick={() => onDelete(task.id)} className={`opacity-0 group-hover:opacity-100 p-2 ${theme.colors.textDim} hover:text-rose-500 transition-all`}><Trash2 size={18} /></button>
      </motion.div>
    );
};

const ProgressBar = ({ total, completed, theme }) => {
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    const radius = 30; const circumference = 2 * Math.PI * radius;
    return (
        <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90"><circle cx="40" cy="40" r={radius} className="stroke-white/10" strokeWidth="6" fill="transparent" /><motion.circle cx="40" cy="40" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" strokeLinecap="round" className={theme.colors.accent} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: circumference - (percentage / 100) * circumference }} transition={{ duration: 1 }} style={{ strokeDasharray: circumference }}/></svg>
            <span className={`absolute text-xs font-bold ${theme.colors.text}`}>{percentage}%</span>
        </div>
    );
};

export default function TasksCore() {
  const { theme } = useTheme(); // <-- HOOK THÈME
  const { notify } = useNotification();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("ALL"); 
  const [newTask, setNewTask] = useState("");
  const [newPriority, setNewPriority] = useState("MEDIUM");

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setTasks(data);
    } catch (error) { console.error("Error fetching tasks:", error); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleAdd = async () => {
    if (!newTask.trim()) return;
    const tempId = Date.now();
    const newTaskObj = { text: newTask, priority: newPriority, completed: false, tag: "Général" };
    setTasks([ { ...newTaskObj, id: tempId }, ...tasks ]);
    setNewTask("");

    try {
        const { data, error } = await supabase.from('tasks').insert([newTaskObj]).select();
        if (error) throw error;
        setTasks(prev => prev.map(t => t.id === tempId ? data[0] : t));
        notify("Tâche ajoutée au planning !", "SUCCESS");
    } catch (error) {
        console.error("Error adding task:", error);
        fetchTasks(); 
        notify("Erreur lors de l'ajout.", "ERROR");
    }
  };

  const handleToggle = async (id, currentStatus) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !currentStatus } : t));
    try {
        const { error } = await supabase.from('tasks').update({ completed: !currentStatus }).eq('id', id);
        if (error) throw error;
        if (!currentStatus) notify("Tâche terminée. Bravo !", "SUCCESS");
    } catch (error) { fetchTasks(); }
  };

  const handleDelete = async (id) => {
    setTasks(tasks.filter(t => t.id !== id));
    try {
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) throw error;
    } catch (error) { fetchTasks(); }
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const filteredTasks = tasks.filter(t => {
      if (filter === "ACTIVE") return !t.completed;
      if (filter === "COMPLETED") return t.completed;
      return true;
  });

  return (
    <div className="p-4 md:p-8 w-full max-w-5xl mx-auto h-full flex flex-col">
      <div className={`flex flex-col md:flex-row justify-between items-center mb-8 gap-6 ${theme.colors.panel} border ${theme.colors.border} p-6 rounded-3xl backdrop-blur-xl`}>
         <div className="flex items-center gap-6"><ProgressBar theme={theme} total={totalCount} completed={completedCount} /><div><h2 className={`text-2xl font-bold ${theme.colors.text} flex items-center gap-2`}>Mes Tâches <ListTodo className={theme.colors.accent} size={24} /></h2><p className={`${theme.colors.textDim} text-sm`}>{completedCount} terminées sur {totalCount} tâches.</p></div></div>
         {completedCount === totalCount && totalCount > 0 && <div className="flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20 text-emerald-400 text-sm font-bold animate-pulse"><Trophy size={16} /> Objectifs atteints !</div>}
      </div>

      <div className="flex flex-col lg:flex-row gap-8 h-full min-h-0">
          <div className="lg:w-1/3 space-y-6">
              <div className={`${theme.colors.panel} border ${theme.colors.border} rounded-3xl p-6 backdrop-blur-xl`}>
                  <h3 className={`text-xs font-bold ${theme.colors.textDim} uppercase tracking-widest mb-4`}>Nouvelle Tâche</h3>
                  <div className="space-y-4">
                      <input value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} placeholder="Que faut-il faire ?" className={`w-full bg-black/20 border ${theme.colors.border} rounded-xl p-4 ${theme.colors.text} outline-none focus:border-indigo-500/50 transition-all placeholder:${theme.colors.textDim}`} />
                      <div className="flex gap-2">
                          {Object.keys(PRIORITIES).map(p => (
                              <button key={p} onClick={() => setNewPriority(p)} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg border transition-all ${newPriority === p ? `${PRIORITIES[p].bg} ${PRIORITIES[p].text} ${PRIORITIES[p].border} text-white` : `border-white/5 ${theme.colors.textDim} hover:bg-white/5`}`}>{PRIORITIES[p].label}</button>
                          ))}
                      </div>
                      <button onClick={handleAdd} disabled={!newTask} className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${newTask ? `${theme.colors.primary} ${theme.colors.primaryHover} text-white shadow-lg` : `${theme.colors.border} ${theme.colors.textDim} cursor-not-allowed`}`}><Plus size={18} /> Ajouter</button>
                  </div>
              </div>
              <div className={`${theme.colors.panel} border ${theme.colors.border} rounded-3xl p-2 backdrop-blur-xl flex flex-col gap-1`}>
                  {["ALL", "ACTIVE", "COMPLETED"].map(f => (
                      <button key={f} onClick={() => setFilter(f)} className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-between ${filter === f ? "bg-white/10 text-white" : `${theme.colors.textDim} hover:${theme.colors.text} hover:bg-white/5`}`}><span>{f === "ALL" ? "Toutes" : f === "ACTIVE" ? "En cours" : "Terminées"}</span>{f === "ACTIVE" && <span className={`${theme.colors.primary} text-white px-2 py-0.5 rounded-md text-[10px]`}>{totalCount - completedCount}</span>}</button>
                  ))}
              </div>
          </div>

          <div className={`lg:w-2/3 ${theme.colors.panel} border ${theme.colors.border} rounded-3xl p-6 backdrop-blur-xl overflow-hidden flex flex-col min-h-[500px]`}>
              <div className="flex items-center justify-between mb-6"><h3 className={`text-xs font-bold ${theme.colors.textDim} uppercase tracking-widest`}>Liste des tâches</h3><button className={`${theme.colors.textDim} hover:${theme.colors.text} transition-colors`}><Filter size={16}/></button></div>
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                  {isLoading ? <div className="flex items-center justify-center h-full"><Loader2 className={`animate-spin ${theme.colors.accent}`} size={32} /></div> : (
                    <AnimatePresence mode="popLayout">
                        {filteredTasks.length > 0 ? filteredTasks.map(task => <TaskItem key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} theme={theme} />) : (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`h-full flex flex-col items-center justify-center ${theme.colors.textDim} opacity-60`}><ListTodo size={48} className="mb-4" /><p>Aucune tâche trouvée.</p></motion.div>
                        )}
                    </AnimatePresence>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
}