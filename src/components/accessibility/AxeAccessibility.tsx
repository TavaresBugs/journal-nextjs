"use client";

import React from "react";

/**
 * AxeAccessibility - Componente que inicializa axe-core em desenvolvimento
 * Mostra violações de acessibilidade no console do navegador
 */
export function AxeAccessibility() {
  React.useEffect(() => {
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      import("@axe-core/react").then((axe) => {
        import("react-dom").then((ReactDOM) => {
          axe.default(React, ReactDOM, 1000);
          console.log("🔍 axe-core initialized - accessibility violations will appear in console");
        });
      });
    }
  }, []);

  return null;
}
