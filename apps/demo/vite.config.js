import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["snarkjs", "circomlibjs", "@solana/web3.js"],
  },
  define: {
    // Polyfill for wallet-adapter, @solana/web3.js, snarkjs, and circomlibjs in browser
    "process.env": {},
    global: "globalThis",
  },
  optimizeDeps: {
    include: [
      "@solana/wallet-adapter-react",
      "@solana/wallet-adapter-react-ui",
      "@solana/wallet-adapter-base",
      "@solana/web3.js",
      "snarkjs",
      "circomlibjs",
    ],
    esbuildOptions: {
      define: { global: "globalThis" },
    },
  },
  build: {
    target: "esnext",
    commonjsOptions: {
      include: [/snarkjs/, /circomlibjs/, /node_modules/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks: {
          zk: ["snarkjs", "circomlibjs"],
        },
      },
    },
  },
});
