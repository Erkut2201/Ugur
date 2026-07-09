import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(__dirname, "client");

export default defineConfig(({ mode }) => {
  const buildTarget = mode === "portal" ? "portal" : "public";
  const outDir = buildTarget === "portal" ? path.resolve(__dirname, "dist/portal") : path.resolve(__dirname, "dist/public");
  const input = buildTarget === "portal" ? path.resolve(clientRoot, "index.portal.html") : path.resolve(clientRoot, "index.public.html");

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client/src"),
        "@shared": path.resolve(__dirname, "shared"),
      },
    },
    root: clientRoot,
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: {
        input,
      },
    },
    server: {
      host: true,
      port: 5173,
      proxy: {
        "/api": {
          target: "http://localhost:3008",
          changeOrigin: true,
        },
        "/attachments": {
          target: "http://localhost:3008",
          changeOrigin: true,
        },
      },
    },
  };
});
