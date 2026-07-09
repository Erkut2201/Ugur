import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient.js";
import AppPublic from "./AppPublic.js";
import { LanguageProvider } from "./public/i18n/LanguageProvider.js";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AppPublic />
      </LanguageProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
