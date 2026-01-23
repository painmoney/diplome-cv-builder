import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../api/supabaseClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data?.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Функция выхода с опциональным редиректом
  const signOut = async (redirect = true) => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Ошибка выхода:", error.message);
    } else {
      setUser(null);
      if (redirect) window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
