import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    // Polyfill for wallet-adapter and @solana/web3.js in browser
    'process.env': {},
    global: 'globalThis',
  },
  optimizeDeps: {
    // Pre-bundle these to avoid CJS interop issues
    include: [
      '@solana/wallet-adapter-react',
      '@solana/wallet-adapter-react-ui',
      '@solana/wallet-adapter-base',
      '@solana/web3.js',
    ],
  },
})
