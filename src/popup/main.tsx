import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { applyTheme, rememberedTheme } from "@/lib/themes";
import { installLiquidPointer } from "@/lib/liquid";
import "@/index.css";

// Paint in the last saved theme immediately (settings arrive a moment later).
applyTheme(rememberedTheme());
installLiquidPointer();

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
