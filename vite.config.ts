import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  // ExcelJS is a large, optional export/import feature and is loaded on demand.
  // Set the warning threshold just above its minified package chunk (about 930 kB).
  build: {
    chunkSizeWarningLimit: 1000,
  },
  plugins: [
    {
      name: "qed-bundle-audit",
      generateBundle(_options, bundle) {
        this.emitFile({ type: "asset", fileName: "bundle-audit.json", source: JSON.stringify(
          Object.values(bundle).filter(item => item.type === "chunk").map(item => ({
            fileName: item.fileName, isEntry: item.isEntry, imports: item.imports,
            modules: Object.keys(item.modules).map(id => id.replaceAll("\\", "/").replace(__dirname.replaceAll("\\", "/") + "/", "")),
          })), null, 2) });
      },
    },
    tailwindcss(),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "./src/shared"),
    },
  },
});
