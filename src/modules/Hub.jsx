import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, Wallet, Book, Construction } from "lucide-react";
import { cn } from "../lib/utils"; // Import depuis nos utils

const Hub = ({ onLaunch }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDate = (date) => date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  const APPS = [
    { id: 'FOCUS', label: 'Focus OS', icon: Brain, color: 'bg-violet-600', desc: 'Productivité & Timer' },
    { id: 'FINANCE', label: 'Finance OS', icon: Wallet, color: 'bg-emerald-600', desc: 'Budget & Cashflow' },
    { id: 'JOURNAL', label: 'Journal', icon: Book, color: 'bg-amber-600', desc: 'Réflexion & Foi', locked: true },
    { id: 'PROJECTS', label: 'Projets', icon: Construction, color: 'bg-blue-600', desc: 'Roadmap Ingénieur', locked: true },
  ];

  return (
    <div className="fixed inset-0 bg-[#020204] text-white flex flex-col items-center justify-center overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-indigo-900/20 blur-[120px] animate-[blob_20s_infinite]"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] rounded-full bg-violet-900/20 blur-[120px] animate-[blob_25s_infinite_reverse]"></div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-4xl px-6">
        <motion.div initial={{opacity:0, y:-20}} animate={{opacity:1, y:0}} transition={{duration: 0.8}} className="text-center mb-16">
          <h1 className="text-8xl md:text-9xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 mb-4 select-none">
            {formatTime(time)}
          </h1>
          <p className="text-xl text-white/40 uppercase tracking-[0.3em] font-light mb-8">{formatDate(time)}</p>
          <div className="inline-block px-6 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <p className="text-sm text-white/80 italic">"L'excellence est une habitude, pas un acte."</p>
          </div>
        </motion.div>

        <motion.div initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} transition={{delay: 0.2, duration: 0.5}} className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          {APPS.map((app) => (
            <button 
              key={app.id} 
              onClick={() => !app.locked && onLaunch(app.id)}
              className={cn("group relative flex flex-col items-center justify-center gap-4 p-6 rounded-3xl border transition-all duration-300 overflow-hidden h-48", app.locked ? "bg-white/5 border-white/5 cursor-not-allowed opacity-50 grayscale" : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30 hover:scale-[1.02] hover:shadow-2xl")}
            >
              {!app.locked && <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-br from-white to-transparent")} />}
              <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg text-white mb-2", app.color)}><app.icon size={32} /></div>
              <div className="text-center relative z-10"><h3 className="text-lg font-bold">{app.label}</h3><p className="text-xs text-white/40 mt-1">{app.desc}</p></div>
              {app.locked && <div className="absolute top-3 right-3 text-xs font-bold uppercase tracking-widest text-white/20 border border-white/10 px-2 py-1 rounded">Soon</div>}
            </button>
          ))}
        </motion.div>
      </div>
      <div className="absolute bottom-8 text-[10px] uppercase tracking-[0.2em] text-white/20">Rudolf Hounlete // LifeOS v1.0</div>
    </div>
  );
};

export default Hub;