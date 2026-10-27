import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: String(error?.message || "Error inesperado") };
  }

  componentDidCatch(error, info) {
    console.error("treseiscinco: error al renderizar la aplicación", error, info?.componentStack || "");
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="app-crash-shell">
        <section className="app-crash-card" role="alert">
          <img src="/brand-treseiscinco.svg" alt="treseiscinco" onError={(event) => { event.currentTarget.style.display = "none"; }} />
          <p className="app-crash-eyebrow">TRESEISCINCO</p>
          <h1>No pudimos abrir tu espacio</h1>
          <p>Tus registros no se han borrado. Recarga la aplicación para volver a intentarlo.</p>
          <button type="button" className="primary-button" onClick={() => window.location.reload()}>Recargar aplicación</button>
          <details>
            <summary>Detalles para soporte</summary>
            <code>{this.state.message}</code>
          </details>
        </section>
      </main>
    );
  }
}

const rootElement = document.getElementById("root");
if (rootElement) {
  rootElement.dataset.appMounting = "true";
  createRoot(rootElement).render(
    <React.StrictMode>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </React.StrictMode>
  );
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // La app puede seguir utilizándose aunque el navegador no admita el registro del service worker.
    });
  });
}
