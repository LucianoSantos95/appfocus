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

// When react-snap pre-renders the page, #root already has children.
// In that case we hydrate; otherwise we mount normally.
if (rootEl.hasChildNodes()) {
  hydrateRoot(rootEl, tree);
} else {
  createRoot(rootEl).render(tree);
}

