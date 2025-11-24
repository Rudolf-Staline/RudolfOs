import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  ChevronRight, 
  Zap, 
  History 
} from "lucide-react";
import { supabase } from "./supabaseClient";

// --- CONFIGURATION ---
const MODES = {
  FOCUS: { min: 25, label: "Deep Work", color: "text-indigo-400", bg: "bg-indigo-500", glow: "shadow-[0_0_40px_rgba(99,102,241,0.3)]", stroke: "#6366f1" },
  SHORT: { min: 5, label: "Pause", color: "text-emerald-400", bg: "bg-emerald-500", glow: "shadow-[0_0_40px_rgba(52,211,153,0.3)]", stroke: "#34d399" },
  LONG: { min: 15, label: "Reset", color: "text-blue-400", bg: "bg-blue-500", glow: "shadow-[0_0_40px_rgba(96,165,250,0.3)]", stroke: "#60a5fa" }
};

export default function FocusCore() {
  // State Timer
  const [mode, setMode] = useState("FOCUS");
  const [timeLeft, setTimeLeft] = useState(MODES.FOCUS.min * 60);
  const [isActive, setIsActive] = useState(false);
  const [task, setTask] = useState("");

  // State Data
  const [todayStats, setTodayStats] = useState({ count: 0, minutes: 0 });

  const audioRef = useRef(null);

  // --- INIT AUDIO & DATA ---
  useEffect(() => {
    audioRef.current = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
    fetchTodayStats();
  }, []);

  // --- SUPABASE LOGIC ---
  const fetchTodayStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('duration')
        .gte('created_at', `${today}T00:00:00`)
        .eq('mode', 'FOCUS'); // On ne compte que le vrai travail

      if (error) throw error;

      const minutes = data.reduce((acc, curr) => acc + (curr.duration || 0), 0);
      setTodayStats({ count: data.length, minutes });

    } catch (e) {
      console.error("Error fetching stats:", e);
    }
  };

  const saveSession = async () => {
    try {
      const duration = MODES[mode].min;
      const { error } = await supabase.from('focus_sessions').insert([{
        duration: duration,
        mode: mode,
        task: task || "Session libre"
      }]);
      
      if (error) throw error;
      
      // Update local stats sans re-fetch tout
      if (mode === 'FOCUS') {
          setTodayStats(prev => ({
              count: prev.count + 1,
              minutes: prev.minutes + duration
          }));
      }

    } catch (e) {
      console.error("Save session failed:", e);
    }
  };

  // --- TIMER LOGIC ---
  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0 && isActive) {
      handleComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleComplete = () => {
    setIsActive(false);
    try {
        audioRef.current?.play().catch(() => {});
    } catch(e) {}
    
    // Sauvegarde en base
    saveSession();
    
    // Reset (optionnel : on peut laisser à 0)
    // setTimeLeft(MODES[mode].min * 60); 
  };

  const switchMode = (m) => {
    setMode(m);
    setIsActive(false);
    setTimeLeft(MODES[m].min * 60);
  };

  // --- RENDER HELPERS ---
  const fmt = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const current = MODES[mode];
  const progress = ((current.min * 60 - timeLeft) / (current.min * 60)) * 100;
  
  // SVG Config
  const r = 140;
  const circ = 2 * Math.PI * r;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-4xl mx-auto p-4">
      
      {/* 1. Mode Selector */}
      <div className="flex p-1 bg-slate-900/80 border border-white/10 rounded-full mb-12 backdrop-blur-md relative z-20">
        {Object.keys(MODES).map((k) => (
          <button
            key={k}
            onClick={() => switchMode(k)}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              mode === k 
              ? "bg-slate-800 text-white shadow-lg" 
              : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {MODES[k].label}
          </button>
        ))}
      </div>

      {/* 2. The Glowing Timer */}
      <div className="relative group">
        {/* Lueur d'arrière plan dynamique */}
        <div className={`absolute inset-0 rounded-full blur-[80px] opacity-20 transition-all duration-1000 ${isActive ? "scale-110 opacity-40" : "scale-100"} ${current.bg}`}></div>
        
        <div className="relative z-10">
            <svg className="w-[340px] h-[340px] transform -rotate-90 drop-shadow-2xl">
                {/* Track */}
                <circle cx="170" cy="170" r={r} stroke="#1e293b" strokeWidth="8" fill="transparent" />
                {/* Progress Indicator */}
                <motion.circle 
                    cx="170" cy="170" r={r} 
                    stroke={current.stroke} 
                    strokeWidth="8" 
                    fill="transparent"
                    strokeLinecap="round"
                    className="transition-colors duration-700"
                    initial={{ strokeDashoffset: circ }}
                    animate={{ strokeDashoffset: circ - (progress / 100) * circ }}
                    transition={{ duration: 1, ease: "linear" }}
                    style={{ strokeDasharray: circ }} 
                />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-7xl font-bold tracking-tighter text-white tabular-nums drop-shadow-lg`}>
                    {fmt(timeLeft)}
                </span>
                <span className={`mt-2 text-xs font-bold uppercase tracking-[0.2em] ${isActive ? "text-slate-200 animate-pulse" : "text-slate-600"}`}>
                    {isActive ? "Running" : "Ready"}
                </span>
            </div>
        </div>
      </div>

      {/* 3. Task Input */}
      <div className="mt-12 w-full max-w-md relative group z-20">
        <input 
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Quel est votre objectif principal ?"
            className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 px-6 text-center text-slate-200 placeholder:text-slate-600 focus:outline-none focus:bg-slate-900 focus:border-indigo-500/50 transition-all text-lg"
        />
        <div className={`absolute right-3 top-1/2 -translate-y-1/2 transition-opacity duration-300 ${task ? 'opacity-100' : 'opacity-0'}`}>
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <ChevronRight size={16} />
            </div>
        </div>
      </div>

      {/* 4. Controls */}
      <div className="flex items-center gap-6 mt-10 z-20">
         <button 
            onClick={() => { setIsActive(false); setTimeLeft(current.min * 60); }}
            className="w-14 h-14 rounded-full flex items-center justify-center border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all active:scale-95"
         >
            <RotateCcw size={20} />
         </button>

         <button 
            onClick={() => setIsActive(!isActive)}
            className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-white shadow-2xl transition-all hover:scale-105 active:scale-95 ${isActive ? "bg-slate-800 border border-white/10" : `bg-gradient-to-br from-indigo-500 to-indigo-600 ${current.glow}`}`}
         >
            {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
         </button>
      </div>

      {/* 5. Daily Stats Footer */}
      <div className="mt-12 flex items-center gap-4 px-6 py-3 bg-slate-900/40 border border-white/5 rounded-full backdrop-blur-sm">
        <div className="flex items-center gap-2 text-indigo-400">
            <Zap size={16} fill="currentColor" />
            <span className="text-sm font-bold">{todayStats.minutes} min</span>
        </div>
        <div className="w-[1px] h-4 bg-white/10"></div>
        <div className="flex items-center gap-2 text-slate-400">
            <History size={16} />
            <span className="text-xs font-medium">{todayStats.count} sessions auj.</span>
        </div>
      </div>

    </div>
  );
}