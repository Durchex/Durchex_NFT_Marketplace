import { defineConfig } from "vite";
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  define: {
    global: "window", // Fix for certain libraries expecting `global`
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
  },
  resolve: {
    alias: {
      buffer: "buffer", // Ensures buffer works in the browser
    },
  },
  optimizeDeps: {
    include: ["buffer"],
  },
});



// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react-swc'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })


// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import path from 'path'

// export default defineConfig({
//   plugins: [react()],
//   resolve: {
//     alias: {
//       '@': path.resolve( './src'),
//     },
//   },
// })