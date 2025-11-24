import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "./supabaseClient";
import { Lock, Mail, ArrowRight, Loader2, ShieldCheck, KeyRound, ArrowLeft } from "lucide-react";

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("LOGIN"); // LOGIN, SIGNUP, FORGOT
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (view === "SIGNUP") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage({ type: 'success', text: "Inscription réussie ! Vérifiez vos emails." });
      } else if (view === "LOGIN") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (view === "FORGOT") {
        // Envoi de l'email de réinitialisation
        // IMPORTANT : Configure l'URL de redirection dans Supabase > Auth > URL Configuration
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin, // Redirige vers ton app (localhost ou vercel)
        });
        if (error) throw error;
        setMessage({ type: 'success', text: "Lien de réinitialisation envoyé par email !" });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0f172a] flex items-center justify-center font-sans overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-600/20 rounded-full blur-[150px] animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-emerald-600/10 rounded-full blur-[150px]"></div>

      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md p-8 bg-slate-900/50 border border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl"
      >
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            {view === "FORGOT" ? <KeyRound className="text-white" size={32} /> : <Lock className="text-white" size={32} />}
          </div>
        </div>

        <h2 className="text-3xl font-bold text-center text-white mb-2">
          {view === "SIGNUP" ? "Créer un compte" : view === "FORGOT" ? "Récupération" : "Bienvenue, Rudolf"}
        </h2>
        <p className="text-center text-slate-400 mb-8 text-sm">
          {view === "FORGOT" ? "Entrez votre email pour recevoir un lien." : "Accédez à votre système d'exploitation personnel."}
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-indigo-500 transition-all" placeholder="vous@centrale.ma" required />
            </div>
          </div>

          {view !== "FORGOT" && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Mot de passe</label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-indigo-500 transition-all" placeholder="••••••••" required minLength={6} />
              </div>
            </div>
          )}

          {message && (
            <div className={`p-3 rounded-lg text-sm text-center ${message.type === 'error' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
              {message.text}
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4">
            {loading ? <Loader2 className="animate-spin" /> : (
              <>
                {view === "SIGNUP" ? "S'inscrire" : view === "FORGOT" ? "Envoyer le lien" : "Se connecter"} <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center flex flex-col gap-2">
          {view === "LOGIN" && (
            <>
                <button onClick={() => setView("FORGOT")} className="text-xs text-slate-500 hover:text-white transition-colors">Mot de passe oublié ?</button>
                <button onClick={() => setView("SIGNUP")} className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">Pas de compte ? Créer un accès</button>
            </>
          )}
          
          {(view === "SIGNUP" || view === "FORGOT") && (
            <button onClick={() => setView("LOGIN")} className="text-sm text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2">
                <ArrowLeft size={14} /> Retour à la connexion
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}