import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  TrendingDown,
  ArrowUpRight,
  Trash2,
  Home,
  Package,
  Settings,
  Loader2,
  AlertCircle
} from "lucide-react";
import { supabase } from "./supabaseClient"; // Assure-toi du chemin correct
import { AreaChart, Area, Tooltip, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { cn } from "./utils"; // Assure-toi du chemin correct

const FinanceOS = ({ onExit }) => {
  // --- CONFIG & STATE ---
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Safe LocalStorage Access
  const getSavedCurrency = () => {
    try {
      if (typeof window !== "undefined") {
        return localStorage.getItem("userCurrency") || "EUR";
      }
    } catch (e) {
      console.warn("Storage access denied", e);
    }
    return "EUR";
  };

  const [currency, setCurrency] = useState(getSavedCurrency);
  const [activeTab, setActiveTab] = useState("WALLET"); // WALLET, INVENTORY, CONFIG

  // Data
  const [transactions, setTransactions] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [balance, setBalance] = useState(0);
  const [stockValue, setStockValue] = useState(0);
  const [chartData, setChartData] = useState([]);

  // Inputs Wallet
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");
  const [transType, setTransType] = useState("EXPENSE");
  const [selectedArticleId, setSelectedArticleId] = useState("");

  // Inputs Inventory
  const [newItemName, setNewItemName] = useState("");
  const [newItemType, setNewItemType] = useState("PRODUCT");
  const [newItemPrice, setNewItemPrice] = useState("");

  const CURRENCIES = [
    { code: "EUR", symbol: "€", label: "Euro" },
    { code: "USD", symbol: "$", label: "Dollar" },
    { code: "XOF", symbol: "CFA", label: "Franc CFA" },
    { code: "MAD", symbol: "DH", label: "Dirham" },
    { code: "CAD", symbol: "$", label: "Dollar CA" },
  ];

  const formatMoney = (val) => {
    const symbol = CURRENCIES.find((c) => c.code === currency)?.symbol || currency;
    return `${val.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`;
  };

  // --- DATA LOADING ---
  const refreshData = async () => {
    try {
      // 1. Transactions Fetch
      const { data: transData, error: transError } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (transError) throw transError;

      if (transData) {
        setTransactions(transData);
        // Calcul du solde actuel
        const total = transData.reduce(
          (acc, t) => (t.type === "INCOME" ? acc + t.amount : acc - t.amount),
          0
        );
        setBalance(total);

        // Construction du graph (Chronologique : du plus vieux au plus récent)
        // On inverse d'abord pour avoir l'ordre chronologique
        const reversed = [...transData].reverse();
        let runningBalance = 0; // Il faudrait idéalement un solde initial, ici on assume 0 au début de l'historique chargé
        
        // Pour un graph précis, on devrait calculer le solde initial en soustrayant tout l'historique du solde actuel, 
        // mais pour ce MVP on va reconstruire le flux.
        
        const chart = reversed.map((t) => {
            const val = t.type === "INCOME" ? t.amount : -t.amount;
            runningBalance += val;
            return { 
                date: new Date(t.created_at).toLocaleDateString(undefined, {day: '2-digit', month:'2-digit'}), 
                solde: runningBalance,
                amount: val 
            };
        });
        
        // Ajustement pour que le dernier point du graph corresponde au solde actuel exact
        // (Hack visuel si l'historique n'est pas complet)
        if (chart.length > 0) {
            const delta = total - chart[chart.length - 1].solde;
            chart.forEach(pt => pt.solde += delta);
        }

        setChartData(chart.slice(-30)); // Derniers 30 mouvements
      }

      // 2. Inventory Fetch
      const { data: invData, error: invError } = await supabase
        .from("inventory")
        .select("*")
        .order("name", { ascending: true });

      if (invError) throw invError;

      if (invData) {
        setInventory(invData);
        const val = invData.reduce(
          (acc, item) => acc + (item.quantity || 0) * (item.unit_value || 0),
          0
        );
        setStockValue(val);
      }
    } catch (e) {
      console.error("Data refresh failed:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // --- ACTIONS ---
  const updateCurrency = (c) => {
    setCurrency(c);
    localStorage.setItem("userCurrency", c);
  };

  const handleTransaction = async () => {
    if (!amount || !label || isSubmitting) return;
    
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
        alert("Montant invalide");
        return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("transactions").insert([
        {
          amount: val,
          type: transType,
          label: label.trim(),
          category: selectedArticleId ? "Restock" : "Autre",
          created_at: new Date(),
        },
      ]);

      if (error) throw error;

      // Logique Stock Automatique
      if (transType === "EXPENSE" && selectedArticleId) {
        const item = inventory.find((i) => i.id === selectedArticleId);
        if (item) {
          // Protection division par zéro ou unit_value manquant
          const unitVal = item.unit_value > 0 ? item.unit_value : val; 
          const qtyToAdd = Math.round(val / unitVal);
          
          const { error: stockError } = await supabase
            .from("inventory")
            .update({ quantity: (item.quantity || 0) + qtyToAdd })
            .eq("id", selectedArticleId);
            
          if (stockError) console.error("Stock update failed", stockError);
        }
      }
      
      // Reset form
      setAmount("");
      setLabel("");
      setSelectedArticleId("");
      await refreshData();

    } catch (e) {
      console.error("Transaction failed:", e);
      alert("Erreur lors de la transaction. Vérifiez la connexion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const createItem = async () => {
    if (!newItemName || isSubmitting) return;
    setIsSubmitting(true);
    
    try {
        const { error } = await supabase.from("inventory").insert([
        {
            name: newItemName.trim(),
            type: newItemType,
            unit_value: parseFloat(newItemPrice) || 0,
            quantity: 0,
        },
        ]);
        if (error) throw error;
        
        setNewItemName("");
        setNewItemPrice("");
        await refreshData();
    } catch(e) {
        console.error("Create item failed", e);
    } finally {
        setIsSubmitting(false);
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Supprimer définitivement cet article ?")) return;
    try {
        await supabase.from("inventory").delete().eq("id", id);
        refreshData();
    } catch (e) { console.error(e) }
  };

  const deleteTransaction = async (id) => {
    if (!window.confirm("Annuler cette transaction ? Cela n'annulera pas les mouvements de stock associés.")) return;
    try {
        await supabase.from("transactions").delete().eq("id", id);
        refreshData();
    } catch (e) { console.error(e) }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#050505] text-white font-sans overflow-hidden flex flex-col selection:bg-emerald-500/30"
    >
      {/* ARRIÈRE-PLAN */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-emerald-900/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-blue-900/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
      </div>

      {/* HEADER */}
      <div className="relative z-20 p-4 border-b border-white/10 bg-black/40 backdrop-blur-md flex flex-col md:flex-row justify-between items-center gap-4">
        <button
          onClick={onExit}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-xs font-bold uppercase tracking-widest border border-white/5 hover:border-white/20"
        >
          <Home size={14} /> <span className="hidden md:inline">Retour Hub</span>
        </button>

        {/* NAVIGATION TABS */}
        <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab("WALLET")}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
              activeTab === "WALLET"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20"
                : "text-gray-500 hover:text-white hover:bg-white/5"
            )}
          >
            <Wallet size={16} /> Flux
          </button>
          <button
            onClick={() => setActiveTab("INVENTORY")}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
              activeTab === "INVENTORY"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                : "text-gray-500 hover:text-white hover:bg-white/5"
            )}
          >
            <Package size={16} /> Stock
          </button>
          <button
            onClick={() => setActiveTab("CONFIG")}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
              activeTab === "CONFIG"
                ? "bg-white text-black shadow-lg"
                : "text-gray-500 hover:text-white hover:bg-white/5"
            )}
          >
            <Settings size={16} /> Config
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/5 group hover:border-emerald-500/30 transition-colors">
          <span className="text-xs text-gray-400 uppercase tracking-wider group-hover:text-emerald-400/70 transition-colors">Solde Global</span>
          <span className={cn("text-sm font-mono font-bold", balance >= 0 ? "text-white" : "text-red-400")}>
            {isLoading ? <Loader2 className="animate-spin h-4 w-4"/> : formatMoney(balance)}
          </span>
        </div>
      </div>

      {/* CONTENU PRINCIPAL */}
      <div className="relative z-10 flex-1 overflow-hidden p-4 lg:p-8 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          
          {/* --- LOADING STATE --- */}
          {isLoading && (
              <motion.div exit={{opacity: 0}} className="absolute inset-0 flex items-center justify-center z-50">
                  <Loader2 className="animate-spin text-emerald-500" size={48} />
              </motion.div>
          )}

          {/* --- ONGLET 1 : FLUX (WALLET) --- */}
          {!isLoading && activeTab === "WALLET" && (
            <motion.div
              key="wallet"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full flex flex-col lg:flex-row gap-6"
            >
              {/* Panneau Saisie */}
              <div className="w-full lg:w-1/3 flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar pr-2">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-black border border-emerald-500/20 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Wallet size={64}/></div>
                    <p className="text-[10px] uppercase text-emerald-400/60 font-bold tracking-widest mb-1">
                        Liquidités Disponibles
                    </p>
                    <h2 className={cn("text-4xl font-mono font-medium", balance < 0 ? "text-red-400" : "text-white")}>
                        {formatMoney(balance)}
                    </h2>
                </div>

                <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl p-6 flex flex-col gap-4 shadow-lg relative">
                    {isSubmitting && <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center rounded-2xl"><Loader2 className="animate-spin"/></div>}
                  
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                    Nouvelle Opération
                  </h3>

                  <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-lg border border-white/5">
                    <button
                      onClick={() => setTransType("EXPENSE")}
                      className={cn(
                        "py-2 text-[10px] font-bold uppercase rounded transition-colors",
                        transType === "EXPENSE"
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : "text-gray-600 hover:text-white"
                      )}
                    >
                      Dépense
                    </button>
                    <button
                      onClick={() => setTransType("INCOME")}
                      className={cn(
                        "py-2 text-[10px] font-bold uppercase rounded transition-colors",
                        transType === "INCOME"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "text-gray-600 hover:text-white"
                      )}
                    >
                      Revenu
                    </button>
                  </div>

                  <div className="relative group">
                    <span className="absolute left-3 top-3.5 text-gray-500 text-lg font-serif">
                      {CURRENCIES.find((c) => c.code === currency)?.symbol}
                    </span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 text-xl font-mono text-white focus:border-emerald-500/50 outline-none transition-all placeholder:text-gray-700"
                      placeholder="0.00"
                    />
                  </div>

                  {/* Liaison Inventaire (Uniquement si Dépense) */}
                  {transType === "EXPENSE" && (
                    <motion.div initial={{height: 0, opacity: 0}} animate={{height: 'auto', opacity: 1}} className="relative">
                      <select
                        value={selectedArticleId}
                        onChange={(e) => {
                          setSelectedArticleId(e.target.value);
                          if (e.target.value) {
                            const i = inventory.find((x) => x.id === e.target.value);
                            setLabel(`Achat: ${i?.name}`);
                          }
                        }}
                        className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs text-gray-300 outline-none appearance-none hover:border-white/20 transition-colors cursor-pointer"
                      >
                        <option value="">-- Type de dépense --</option>
                        <optgroup label="Gestion de Stock">
                            {inventory
                            .filter((i) => i.type === "PRODUCT")
                            .map((i) => (
                                <option key={i.id} value={i.id}>
                                Restock : {i.name}
                                </option>
                            ))}
                        </optgroup>
                        <optgroup label="Autre">
                             <option value="" disabled>Service / Frais divers</option>
                        </optgroup>
                      </select>
                      <div className="absolute right-3 top-3 pointer-events-none text-gray-500">
                        <Package size={14} />
                      </div>
                    </motion.div>
                  )}

                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Description (ex: Serveur AWS, Café...)"
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-white/30 outline-none placeholder:text-gray-700 transition-all"
                  />

                  <button
                    onClick={handleTransaction}
                    disabled={!amount || !label}
                    className={cn(
                      "mt-2 w-full py-3 rounded-xl font-bold uppercase text-xs transition-all flex items-center justify-center gap-2",
                      transType === "INCOME"
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                        : "bg-white text-black hover:bg-gray-200",
                      (!amount || !label) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={14}/> : "Valider"}
                  </button>
                </div>
              </div>

              {/* Panneau Historique & Graph */}
              <div className="w-full lg:w-2/3 flex flex-col gap-6 h-full overflow-hidden">
                <div className="h-48 lg:h-64 w-full bg-[#0F0F0F] border border-white/10 rounded-2xl p-4 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient
                          id="colorSolde"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10b981"
                            stopOpacity={0.2}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10b981"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#000",
                          border: "1px solid #333",
                          borderRadius: "8px",
                          fontSize: "12px"
                        }}
                        itemStyle={{ color: "#fff" }}
                        formatter={(value) => [formatMoney(value), "Solde"]}
                      />
                      <XAxis dataKey="date" hide />
                      <Area
                        type="monotone"
                        dataKey="solde"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorSolde)"
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="flex-1 bg-[#0F0F0F] border border-white/10 rounded-2xl p-0 overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                    <h3 className="text-xs font-bold uppercase text-gray-500">
                      Derniers Mouvements
                    </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                    {transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-700 gap-2">
                            <AlertCircle size={24}/>
                            <span className="text-xs">Aucune transaction</span>
                        </div>
                    ) : (
                        transactions.map((t) => (
                        <div
                            key={t.id}
                            className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg group border border-transparent hover:border-white/5 transition-all cursor-default"
                        >
                            <div className="flex items-center gap-3">
                            <div
                                className={cn(
                                "w-8 h-8 rounded flex items-center justify-center",
                                t.type === "INCOME"
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : "bg-red-500/10 text-red-400"
                                )}
                            >
                                {t.type === "INCOME" ? (
                                <ArrowUpRight size={16} />
                                ) : (
                                <TrendingDown size={16} />
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-200">
                                {t.label}
                                </p>
                                <p className="text-[10px] text-gray-600 font-mono">
                                {new Date(t.created_at).toLocaleDateString()} • {new Date(t.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                            </div>
                            </div>
                            <div className="flex items-center gap-4">
                            <span
                                className={cn(
                                "font-mono text-sm font-bold",
                                t.type === "INCOME"
                                    ? "text-emerald-400"
                                    : "text-white/70"
                                )}
                            >
                                {t.type === "INCOME" ? "+" : "-"}
                                {formatMoney(t.amount)}
                            </span>
                            <button
                                onClick={() => deleteTransaction(t.id)}
                                className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                title="Supprimer la transaction"
                            >
                                <Trash2 size={14} />
                            </button>
                            </div>
                        </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* --- ONGLET 2 : CATALOGUE / STOCK (INTERFACE SÉPARÉE) --- */}
          {!isLoading && activeTab === "INVENTORY" && (
            <motion.div
              key="inventory"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full flex flex-col lg:flex-row gap-6"
            >
              {/* Colonne Ajout Article */}
              <div className="w-full lg:w-1/4 bg-[#0A0A0A]/90 border border-white/10 rounded-2xl p-6 flex flex-col gap-4 h-fit shadow-xl relative">
                {isSubmitting && <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center rounded-2xl"><Loader2 className="animate-spin"/></div>}

                <div className="flex items-center gap-2 text-blue-400 mb-2">
                  <Package size={18} />
                  <h3 className="text-xs font-bold uppercase tracking-widest">
                    Nouvelle Référence
                  </h3>
                </div>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Nom (ex: RAM 16Go)"
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-blue-500/50 placeholder:text-gray-700 transition-all"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewItemType("PRODUCT")}
                    className={cn(
                      "flex-1 py-2 text-[10px] font-bold uppercase rounded border transition-all",
                      newItemType === "PRODUCT"
                        ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                        : "border-white/10 text-gray-600 hover:bg-white/5"
                    )}
                  >
                    Objet
                  </button>
                  <button
                    onClick={() => setNewItemType("SERVICE")}
                    className={cn(
                      "flex-1 py-2 text-[10px] font-bold uppercase rounded border transition-all",
                      newItemType === "SERVICE"
                        ? "bg-purple-500/20 border-purple-500/50 text-purple-400"
                        : "border-white/10 text-gray-600 hover:bg-white/5"
                    )}
                  >
                    Service
                  </button>
                </div>
                <div>
                  <label className="text-[9px] text-gray-500 uppercase mb-1 block">
                    Prix unitaire estimé
                  </label>
                  <div className="relative">
                      <input
                        type="number"
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white font-mono outline-none focus:border-white/30 transition-all"
                      />
                      <span className="absolute right-3 top-3 text-gray-600 text-xs">{CURRENCIES.find(c=>c.code===currency)?.symbol}</span>
                  </div>
                </div>
                <button
                  onClick={createItem}
                  disabled={!newItemName}
                  className={cn(
                      "mt-4 w-full py-3 rounded-lg bg-blue-600 text-white font-bold uppercase text-xs hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20",
                      !newItemName && "opacity-50 grayscale cursor-not-allowed"
                  )}
                >
                  Ajouter au catalogue
                </button>
              </div>

              {/* Grille Catalogue */}
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                    Mon Inventaire
                  </h3>
                  <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                    Valo : {formatMoney(stockValue)}
                  </span>
                </div>
                
                {inventory.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-48 text-gray-700 border border-dashed border-white/10 rounded-xl">
                        <Package size={32} className="mb-2 opacity-50"/>
                        <span className="text-xs uppercase tracking-widest">Inventaire vide</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                    {inventory.map((item) => (
                        <div
                        key={item.id}
                        className="bg-[#0F0F0F] border border-white/5 hover:border-white/20 rounded-xl p-5 transition-all group flex flex-col justify-between min-h-[120px] relative overflow-hidden hover:bg-white/[0.02]"
                        >
                        <div
                            className={cn(
                            "absolute -right-5 -top-5 w-20 h-20 rounded-full blur-[30px] opacity-10 transition-opacity group-hover:opacity-20",
                            item.type === "PRODUCT"
                                ? "bg-blue-500"
                                : "bg-purple-500"
                            )}
                        ></div>
                        
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                            <h4 className="font-bold text-white text-sm line-clamp-1" title={item.name}>
                                {item.name}
                            </h4>
                            <span className={cn("text-[9px] uppercase mt-1 px-1.5 py-0.5 rounded border inline-block", item.type === "PRODUCT" ? "border-blue-500/30 text-blue-400" : "border-purple-500/30 text-purple-400")}>
                                {item.type === 'PRODUCT' ? 'Stock' : 'Service'}
                            </span>
                            </div>
                            <button
                            onClick={() => deleteItem(item.id)}
                            className="text-gray-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
                            >
                            <Trash2 size={14} />
                            </button>
                        </div>
                        
                        <div className="relative z-10 mt-4 flex justify-between items-end border-t border-white/5 pt-3">
                            <div>
                            <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">
                                Quantité
                            </p>
                            <p className="text-xl font-mono text-white">
                                {item.quantity}
                            </p>
                            </div>
                            <div className="text-right">
                            <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">
                                Unitaire
                            </p>
                            <p className="text-sm font-mono text-gray-300">
                                {formatMoney(item.unit_value)}
                            </p>
                            </div>
                        </div>
                        </div>
                    ))}
                    </div>
                )}
              </div>
            </motion.div>
          )}

          {/* --- ONGLET 3 : CONFIGURATION (DEVISE) --- */}
          {!isLoading && activeTab === "CONFIG" && (
            <motion.div
              key="config"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-full flex items-center justify-center"
            >
              <div className="w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-white/5 mix-blend-overlay pointer-events-none"></div>
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 relative z-10">
                  <Settings size={20} className="text-gray-400" /> Paramètres
                  Finance
                </h2>
                <div className="space-y-4 relative z-10">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                    Devise par défaut
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {CURRENCIES.map((c) => (
                      <button
                        key={c.code}
                        onClick={() => updateCurrency(c.code)}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-xl border transition-all",
                          currency === c.code
                            ? "bg-white/10 border-white/30 text-white shadow-inner"
                            : "bg-transparent border-white/5 text-gray-500 hover:bg-white/5 hover:text-gray-300"
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <span className="text-lg w-8 text-center font-serif">
                            {c.symbol}
                          </span>{" "}
                          <span className="font-medium text-sm">{c.label}</span>
                        </span>
                        {currency === c.code && (
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default FinanceOS;