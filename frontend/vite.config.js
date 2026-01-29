import { defineConfig } from "vite";
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  define: {
    global: "globalThis",
    "process.env": {},
  },
  optimizeDeps: {
    include: ['@taquito/taquito', '@taquito/local-forging'],
  },
  build: {
    rollupOptions: {
      // Externalize optional Tezos deps so build succeeds if they fail to resolve
      external: ['@taquito/taquito', '@taquito/local-forging'],
    },
  },
});