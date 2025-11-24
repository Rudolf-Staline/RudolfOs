import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Plus, Check, X, Disc, Activity, Hash, Coffee, Zap } from "lucide-react";
import { supabase } from "./supabaseClient";
import { cn } from "./utils";

// --- COMPONENTS ---
const Button = ({ children, onClick, active, variant = "default", className }) => {
  const base = "px-4 py-2 font-mono text-xs uppercase tracking-wider transition-all border";
  const styles = {
    default: "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 hover:text-white hover:border-zinc-700",
    primary: "border-white bg-white text-black hover:bg-zinc-200",
    active: "border-indigo-500 bg-indigo-500/10 text-indigo-400",
    danger: "border-red-900/50 text-red-500 hover:bg-red-950/30"
  };
  return (
    <button onClick={onClick} className={cn(base, styles[active ? "active" : variant], className)}>
      {children}
    </button>
  );
};

// --- MAIN ---
export default function FocusOS({ onExit }) {
  // Config
  const MODES = {
    FOCUS: { min: 25, color: "text-white", label: "DEEP WORK" },
    SHORT: { min: 5, color: "text-emerald-400", label: "RECOVERY" },
    LONG: { min: 15, color: "text-blue-400", label: "SYSTEM REST" }
  };

  // State
  const [mode, setMode] = useState("FOCUS");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [task, setTask] = useState("");
  const [inputTask, setInputTask] = useState("");
  
  // Audio
  const audioRef = useRef(new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg"));

  // Tick
  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      audioRef.current.play().catch(() => {});
      // TODO: Save via Supabase here
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  // Reset on mode change
  useEffect(() => {
    setIsActive(false);
    setTimeLeft(MODES[mode].min * 60);
  }, [mode]);

  // Format
  const fmt = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return { m, sec };
  };

  const { m, sec } = fmt(timeLeft);
  const progress = ((MODES[mode].min * 60 - timeLeft) / (MODES[mode].min * 60)) * 100;

  return (
    <div className="fixed inset-0 bg-[#050505] text-zinc-300 font-sans selection:bg-indigo-500/30 flex items-center justify-center p-4">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* CHASSIS PRINCIPAL */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-2xl bg-[#09090b] border border-zinc-800 shadow-2xl flex flex-col md:flex-row overflow-hidden"
      >
        {/* HEADER LINES */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-zinc-800 via-indigo-900 to-zinc-800" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-zinc-900" />

        {/* LEFT PANEL: CONTROLS */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-zinc-800 p-6 flex flex-col justify-between bg-zinc-950/50">
          <div>
            <div className="flex items-center gap-2 mb-8 opacity-50">
              <Activity size={16} />
              <span className="text-xs font-mono uppercase tracking-widest">System Ready</span>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] uppercase text-zinc-600 font-bold mb-2 pl-1">Protocol</p>
              {Object.keys(MODES).map((k) => (
                <button
                  key={k}
                  onClick={() => setMode(k)}
                  className={cn(
                    "w-full text-left px-3 py-3 text-xs font-mono border-l-2 transition-all",
                    mode === k 
                      ? "border-indigo-500 bg-zinc-900 text-white" 
                      : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"
                  )}
                >
                  {k} <span className="float-right opacity-30">{MODES[k].min}m</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 md:mt-0">
             <button onClick={onExit} className="w-full py-3 text-xs font-mono uppercase border border-zinc-800 hover:bg-red-950/20 hover:border-red-900/50 hover:text-red-500 transition-colors flex items-center justify-center gap-2">
                <X size={14} /> Terminate
             </button>
          </div>
        </div>

        {/* RIGHT PANEL: DISPLAY */}
        <div className="flex-1 p-8 flex flex-col relative">
          {/* Status Bar */}
          <div className="flex justify-between items-start mb-12">
            <div>
              <h2 className={cn("text-sm font-bold uppercase tracking-[0.2em] mb-1", MODES[mode].color)}>
                {MODES[mode].label}
              </h2>
              <div className="flex items-center gap-2">
                 <div className={cn("w-2 h-2 rounded-full animate-pulse", isActive ? "bg-red-500" : "bg-zinc-600")} />
                 <span className="text-[10px] font-mono text-zinc-500">{isActive ? "RUNNING" : "IDLE"}</span>
              </div>
            </div>
            <div className="text-right">
               <span className="text-[10px] font-mono text-zinc-600 block">SESSION ID</span>
               <span className="text-xs font-mono text-zinc-400">#{Math.floor(Date.now() / 1000).toString(16).toUpperCase()}</span>
            </div>
          </div>

          {/* THE TIMER (Industrial Big Type) */}
          <div className="flex-1 flex flex-col items-center justify-center py-4 relative group cursor-pointer" onClick={() => setIsActive(!isActive)}>
            {/* Background Rings */}
            <div className="absolute inset-0 border border-zinc-800/50 rounded-full scale-125 opacity-20 border-dashed animate-[spin_60s_linear_infinite]" />
            <div className="absolute inset-0 border border-zinc-800/50 rounded-full scale-[1.1] opacity-20" />
            
            <div className="relative z-10 text-center select-none">
              <div className="flex items-baseline justify-center font-mono font-light tracking-tighter text-white">
                <span className="text-[8rem] leading-none">{m}</span>
                <span className="text-4xl opacity-50 mx-2">:</span>
                <span className="text-[8rem] leading-none text-zinc-400">{sec}</span>
              </div>
            </div>
            
            {/* Progress Bar Line */}
            <div className="w-full h-1 bg-zinc-900 mt-8 relative overflow-hidden">
                <motion.div 
                    className={cn("h-full", mode === 'FOCUS' ? "bg-white" : "bg-emerald-500")} 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: "linear" }}
                />
            </div>
          </div>

          {/* Task Input (Terminal Style) */}
          <div className="mt-12">
            {!task ? (
                <div className="flex items-center border-b border-zinc-800 pb-2">
                    <span className="text-indigo-500 mr-3 font-mono">{">"}</span>
                    <input 
                        value={inputTask}
                        onChange={(e) => setInputTask(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && setTask(inputTask)}
                        placeholder="Initialize objective..."
                        className="bg-transparent w-full outline-none font-mono text-sm text-zinc-300 placeholder:text-zinc-700 uppercase"
                    />
                </div>
            ) : (
                <div className="flex items-center justify-between bg-zinc-900/50 p-3 border-l-2 border-indigo-500">
                    <span className="font-mono text-sm uppercase text-white">{task}</span>
                    <button onClick={() => { setTask(""); setInputTask(""); }} className="text-zinc-600 hover:text-white"><X size={14}/></button>
                </div>
            )}
          </div>

          {/* Action Button */}
          <div className="absolute bottom-8 right-8">
             <button 
                onClick={() => { setIsActive(!isActive); setTimeLeft(MODES[mode].min * 60); }}
                className="w-12 h-12 flex items-center justify-center border border-zinc-700 bg-zinc-900 text-white hover:bg-white hover:text-black hover:scale-105 transition-all"
             >
                <RotateCcw size={16} />
             </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
}