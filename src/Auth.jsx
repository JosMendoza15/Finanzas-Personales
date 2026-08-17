import { useState } from "react";
import { supabase } from "./supabaseClient";
import { Coins } from "lucide-react";

export default function Auth() {
  const [modo, setModo] = useState("entrar"); // 'entrar' | 'crear'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [avisoCuentaCreada, setAvisoCuentaCreada] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setAvisoCuentaCreada(false);
    if (!email.trim() || !password) {
      setError("Pon tu correo y tu contraseña.");
      return;
    }
    setLoading(true);
    if (modo === "entrar") {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) setError("Correo o contraseña incorrectos.");
    } else {
      const { error } = await supabase.auth.signUp({ email: email.trim(), password });
      if (error) {
        setError(error.message.includes("Password") ? "La contraseña debe tener al menos 6 caracteres." : "No se pudo crear la cuenta. Ese correo ya podría estar registrado.");
      } else {
        setAvisoCuentaCreada(true);
      }
    }
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoRow}>
          <Coins size={26} color="#2F5D50" />
          <span style={styles.logoText}>Mis Finanzas</span>
        </div>
        <h1 style={styles.title}>{modo === "entrar" ? "Inicia sesión" : "Crea tu cuenta"}</h1>
        <p style={styles.subtitle}>
          {modo === "entrar"
            ? "Con la misma cuenta ves tu información desde cualquier dispositivo."
            : "Con esta cuenta vas a poder ver tu información desde cualquier dispositivo."}
        </p>

        <form onSubmit={handleSubmit}>
          <div style={styles.formRow}>
            <label style={styles.label}>Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              autoCapitalize="none"
              placeholder="tucorreo@ejemplo.com"
            />
          </div>
          <div style={styles.formRow}>
            <label style={styles.label}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}
          {avisoCuentaCreada && (
            <div style={styles.okBox}>
              Cuenta creada. Ya puedes iniciar sesión con tu correo y contraseña.
            </div>
          )}

          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? "Un momento…" : modo === "entrar" ? "Entrar" : "Crear cuenta"}
          </button>
        </form>

        <button
          style={styles.switchBtn}
          onClick={() => { setModo(modo === "entrar" ? "crear" : "entrar"); setError(""); setAvisoCuentaCreada(false); }}
        >
          {modo === "entrar" ? "¿No tienes cuenta? Crea una" : "¿Ya tienes cuenta? Inicia sesión"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#EFEAD8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    fontFamily: "Inter, sans-serif",
    boxSizing: "border-box",
  },
  card: {
    width: "100%",
    maxWidth: 380,
    background: "#FBF8F1",
    border: "1px solid #DDD5BE",
    borderRadius: 16,
    padding: 28,
    boxSizing: "border-box",
  },
  logoRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 18 },
  logoText: { fontWeight: 700, fontSize: 14, color: "#2F5D50", letterSpacing: "0.04em", textTransform: "uppercase" },
  title: { fontSize: 24, fontWeight: 700, color: "#1F2A24", margin: "0 0 8px" },
  subtitle: { fontSize: 13, color: "#5C6B62", marginBottom: 22, lineHeight: 1.4 },
  formRow: { marginBottom: 14 },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: "#5C6B62", marginBottom: 5 },
  input: {
    width: "100%",
    padding: "11px 12px",
    borderRadius: 8,
    border: "1px solid #C9BE9F",
    background: "#fff",
    fontSize: 15,
    boxSizing: "border-box",
    color: "#1F2A24",
  },
  errorBox: {
    background: "#FBEAEA",
    color: "#A83E3E",
    fontSize: 13,
    padding: "10px 12px",
    borderRadius: 8,
    marginBottom: 14,
  },
  okBox: {
    background: "#EAF4EE",
    color: "#2F5D50",
    fontSize: 13,
    padding: "10px 12px",
    borderRadius: 8,
    marginBottom: 14,
  },
  submitBtn: {
    width: "100%",
    padding: "13px 0",
    borderRadius: 8,
    border: "none",
    background: "#2F5D50",
    color: "#F6F1E7",
    fontWeight: 600,
    fontSize: 15,
    cursor: "pointer",
    marginTop: 4,
  },
  switchBtn: {
    width: "100%",
    background: "none",
    border: "none",
    color: "#2F5D50",
    fontWeight: 600,
    fontSize: 13,
    marginTop: 16,
    cursor: "pointer",
    padding: 0,
  },
};
