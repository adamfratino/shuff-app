import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@shuff/core": path.resolve(
        __dirname,
        "../../packages/core/src/index.ts",
      ),
      "@shuff/diagram": path.resolve(
        __dirname,
        "../../packages/diagram/src/index.ts",
      ),
    },
  },
});
