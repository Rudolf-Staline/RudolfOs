import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Zap, ListTodo, Wallet, BookOpen, Clock, CheckCircle2, Loader2, Quote 
} from "lucide-react";
import { supabase } from "./supabaseClient";
import { useTheme } from "./ThemeContext"; // <-- IMPORT DU THÈME

const KpiCard = ({ label, value, icon: Icon, subtext, color, delay }) => {
  const { theme } = useTheme(); // Récupération des couleurs
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className={`${theme.colors.panel} border ${theme.colors.border} p-6 rounded-3xl backdrop-blur-xl relative overflow-hidden group hover:border-white/20 transition-all`}
    >
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
        <Icon size={64} />
      </div>
      
      <div className="relative z-10">
        <div className={`w-10 h-10 rounded-xl ${color} bg-opacity-20 flex items-center justify-center text-white mb-4`}>
          <Icon size={20} />
        </div>
        <h3 className={`${theme.colors.textDim} text-xs font-bold uppercase tracking-widest mb-1`}>{label}</h3>
        <div className={`text-3xl font-bold ${theme.colors.text} mb-2 font-mono`}>{value}</div>
        <p className={`text-xs ${theme.colors.textDim} font-medium flex items-center gap-1`}>{subtext}</p>
      </div>
    </motion.div>
  );
};

const WelcomeHeader = ({ name }) => {
  const { theme } = useTheme();
  const hour = new Date().getHours();
  let greeting = "Bonjour";
  if (hour >= 18) greeting = "Bonsoir";
  else if (hour >= 22) greeting = "Bonne nuit";

  return (
    <div className="mb-10">
      <h1 className={`text-4xl font-bold ${theme.colors.text} mb-2`}>{greeting}, {name}.</h1>
      <p className={`${theme.colors.textDim} flex items-center gap-2`}>
        <span className={`w-2 h-2 rounded-full ${theme.colors.primary} animate-pulse`}></span>
        Système opérationnel. Prêt pour l'excellence.
      </p>
    </div>
  );
};

export default function DashboardCore({ username = "Rudolf" }) {
  const { theme } = useTheme(); // <-- HOOK
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    focusMinutes: 0, pendingTasks: 0, balance: 0, articlesCount: 0, recentActivity: []
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const todayStr = new Date().toISOString().split('T')[0];

        // 1. Focus
        const { data: focusData } = await supabase.from('focus_sessions').select('duration').gte('created_at', `${todayStr}T00:00:00`).eq('mode', 'FOCUS');
        const focusMinutes = focusData?.reduce((acc, curr) => acc + curr.duration, 0) || 0;

        // 2. Tâches
        const { count: tasksCount } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('completed', false);

        // 3. Finance
        const { data: transactions } = await supabase.from('transactions').select('amount, type');
        const balance = transactions?.reduce((acc, t) => t.type === 'INCOME' ? acc + t.amount : acc - t.amount, 0) || 0;

        // 4. Articles
        const { count: articlesCount } = await supabase.from('knowledge_articles').select('*', { count: 'exact', head: true });

        // 5. Activité récente
        const { data: recentTasks } = await supabase.from('tasks').select('text, created_at').eq('completed', true).order('created_at', { ascending: false }).limit(3);

        setStats({ focusMinutes, pendingTasks: tasksCount || 0, balance, articlesCount: articlesCount || 0, recentActivity: recentTasks || [] });
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    fetchStats();
  }, []);

  if (loading) return <div className="h-full w-full flex items-center justify-center"><Loader2 className={`animate-spin ${theme.colors.accent}`} size={48} /></div>;

  const hours = Math.floor(stats.focusMinutes / 60);
  const mins = stats.focusMinutes % 60;
  const focusTimeStr = `${hours}h ${mins.toString().padStart(2, '0')}`;

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto custom-scrollbar">
      <WelcomeHeader name={username} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard label="Deep Work" value={focusTimeStr} icon={Zap} subtext="Auj." color="text-indigo-400 bg-indigo-500" delay={0.1} />
        <KpiCard label="Tâches" value={stats.pendingTasks} icon={ListTodo} subtext="En attente" color="text-rose-400 bg-rose-500" delay={0.2} />
        <KpiCard label="Trésorerie" value={`${stats.balance.toFixed(2)}`} icon={Wallet} subtext="Solde" color="text-emerald-400 bg-emerald-500" delay={0.3} />
        <KpiCard label="Savoir" value={stats.articlesCount} icon={BookOpen} subtext="Notes" color="text-amber-400 bg-amber-500" delay={0.4} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className={`lg:col-span-2 bg-gradient-to-br ${theme.colors.panel.replace('bg-', 'from-').replace('/50','/80')} to-black/50 border ${theme.colors.border} p-8 rounded-3xl backdrop-blur-xl flex items-center relative overflow-hidden`}
          >
              <div className={`absolute top-0 right-0 ${theme.colors.textDim} opacity-10 transform rotate-12 translate-x-10 -translate-y-10`}><Quote size={180} /></div>
              <div className="relative z-10 max-w-xl">
                  <h3 className={`text-xl md:text-2xl font-serif ${theme.colors.text} leading-relaxed italic mb-4`}>
                      "La sagesse est la chose principale; acquiers donc la sagesse, et avec tout ce que tu possèdes acquiers l'intelligence."
                  </h3>
                  <p className={`${theme.colors.accent} font-bold text-sm uppercase tracking-widest`}>— Proverbes 4:7</p>
              </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className={`${theme.colors.panel} border ${theme.colors.border} p-6 rounded-3xl backdrop-blur-xl`}
          >
              <h3 className={`text-xs font-bold ${theme.colors.textDim} uppercase tracking-widest mb-6 flex items-center gap-2`}>
                  <Clock size={14} /> Dernières Victoires
              </h3>
              <div className="space-y-4">
                  {stats.recentActivity.length > 0 ? (
                      stats.recentActivity.map((task, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                              <div className="mt-1 text-emerald-500"><CheckCircle2 size={16} /></div>
                              <div>
                                  <p className={`text-sm ${theme.colors.text} line-through opacity-70`}>{task.text}</p>
                                  <p className={`text-[10px] ${theme.colors.textDim}`}>Complété récemment</p>
                              </div>
                          </div>
                      ))
                  ) : (
                      <p className={`text-sm italic ${theme.colors.textDim}`}>Aucune tâche terminée récemment.</p>
                  )}
              </div>
          </motion.div>
      </div>
    </div>
  );
}