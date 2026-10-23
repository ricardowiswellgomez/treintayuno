import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "./lib/supabase.js";

const areas = [
  { icon: "▦", title: "Productos e inventario", description: "Productos, fotos, precios y existencias." },
  { icon: "↗", title: "Ventas y clientes", description: "Ventas, clientes y pagos registrados." },
  { icon: "◷", title: "Costos y rentabilidad", description: "Costos, margen y utilidad de tu negocio." },
  { icon: "▤", title: "Compras y gastos", description: "Compras, proveedores y gastos." },
  { icon: "◎", title: "Catálogo para compartir", description: "Un catálogo público para tus clientes." },
  { icon: "⌘", title: "Equipo y permisos", description: "Accesos para empleados según su función." }
];

function friendlyError(error) {
  const message = error?.message || "Ocurrió un error. Inténtalo de nuevo.";
  if (/invalid login credentials/i.test(message)) return "El correo o la contraseña no coinciden.";
  if (/email not confirmed/i.test(message)) return "Confirma tu correo antes de iniciar sesión.";
  if (/user already registered/i.test(message)) return "Ese correo ya tiene una cuenta. Inicia sesión.";
  if (/password should be at least/i.test(message)) return "Usa una contraseña de al menos 6 caracteres.";
  if (/failed to fetch|network/i.test(message)) return "No pudimos conectar con el servicio. Revisa tu conexión e inténtalo otra vez.";
  return message;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [mode, setMode] = useState("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businesses, setBusinesses] = useState([]);
  const [activeBusiness, setActiveBusiness] = useState(null);
  const [screen, setScreen] = useState("home");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadBusinesses = useCallback(async (userId) => {
    const { data, error: queryError } = await supabase
      .from("business_members")
      .select("business_id, role, businesses(id, name, logo_path, theme, currency_code)")
      .eq("user_id", userId);
    if (queryError) throw queryError;
    const list = (data || []).map((row) => ({ ...row.businesses, role: row.role })).filter((b) => b?.id);
    setBusinesses(list);
    setActiveBusiness((current) => list.find((b) => b.id === current?.id) || list[0] || null);
    setScreen(list.length ? "home" : "setup");
    return list;
  }, []);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      if (!alive) return;
      setSession(currentSession);
      if (currentSession?.user) {
        try { await loadBusinesses(currentSession.user.id); }
        catch (e) { if (alive) setError(friendlyError(e)); }
      }
      if (alive) setAuthReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      if (!currentSession) {
        setBusinesses([]);
        setActiveBusiness(null);
        setScreen("home");
      } else {
        // Avoid issuing Supabase queries inside the auth callback.
        queueMicrotask(() => loadBusinesses(currentSession.user.id).catch((e) => setError(friendlyError(e))));
      }
    });
    return () => { alive = false; subscription.unsubscribe(); };
  }, [loadBusinesses]);

  async function submitAuth(event) {
    event.preventDefault();
    setBusy(true); setError(""); setNotice("");
    try {
      if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { display_name: fullName.trim() },
            emailRedirectTo: window.location.origin
          }
        });
        if (authError) throw authError;
        if (!data.session) {
          setNotice("¡Cuenta creada! Revisa tu correo y confirma la dirección antes de entrar.");
        } else {
          setSession(data.session);
          setNotice("Cuenta creada. Ahora registra tu negocio.");
        }
      } else {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(), password
        });
        if (authError) throw authError;
        setSession(data.session);
        await loadBusinesses(data.user.id);
      }
    } catch (e) { setError(friendlyError(e)); }
    finally { setBusy(false); }
  }

  async function createBusiness(event) {
    event.preventDefault();
    if (!session?.user) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const id = crypto.randomUUID();
      const { error: insertError } = await supabase.from("businesses").insert({
        id,
        owner_user_id: session.user.id,
        name: businessName.trim(),
        country_code: "CO",
        currency_code: "COP",
        timezone: "America/Bogota",
        theme: { primary: "#2d5947", background: "#f7f6f1" }
      });
      if (insertError) throw insertError;
      // The database creates the owner membership automatically in a trigger.
      const list = await loadBusinesses(session.user.id);
      if (!list.length) throw new Error("El negocio se guardó, pero no pudimos confirmar tus permisos. Actualiza la página antes de volver a intentarlo.");
      setBusinessName("");
      setNotice("Tu espacio de trabajo está listo.");
    } catch (e) { setError(friendlyError(e)); }
    finally { setBusy(false); }
  }

  async function signOut() {
    setBusy(true); setError("");
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) setError(friendlyError(signOutError));
    setBusy(false);
  }

  if (!authReady) return <div className="loading-screen"><div className="brand-mark">31</div><p>Preparando tu espacio…</p></div>;

  if (!session) return (
    <main className="auth-shell">
      <section className="auth-brand-panel">
        <a className="brand" href="/"><span className="brand-mark">31</span><span className="brand-name">treintayuno</span></a>
        <div className="auth-pitch">
          <p className="eyebrow">TU NEGOCIO, CON CLARIDAD</p>
          <h1>Menos enredos.<br /><em>Más negocio.</em></h1>
          <p>Productos, ventas, costos y clientes en un solo lugar, fácil de entender y usar.</p>
        </div>
        <span className="panel-footnote">Un espacio independiente para cada negocio.</span>
      </section>
      <section className="auth-form-panel">
        <div className="auth-form-wrap">
          <p className="eyebrow">{mode === "signup" ? "EMPIEZA GRATIS" : "QUÉ BUENO VERTE"}</p>
          <h2>{mode === "signup" ? "Crea tu cuenta" : "Inicia sesión"}</h2>
          <p className="form-intro">{mode === "signup" ? "Primero creamos tu acceso. Después podrás registrar tu negocio." : "Entra para continuar con tu negocio."}</p>
          <form onSubmit={submitAuth} className="form-stack">
            {mode === "signup" && <label>Tu nombre<input autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="¿Cómo te llamas?" required maxLength={120} /></label>}
            <label>Correo electrónico<input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" required /></label>
            <label>Contraseña<input type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" minLength={6} required /></label>
            {error && <p className="message error" role="alert">{error}</p>}
            {notice && <p className="message success" role="status">{notice}</p>}
            <button className="primary-button" disabled={busy}>{busy ? "Un momento…" : mode === "signup" ? "Crear mi cuenta" : "Entrar"}</button>
          </form>
          <p className="switch-mode">{mode === "signup" ? "¿Ya tienes cuenta?" : "¿Primera vez por aquí?"} <button className="text-button" onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(""); setNotice(""); }}>{mode === "signup" ? "Inicia sesión" : "Crear cuenta"}</button></p>
          <p className="privacy-note">Tu información pertenece a tu negocio. No uses datos reales de clientes hasta completar las pruebas de seguridad.</p>
        </div>
      </section>
    </main>
  );

  if (!businesses.length || screen === "setup") return (
    <main className="setup-shell">
      <header className="topbar"><a className="brand" href="/"><span className="brand-mark">31</span><span className="brand-name">treintayuno</span></a><button className="text-button" onClick={signOut}>Cerrar sesión</button></header>
      <section className="setup-card">
        <p className="eyebrow">PASO 1 DE 1</p>
        <h1>¿Cómo se llama<br /><em>tu negocio?</em></h1>
        <p>Este nombre identifica tu espacio. Más adelante podrás configurar tu logo, colores y equipo.</p>
        <form className="form-stack" onSubmit={createBusiness}>
          <label>Nombre del negocio<input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Ej. Mi tienda" maxLength={120} required autoFocus /></label>
          {error && <p className="message error" role="alert">{error}</p>}
          {notice && <p className="message success" role="status">{notice}</p>}
          <button className="primary-button" disabled={busy}>{busy ? "Creando espacio…" : "Crear mi espacio"}</button>
        </form>
        <p className="privacy-note">Cada negocio tiene sus propios datos y permisos.</p>
      </section>
    </main>
  );

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/"><span className="brand-mark">31</span><span className="brand-name">treintayuno</span></a>
        <div className="business-switcher"><span className="business-avatar">{(activeBusiness?.name || "T").slice(0,1).toUpperCase()}</span><span className="business-name">{activeBusiness?.name}</span><span className="switch-caret">⌄</span></div>
        <p className="nav-label">TU NEGOCIO</p>
        <nav className="nav-list">
          <button className={screen === "home" ? "nav-item active" : "nav-item"} onClick={() => setScreen("home")}><span>⌂</span> Resumen</button>
          {areas.map((area) => <button key={area.title} className="nav-item" onClick={() => setNotice("Esta sección se construirá sobre la base segura que acabamos de preparar.")}><span>{area.icon}</span>{area.title}</button>)}
        </nav>
        <div className="sidebar-bottom"><div className="user-chip"><span className="user-avatar">{(session.user.email || "U").slice(0,1).toUpperCase()}</span><span className="user-email">{session.user.email}</span></div><button className="logout-button" onClick={signOut} disabled={busy}>Cerrar sesión</button></div>
      </aside>
      <section className="main-content">
        <header className="main-header"><div><p className="eyebrow">TU ESPACIO DE TRABAJO</p><h1>{activeBusiness?.name || "Mi negocio"}</h1></div><span className="role-pill">{activeBusiness?.role === "owner" ? "Propietario" : activeBusiness?.role === "admin" ? "Administrador" : "Empleado"}</span></header>
        {error && <p className="message error" role="alert">{error}</p>}
        {notice && <p className="message success" role="status">{notice}<button className="dismiss-button" onClick={() => setNotice("")}>Cerrar</button></p>}
        <section className="welcome-card"><div><p className="eyebrow">BIENVENIDO A TREINTAYUNO</p><h2>Vamos a poner tu negocio en orden.</h2><p>Tu espacio privado ya existe. Empieza cuando quieras: todavía no hay productos ni movimientos registrados.</p></div><div className="welcome-symbol">31</div></section>
        <div className="section-title-row"><div><h2>Tu negocio, por partes</h2><p>Todo estará en su lugar y con permisos claros.</p></div><span className="count-label">6 áreas</span></div>
        <section className="area-grid">{areas.map((area, index) => <article className="area-card" key={area.title}><div className="area-card-top"><span className="area-icon">{area.icon}</span><span className="area-number">{String(index + 1).padStart(2,"0")}</span></div><h3>{area.title}</h3><p>{area.description}</p><span className="coming-soon">En preparación</span></article>)}</section>
        <footer className="app-footer"><span>Treintayuno · Base inicial</span><span>Los datos se separan por negocio.</span></footer>
      </section>
    </main>
  );
}
