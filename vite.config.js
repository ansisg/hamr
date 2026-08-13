import { defineConfig } from "vite";

export default defineConfig({
  optimizeDeps: {
    exclude: ["@agnai/sentencepiece-js"],
  },
  assetsInclude: ["**/*.wasm", "**/*.model"],
  base: '/',
});
