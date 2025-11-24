import React, { createContext, useContext, useState, useEffect } from "react";

// --- DÉFINITION DES THÈMES ---
export const THEMES = {
  COSMIC: {
    id: "COSMIC",
    label: "Cosmos",
    colors: {
      bg: "bg-[#0f172a]", // Slate 900
      sidebar: "bg-slate-950/50",
      panel: "bg-slate-900/50",
      border: "border-white/5",
      text: "text-slate-200",
      textDim: "text-slate-400",
      primary: "bg-indigo-600",
      primaryHover: "hover:bg-indigo-500",
      accent: "text-indigo-400",
      glow: "shadow-indigo-500/20"
    }
  },
  NATURE: {
    id: "NATURE",
    label: "Forêt",
    colors: {
      bg: "bg-[#052e16]", // Green 950
      sidebar: "bg-green-950/50",
      panel: "bg-green-900/40",
      border: "border-emerald-500/10",
      text: "text-emerald-50",
      textDim: "text-emerald-400/70",
      primary: "bg-emerald-600",
      primaryHover: "hover:bg-emerald-500",
      accent: "text-emerald-400",
      glow: "shadow-emerald-500/20"
    }
  },
  OBSIDIAN: {
    id: "OBSIDIAN",
    label: "Obsidienne",
    colors: {
      bg: "bg-[#000000]",
      sidebar: "bg-zinc-950",
      panel: "bg-zinc-900",
      border: "border-zinc-800",
      text: "text-zinc-200",
      textDim: "text-zinc-500",
      primary: "bg-white",
      primaryHover: "hover:bg-zinc-200",
      accent: "text-white",
      glow: "shadow-white/10"
    }
  },
  CYBER: {
    id: "CYBER",
    label: "Cyberpunk",
    colors: {
      bg: "bg-[#1a1a2e]",
      sidebar: "bg-[#16213e]/80",
      panel: "bg-[#0f3460]/50",
      border: "border-pink-500/20",
      text: "text-pink-50",
      textDim: "text-pink-300/60",
      primary: "bg-pink-600",
      primaryHover: "hover:bg-pink-500",
      accent: "text-cyan-400",
      glow: "shadow-pink-500/40"
    }
  }
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [currentThemeId, setCurrentThemeId] = useState(() => {
    return localStorage.getItem("rudolf_theme") || "COSMIC";
  });

  const theme = THEMES[currentThemeId];

  const changeTheme = (id) => {
    setCurrentThemeId(id);
    localStorage.setItem("rudolf_theme", id);
  };

  return (
    <ThemeContext.Provider value={{ theme, changeTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);