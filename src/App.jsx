import React, { useEffect, useState } from "react";

const modules = [
  { icon: "▦", title: "Productos e inventario", description: "Organiza artículos, imágenes, existencias y movimientos." },
  { icon: "↗", title: "Ventas y clientes", description: "Registra ventas y conserva la información de tus clientes." },
  { icon: "◷", title: "Costos y rentabilidad", description: "Entiende cuánto cuesta vender y cuánto deja cada producto." },
  { icon: "▤", title: "Compras y gastos", description: "Registra compras y movimientos del negocio." },
  { icon: "◎", title: "Catálogo para compartir", description: "Prepara un catálogo para que tus clientes lo vean en línea." },
  { icon: "⌘", title: "Equipo y permisos", description: "Trabaja con empleados con acceso según sus responsabilidades." }
];

export default function App() {
  const [apiStatus, setApiStatus] = useState("comprobando");

  useEffect(() => {
    let active = true;
    fetch("/api/health", { headers: { Accept: "application/json" } })
      .then((response) => {
        if (!response.ok) throw new Error("Health check failed");
        return response.json();
      })
      .then((data) => {
        if (active) setApiStatus(data.status === "ok" ? "conectado" : "sin confirmar");
      })
      .catch(() => {
        if (active) setApiStatus("sin conexión");
      });
    return () => { active = false; };
  }, []);

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Treintayuno, inicio">
          <span className="brand-mark">31</span>
          <span className="brand-name">treintayuno</span>
        </a>
        <span className="environment"><span className="status-dot" /> Base inicial</span>
      </header>

      <section className="hero">
        <p className="eyebrow">UN LUGAR PARA TU NEGOCIO</p>
        <h1>Tu negocio,<br /><em>en orden.</em></h1>
        <p className="hero-copy">
          Una forma más clara de organizar productos, ventas, costos y clientes.
          Estamos preparando la base de tu espacio de trabajo.
        </p>
        <div className="hero-meta">
          <span className="health-pill">
            <span className={apiStatus === "conectado" ? "status-dot" : "status-dot muted"} />
            Servicio {apiStatus}
          </span>
          <span className="meta-separator">·</span>
          <span>Los datos del negocio aún no están conectados</span>
        </div>
      </section>

      <section className="modules" aria-labelledby="modules-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">LO ESENCIAL, EN UN SOLO LUGAR</p>
            <h2 id="modules-title">Todo empieza aquí</h2>
          </div>
          <span className="module-count">6 áreas previstas</span>
        </div>
        <div className="module-grid">
          {modules.map((module, index) => (
            <article className="module-card" key={module.title}>
              <div className="module-card-top">
                <span className="module-icon" aria-hidden="true">{module.icon}</span>
                <span className="module-number">{String(index + 1).padStart(2, "0")}</span>
              </div>
              <h3>{module.title}</h3>
              <p>{module.description}</p>
              <span className="module-state">Por configurar</span>
            </article>
          ))}
        </div>
      </section>

      <footer className="footer">
        <span>Treintayuno <span className="footer-dot">·</span> Versión inicial</span>
        <span>Sin datos de demostración</span>
      </footer>
    </main>
  );
}
