import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutGrid, Zap, Wallet, Settings, Bell, Search, Cpu, Package, 
  Calendar, ListTodo, Book, BookHeart, X, User, Globe, Save,
  ChevronLeft, ChevronRight, Palette, CheckCheck, Trash2, Info, CheckCircle, AlertTriangle, XCircle,
  Target, GraduationCap, Library, Activity, LogOut // Ajout LogOut
} from "lucide-react";
import { supabase } from "./supabaseClient"; // Import Supabase

// Imports Modules
import DashboardCore from "./DashboardCore";
import FocusCore from "./FocusCore";
import TasksCore from "./TasksCore";
import CalendarCore from "./CalendarCore";
import GoalsCore from "./GoalsCore";
import FinanceCore from "./FinanceCore";
import InventoryCore from "./InventoryCore";
import CoursesCore from "./CoursesCore";
import ArticlesCore from "./ArticlesCore";
import LibraryCore from "./LibraryCore";
import HabitsCore from "./HabitsCore";
import JournalCore from "./JournalCore";
import BibleCore from "./BibleCore";
import Auth from "./Auth"; // <-- IMPORT DE LA PAGE LOGIN

// Contextes
import { ThemeProvider, useTheme } from "./ThemeContext";
import { NotificationProvider, useNotification } from "./NotificationContext";

const DEFAULT_USER_SETTINGS = {
  username: "Rudolf",
  currency: "EUR",
  bibleVersion: "ls1910"
};

// ... (Garder SidebarItem, NotificationDropdown, SettingsModal tels quels) ...
// JE NE LES RÉPÈTE PAS ICI POUR GAGNER DE LA PLACE, MAIS ILS DOIVENT ÊTRE DANS LE FICHIER
// Copie-les depuis ta version précédente si besoin, ou demande-moi de tout réécrire si tu as un doute.

const SidebarItem = ({ icon: Icon, label, active, onClick, collapsed, theme }) => (
  <button onClick={onClick} className={`relative flex-shrink-0 flex items-center ${collapsed ? "justify-center" : "justify-start px-4"} w-full h-12 rounded-xl transition-all duration-300 group ${active ? `${theme.colors.primary} text-white shadow-lg ${theme.colors.glow}` : `${theme.colors.textDim} hover:bg-white/5 hover:text-white`}`}>
    <Icon size={20} strokeWidth={2} className="flex-shrink-0" />
    {!collapsed && <span className="ml-3 text-sm font-medium whitespace-nowrap">{label}</span>}
    {collapsed && <span className={`absolute left-14 ${theme.colors.sidebar} ${theme.colors.text} text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border ${theme.colors.border} shadow-xl`}>{label}</span>}
  </button>
);

const NotificationDropdown = ({ onClose }) => {
  const { theme } = useTheme();
  const { notifications, markAllAsRead, clearNotifications } = useNotification();
  const getIcon = (t) => {
      if(t==='SUCCESS') return <CheckCircle size={16} className="text-emerald-400"/>;
      if(t==='WARNING') return <AlertTriangle size={16} className="text-amber-400"/>;
      if(t==='ERROR') return <XCircle size={16} className="text-rose-400"/>;
      return <Info size={16} className="text-blue-400"/>;
  };
  return (
    <>
      <div className="fixed inset-0 z-[90]" onClick={onClose}></div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`absolute top-16 right-8 w-80 ${theme.colors.panel} border ${theme.colors.border} rounded-2xl shadow-2xl backdrop-blur-xl z-[100] overflow-hidden flex flex-col`}>
        <div className={`p-4 border-b ${theme.colors.border} flex justify-between items-center`}><h4 className={`text-sm font-bold ${theme.colors.text}`}>Notifications</h4><div className="flex gap-2"><button onClick={markAllAsRead} className={`${theme.colors.textDim} hover:text-white`}><CheckCheck size={14}/></button><button onClick={clearNotifications} className={`${theme.colors.textDim} hover:text-rose-400`}><Trash2 size={14}/></button></div></div>
        <div className="max-h-80 overflow-y-auto custom-scrollbar">{notifications.length===0?<div className={`p-8 text-center text-xs ${theme.colors.textDim}`}>Rien à signaler.</div>:notifications.map(n=><div key={n.id} className={`p-4 border-b ${theme.colors.border} hover:bg-white/5 flex gap-3 ${n.is_read?'opacity-50':'opacity-100'}`}><div className="mt-1 flex-shrink-0">{getIcon(n.type)}</div><div className="min-w-0"><p className={`text-sm ${theme.colors.text} break-words`}>{n.message}</p><p className={`text-[10px] ${theme.colors.textDim} mt-1`}>{new Date(n.created_at).toLocaleTimeString()}</p></div></div>)}</div>
      </motion.div>
    </>
  );
};

// Dans src/App.jsx

const SettingsModal = ({ settings, onClose, onSave }) => {
  const [formData, setFormData] = useState(settings);
  const [newPassword, setNewPassword] = useState(""); // État pour le mdp
  const [msg, setMsg] = useState(null);
  const { theme, changeTheme, themes } = useTheme();

  // Fonction dédiée pour update le password
  const handlePasswordUpdate = async () => {
      if(newPassword.length < 6) { setMsg({type:'error', text: "6 caractères minimum"}); return; }
      try {
          const { error } = await supabase.auth.updateUser({ password: newPassword });
          if(error) throw error;
          setMsg({type:'success', text: "Mot de passe mis à jour !"});
          setNewPassword("");
      } catch(e) { setMsg({type:'error', text: e.message}); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className={`${theme.colors.bg} border ${theme.colors.border} rounded-3xl p-8 w-full max-w-md shadow-2xl`}>
        {/* Header inchangé */}
        <div className="flex justify-between items-center mb-8"><h3 className={`text-xl font-bold ${theme.colors.text} flex items-center gap-2`}><Settings size={20}/> Paramètres</h3><button onClick={onClose}><X className={`${theme.colors.textDim} hover:text-white`} /></button></div>
        
        <div className="space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
          
          {/* ... (Garder les sections Apparence, Nom, Devise, Bible ici) ... */}
          {/* Pour la clarté de la réponse je ne recopie pas tout, mais garde ton code existant ici */}
          {/* JE RAJOUTE JUSTE LA SECTION SECURITE EN BAS DE LA LISTE */}

          <div className={`h-[1px] w-full ${theme.colors.border} my-4`}></div>
          
          {/* --- NOUVELLE SECTION SÉCURITÉ --- */}
          <div className="space-y-2">
            <label className={`text-xs font-bold ${theme.colors.textDim} uppercase flex items-center gap-2`}>
              <Lock size={14}/> Sécurité
            </label>
            <div className="flex gap-2">
                <input 
                    type="password" 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    placeholder="Nouveau mot de passe"
                    className={`flex-1 bg-black/20 border ${theme.colors.border} rounded-xl p-3 ${theme.colors.text} outline-none focus:border-indigo-500`}
                />
                <button onClick={handlePasswordUpdate} className="px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition-colors">Modifier</button>
            </div>
            {msg && <p className={`text-xs ${msg.type==='error'?'text-rose-400':'text-emerald-400'}`}>{msg.text}</p>}
          </div>

        </div>
        <button onClick={() => onSave(formData)} className={`w-full py-3 ${theme.colors.primary} ${theme.colors.primaryHover} text-white font-bold rounded-xl flex items-center justify-center gap-2 mt-6 shadow-lg transition-all`}><Save size={18} /> Enregistrer</button>
      </motion.div>
    </motion.div>
  );
};

// --- APP SHELL (Protégé) ---
const AppShell = () => {
  const { theme } = useTheme();
  const { unreadCount } = useNotification();
  const [activeTab, setActiveTab] = useState("DASHBOARD");
  const [time, setTime] = useState(new Date());
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [userSettings, setUserSettings] = useState(() => {
    const saved = localStorage.getItem("rudolfOS_user_settings");
    return saved ? JSON.parse(saved) : DEFAULT_USER_SETTINGS;
  });

  const handleSaveSettings = (newSettings) => {
    setUserSettings(newSettings);
    localStorage.setItem("rudolfOS_user_settings", JSON.stringify(newSettings));
    setShowSettings(false);
  };

  // Fonction de déconnexion
  const handleLogout = async () => {
      await supabase.auth.signOut();
      window.location.reload(); // Recharge pour afficher l'écran de login
  };

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const currencySymbol = { "EUR": "€", "USD": "$", "MAD": "DH", "XOF": "CFA" }[userSettings.currency];

  return (
    <div className={`fixed inset-0 ${theme.colors.bg} ${theme.colors.text} font-sans flex overflow-hidden transition-colors duration-500`}>
      <div className={`fixed top-[-20%] left-[-10%] w-[50vw] h-[50vw] ${theme.colors.primary} rounded-full blur-[150px] pointer-events-none opacity-20`}></div>
      <div className={`fixed bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] ${theme.colors.accent.replace('text-', 'bg-')} rounded-full blur-[150px] pointer-events-none opacity-10`}></div>

      <motion.nav initial={false} animate={{ width: sidebarCollapsed ? 80 : 260 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className={`h-full flex flex-col z-50 border-r ${theme.colors.border} ${theme.colors.sidebar} backdrop-blur-md relative`}>
        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className={`absolute -right-3 top-10 w-6 h-6 rounded-full ${theme.colors.panel} border ${theme.colors.border} flex items-center justify-center ${theme.colors.textDim} hover:text-white shadow-sm z-50`}><ChevronRight className={`transform transition-transform ${sidebarCollapsed ? "" : "rotate-180"}`} size={14} /></button>
        <div className={`py-8 flex-shrink-0 flex justify-center ${sidebarCollapsed ? "" : "px-6"}`}><div className={`h-10 rounded-xl ${theme.colors.primary} flex items-center justify-center font-bold text-white shadow-lg cursor-pointer hover:scale-105 transition-all overflow-hidden ${sidebarCollapsed ? "w-10" : "w-full"}`} onClick={() => setActiveTab("DASHBOARD")}>{sidebarCollapsed ? "RH" : "RUDOLF OS"}</div></div>

        <div className="flex-1 w-full overflow-y-auto custom-scrollbar flex flex-col gap-2 px-3 pb-4">
          <SidebarItem theme={theme} collapsed={sidebarCollapsed} icon={LayoutGrid} label="Dashboard" active={activeTab === "DASHBOARD"} onClick={() => setActiveTab("DASHBOARD")} />
          <div className={`h-[1px] ${theme.colors.border} my-2 mx-2`}></div>
          <SidebarItem theme={theme} collapsed={sidebarCollapsed} icon={Zap} label="Focus" active={activeTab === "FOCUS"} onClick={() => setActiveTab("FOCUS")} />
          <SidebarItem theme={theme} collapsed={sidebarCollapsed} icon={ListTodo} label="Tâches" active={activeTab === "TASKS"} onClick={() => setActiveTab("TASKS")} />
          <SidebarItem theme={theme} collapsed={sidebarCollapsed} icon={Calendar} label="Agenda" active={activeTab === "CALENDAR"} onClick={() => setActiveTab("CALENDAR")} />
          <SidebarItem theme={theme} collapsed={sidebarCollapsed} icon={Target} label="Objectifs" active={activeTab === "GOALS"} onClick={() => setActiveTab("GOALS")} />
          <SidebarItem theme={theme} collapsed={sidebarCollapsed} icon={Activity} label="Habitudes" active={activeTab === "HABITS"} onClick={() => setActiveTab("HABITS")} />
          <div className={`h-[1px] ${theme.colors.border} my-2 mx-2`}></div>
          <SidebarItem theme={theme} collapsed={sidebarCollapsed} icon={Wallet} label="Finance" active={activeTab === "FINANCE"} onClick={() => setActiveTab("FINANCE")} />
          <SidebarItem theme={theme} collapsed={sidebarCollapsed} icon={Package} label="Inventaire" active={activeTab === "INVENTORY"} onClick={() => setActiveTab("INVENTORY")} />
          <div className={`h-[1px] ${theme.colors.border} my-2 mx-2`}></div>
          <SidebarItem theme={theme} collapsed={sidebarCollapsed} icon={GraduationCap} label="Cours" active={activeTab === "COURSES"} onClick={() => setActiveTab("COURSES")} />
          <SidebarItem theme={theme} collapsed={sidebarCollapsed} icon={Library} label="Bibliothèque" active={activeTab === "LIBRARY"} onClick={() => setActiveTab("LIBRARY")} />
          <SidebarItem theme={theme} collapsed={sidebarCollapsed} icon={Book} label="Notes" active={activeTab === "ARTICLES"} onClick={() => setActiveTab("ARTICLES")} />
          <SidebarItem theme={theme} collapsed={sidebarCollapsed} icon={Book} label="Journal" active={activeTab === "JOURNAL"} onClick={() => setActiveTab("JOURNAL")} />
          <SidebarItem theme={theme} collapsed={sidebarCollapsed} icon={BookHeart} label="Bible" active={activeTab === "BIBLE"} onClick={() => setActiveTab("BIBLE")} />
        </div>

        <div className="p-4 flex-shrink-0 border-t border-white/5 flex flex-col gap-2">
            <SidebarItem theme={theme} collapsed={sidebarCollapsed} icon={Settings} label="Paramètres" onClick={() => setShowSettings(true)} />
            <SidebarItem theme={theme} collapsed={sidebarCollapsed} icon={LogOut} label="Déconnexion" onClick={handleLogout} />
        </div>
      </motion.nav>

      <main className="flex-1 relative overflow-y-auto custom-scrollbar flex flex-col">
        <header className={`h-16 flex items-center justify-between px-8 sticky top-0 z-40 ${theme.colors.bg}/80 backdrop-blur-sm border-b ${theme.colors.border} transition-colors duration-500`}>
          <div className="relative group"><Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.colors.textDim}`} size={16} /><input placeholder="Recherche globale..." className={`bg-black/10 border ${theme.colors.border} rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-all w-64 ${theme.colors.text} placeholder:${theme.colors.textDim}`}/></div>
          <div className="flex items-center gap-6"><span className={`text-sm font-medium font-mono hidden md:block ${theme.colors.textDim}`}>{time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span><div className="relative"><button onClick={() => setShowNotifications(!showNotifications)} className={`relative p-2 ${theme.colors.textDim} hover:text-white transition-colors`}><Bell size={20} />{unreadCount > 0 && (<span className={`absolute top-2 right-2 w-2 h-2 ${theme.colors.primary} rounded-full ring-2 ring-[#0f172a]`}></span>)}</button><AnimatePresence>{showNotifications && <NotificationDropdown onClose={() => setShowNotifications(false)} />}</AnimatePresence></div></div>
        </header>

        <div className="flex-1 p-2 md:p-0">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 20, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.99 }} transition={{ duration: 0.3 }} className="h-full">
              {activeTab === "DASHBOARD" && <DashboardCore username={userSettings.username} />}
              {activeTab === "FOCUS" && <FocusCore />}
              {activeTab === "FINANCE" && <FinanceCore currency={currencySymbol} />}
              {activeTab === "INVENTORY" && <InventoryCore currency={currencySymbol} />}
              {activeTab === "CALENDAR" && <CalendarCore />}
              {activeTab === "TASKS" && <TasksCore />}
              {activeTab === "ARTICLES" && <ArticlesCore />}
              {activeTab === "JOURNAL" && <JournalCore />}
              {activeTab === "BIBLE" && <BibleCore version={userSettings.bibleVersion} />}
              {activeTab === "GOALS" && <GoalsCore />}
              {activeTab === "COURSES" && <CoursesCore />}
              {activeTab === "LIBRARY" && <LibraryCore />}
              {activeTab === "HABITS" && <HabitsCore />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>{showSettings && <SettingsModal settings={userSettings} onClose={() => setShowSettings(false)} onSave={handleSaveSettings} />}</AnimatePresence>
    </div>
  );
};

// --- AUTH WRAPPER ---
// Ce composant vérifie si l'utilisateur est connecté
// Dans src/App.jsx (tout en bas)

// Modale spéciale "Reset Password" forcée
const ResetPasswordModal = ({ onClose }) => {
    const [password, setPassword] = useState("");
    const [msg, setMsg] = useState(null);

    const handleUpdate = async () => {
        try {
            const { error } = await supabase.auth.updateUser({ password: password });
            if(error) throw error;
            setMsg({type:'success', text: "Mot de passe changé avec succès !"});
            setTimeout(onClose, 2000); // Ferme après 2s
        } catch(e) {
            setMsg({type:'error', text: e.message});
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl w-full max-w-sm shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-4">Nouveau Mot de Passe</h3>
                <p className="text-slate-400 text-sm mb-6">Veuillez définir votre nouveau mot de passe sécurisé.</p>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white mb-4" placeholder="••••••••" />
                {msg && <p className={`text-center text-sm mb-4 ${msg.type==='error'?'text-rose-400':'text-emerald-400'}`}>{msg.text}</p>}
                <button onClick={handleUpdate} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl">Valider</button>
            </div>
        </div>
    );
};

const AuthWrapper = () => {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [recoveryMode, setRecoveryMode] = useState(false); // Nouveau state

    useEffect(() => {
        // 1. Get Session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        // 2. Listen for Auth Changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(session);
            // Si l'événement est une récupération de mot de passe
            if (event === 'PASSWORD_RECOVERY') {
                setRecoveryMode(true);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) return <div className="fixed inset-0 bg-[#0f172a] flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>;

    if (!session) return <Auth />;

    return (
        <>
            <AppShell />
            {recoveryMode && <ResetPasswordModal onClose={() => setRecoveryMode(false)} />}
        </>
    );
};
export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthWrapper />
      </NotificationProvider>
    </ThemeProvider>
  );
}