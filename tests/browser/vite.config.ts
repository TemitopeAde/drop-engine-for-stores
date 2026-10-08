import { defineConfig } from "vite";
export default defineConfig({
  esbuild: { jsx: "automatic" },
  root: new URL(".", import.meta.url).pathname,
  resolve: {
    alias: {
      "@wix/essentials": new URL("./essentials.ts", import.meta.url).pathname,
    },
  },
  server: { host: "127.0.0.1", port: 5177, strictPort: true },
});
