import { createRoot, hydrateRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import { ThemeProvider } from "./contexts/ThemeContext";
import { initErrorLogging } from "./lib/error-logging";
import "./index.css";

initErrorLogging();

const rootEl = document.getElementById("root")!;
const tree = (
  <HelmetProvider>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </HelmetProvider>
);

// O HTML do react-snap é gerado em build-time com o catálogo JÁ carregado do
// banco. No navegador, o primeiro render sempre começa vazio (o fetch é async),
// então hidratar era garantia de divergência — daí os erros #418/#423.
// O snapshot continua servindo pro Google/SEO; no cliente a gente monta do zero.
createRoot(rootEl).render(tree);

