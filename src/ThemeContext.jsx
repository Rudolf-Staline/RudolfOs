import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

/* PALETTE DE THÈMES - RUDOLF OS
   Chaque thème respecte la structure stricte pour éviter les crashs UI.
*/
const themes = {
  // 1. COSMIC (Défaut : Indigo/Slate - Futuriste & Propre)
  cosmic: {
    colors: {
      bg: "bg-[#0f172a]",
      sidebar: "bg-[#1e293b]/50",
      panel: "bg-[#1e293b]/80",
      border: "border-white/10",
      text: "text-slate-200",
      textDim: "text-slate-400",
      primary: "bg-indigo-600",
      primaryHover: "hover:bg-indigo-500",
      accent: "text-indigo-400",
      glow: "shadow-[0_0_20px_rgba(99,102,241,0.5)]",
    },
  },

  // 2. NATURE (Emerald/Forest - Calme & Sérénité)
  nature: {
    colors: {
      bg: "bg-[#022c22]", // Green 950+
      sidebar: "bg-[#064e3b]/50",
      panel: "bg-[#065f46]/80",
      border: "border-emerald-500/20",
      text: "text-emerald-50",
      textDim: "text-emerald-400",
      primary: "bg-emerald-600",
      primaryHover: "hover:bg-emerald-500",
      accent: "text-emerald-300",
      glow: "shadow-[0_0_20px_rgba(16,185,129,0.4)]",
    },
  },

  // 3. SUNSET (Rose/Prune - Créativité & Passion)
  sunset: {
    colors: {
      bg: "bg-[#4a044e]", // Fuchsia 950
      sidebar: "bg-[#701a75]/40",
      panel: "bg-[#86198f]/60",
      border: "border-pink-500/20",
      text: "text-pink-100",
      textDim: "text-pink-300",
      primary: "bg-pink-600",
      primaryHover: "hover:bg-pink-500",
      accent: "text-orange-300",
      glow: "shadow-[0_0_20px_rgba(236,72,153,0.5)]",
    },
  },

  // 4. OCEAN (Cyan/Sky - Focus Profond & Eau)
  ocean: {
    colors: {
      bg: "bg-[#0c4a6e]", // Sky 950
      sidebar: "bg-[#0369a1]/40",
      panel: "bg-[#075985]/70",
      border: "border-cyan-400/20",
      text: "text-cyan-50",
      textDim: "text-sky-300",
      primary: "bg-cyan-600",
      primaryHover: "hover:bg-cyan-500",
      accent: "text-cyan-300",
      glow: "shadow-[0_0_20px_rgba(34,211,238,0.4)]",
    },
  },

  // 5. MONOCHROME (Noir/Blanc - Minimalisme Absolu)
  monochrome: {
    colors: {
      bg: "bg-[#000000]",
      sidebar: "bg-[#171717]/60",
      panel: "bg-[#262626]/90",
      border: "border-white/20",
      text: "text-neutral-200",
      textDim: "text-neutral-500",
      primary: "bg-neutral-100", // Bouton Blanc
      primaryHover: "hover:bg-neutral-300",
      accent: "text-white",
      glow: "shadow-[0_0_15px_rgba(255,255,255,0.3)]",
    },
  },

  // 6. DRACULA (Violet/Dark Gray - Coding Classique)
  dracula: {
    colors: {
      bg: "bg-[#282a36]", // Dracula BG classique
      sidebar: "bg-[#44475a]/60",
      panel: "bg-[#44475a]/90",
      border: "border-purple-400/20",
      text: "text-[#f8f8f2]",
      textDim: "text-[#6272a4]",
      primary: "bg-[#bd93f9]", // Dracula Purple
      primaryHover: "hover:bg-[#ff79c6]", // Dracula Pink Hover
      accent: "text-[#50fa7b]", // Dracula Green
      glow: "shadow-[0_0_20px_rgba(189,147,249,0.4)]",
    },
  },

  // 7. CYBERPUNK (Jaune/Zinc - High Energy & Warning)
  cyberpunk: {
    colors: {
      bg: "bg-[#18181b]", // Zinc 950
      sidebar: "bg-[#27272a]/60",
      panel: "bg-[#3f3f46]/80",
      border: "border-yellow-500/30",
      text: "text-yellow-50",
      textDim: "text-zinc-400",
      primary: "bg-yellow-500", // Jaune électrique
      primaryHover: "hover:bg-yellow-400",
      accent: "text-yellow-400",
      glow: "shadow-[0_0_20px_rgba(234,179,8,0.6)]",
    },
  },

  // 8. COFFEE (Marron/Ambre - Chaleur & Lecture)
  coffee: {
    colors: {
      bg: "bg-[#292524]", // Stone 900
      sidebar: "bg-[#44403c]/50",
      panel: "bg-[#57534e]/80",
      border: "border-amber-700/30",
      text: "text-stone-200",
      textDim: "text-stone-400",
      primary: "bg-amber-700",
      primaryHover: "hover:bg-amber-600",
      accent: "text-orange-300",
      glow: "shadow-[0_0_20px_rgba(180,83,9,0.4)]",
    },
  },

  // 9. MATRIX (Noir/Vert Lime - Hacker Mode)
  matrix: {
    colors: {
      bg: "bg-[#000000]",
      sidebar: "bg-[#052e16]/40",
      panel: "bg-[#064e3b]/60",
      border: "border-lime-500/40",
      text: "text-lime-50",
      textDim: "text-lime-700",
      primary: "bg-lime-600",
      primaryHover: "hover:bg-lime-500",
      accent: "text-lime-400",
      glow: "shadow-[0_0_20px_rgba(101,163,13,0.6)]",
    },
  },

  // 10. CRIMSON (Rouge Sang/Noir - Urgence & Intensité)
  crimson: {
    colors: {
      bg: "bg-[#450a0a]", // Red 950
      sidebar: "bg-[#7f1d1d]/40",
      panel: "bg-[#991b1b]/70",
      border: "border-red-500/30",
      text: "text-red-50",
      textDim: "text-red-300",
      primary: "bg-red-600",
      primaryHover: "hover:bg-red-500",
      accent: "text-red-400",
      glow: "shadow-[0_0_20px_rgba(220,38,38,0.5)]",
    },
  },

  // 11. ROYAL (Or/Bleu Nuit - Luxe & Sagesse)
  royal: {
    colors: {
      bg: "bg-[#172554]", // Blue 950
      sidebar: "bg-[#1e3a8a]/50",
      panel: "bg-[#1e40af]/70",
      border: "border-amber-400/30", // Bordure or
      text: "text-slate-100",
      textDim: "text-slate-400",
      primary: "bg-amber-500", // Or
      primaryHover: "hover:bg-amber-400",
      accent: "text-amber-300",
      glow: "shadow-[0_0_20px_rgba(245,158,11,0.5)]",
    },
  },

  // 12. SYNTHWAVE (Bleu/Rose Néon - Rétro-Futur)
  synthwave: {
    colors: {
      bg: "bg-[#2e1065]", // Violet très sombre
      sidebar: "bg-[#4c1d95]/50",
      panel: "bg-[#5b21b6]/70",
      border: "border-cyan-400/30",
      text: "text-cyan-50",
      textDim: "text-violet-300",
      primary: "bg-pink-500", // Boutons roses
      primaryHover: "hover:bg-pink-400",
      accent: "text-cyan-400", // Texte accent cyan
      glow: "shadow-[0_0_20px_rgba(236,72,153,0.6)]",
    },
  },
};

export const ThemeProvider = ({ children }) => {
  const [themeName, setThemeName] = useState(() => {
    return localStorage.getItem("rudolfOS_theme") || "cosmic";
  });

  const [theme, setTheme] = useState(themes[themeName]);

  const changeTheme = (name) => {
    if (themes[name]) {
      setThemeName(name);
      setTheme(themes[name]);
      localStorage.setItem("rudolfOS_theme", name);
    }
  };

  useEffect(() => {
    setTheme(themes[themeName]);
  }, [themeName]);

  return (
    <ThemeContext.Provider value={{ theme, themeName, changeTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
