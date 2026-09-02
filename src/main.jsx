import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { LogOut } from "lucide-react";
import App from "./App.jsx";
import Auth from "./Auth.jsx";
import { supabase } from "./supabaseClient";

function conectarStorage(userId) {
  window.storage = {
    async get(key) {
      const { data, error } = await supabase
        .from("finanzas_kv")
        .select("value")
        .eq("user_id", userId)
        .eq("key", key)
        .maybeSingle();
      if (error || !data) return null;
      return { key, value: data.value, shared: false };
    },
    async set(key, value) {
      const { error } = await supabase
        .from("finanzas_kv")
        .upsert({ user_id: userId, key, value, updated_at: new Date().toISOString() }, { onConflict: "user_id,key" });
      if (error) return null;
      return { key, value, shared: false };
    },
    async delete(key) {
      const { error } = await supabase.from("finanzas_kv").delete().eq("user_id", userId).eq("key", key);
      if (error) return null;
      return { key, deleted: true, shared: false };
    },
    async list(prefix = "") {
      const { data, error } = await supabase
        .from("finanzas_kv")
        .select("key")
        .eq("user_id", userId)
        .like("key", `${prefix}%`);
      if (error) return null;
      return { keys: (data || []).map((r) => r.key), prefix, shared: false };
    },
  };
}

function AppGate() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#EFEAD8", fontFamily: "Inter, sans-serif", color: "#1F2A24" }}>
        Cargando…
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  conectarStorage(session.user.id);

  return (
    <div>
      <button
        onClick={() => supabase.auth.signOut()}
        style={{
          position: "fixed",
          top: 10,
          right: 10,
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          gap: 5,
          background: "#1F2A24",
          color: "#F6F1E7",
          border: "none",
          borderRadius: 20,
          padding: "6px 12px",
          fontSize: 11,
          fontWeight: 600,
          cursor: "pointer",
          opacity: 0.85,
        }}
      >
        <LogOut size={12} /> Salir
      </button>
      <App key={session.user.id} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppGate />
  </React.StrictMode>
);
