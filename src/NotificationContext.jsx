import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Charger les notifs au démarrage
  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20); // On garde les 20 dernières
      
      if (error) throw error;

      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    } catch (e) {
      console.error("Error fetching notifications", e);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Écoute en Temps Réel (Realtime)
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, payload => {
        setNotifications(prev => [payload.new, ...prev]);
        setUnreadCount(prev => prev + 1);
        // Son de notification doux
        new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg").play().catch(()=>{});
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Fonction pour envoyer une notif depuis n'importe quel module
  const notify = async (message, type = "INFO") => {
    // 1. Optimistic UI (Affichage immédiat)
    const tempNotif = { 
        id: Date.now(), 
        message, 
        type, 
        is_read: false, 
        created_at: new Date().toISOString() 
    };
    setNotifications(prev => [tempNotif, ...prev]);
    setUnreadCount(prev => prev + 1);

    // 2. Sauvegarde DB
    await supabase.from('notifications').insert([{ message, type }]);
  };

  // Marquer tout comme lu
  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
  };

  // Tout effacer
  const clearNotifications = async () => {
      setNotifications([]);
      setUnreadCount(0);
      await supabase.from('notifications').delete().neq('id', 0);
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, notify, markAllAsRead, clearNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);