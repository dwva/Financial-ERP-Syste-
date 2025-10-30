import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8087,
    proxy: {
      '/upload': {
        target: 'http://localhost:3002', // Changed from 3001 to 3002
        changeOrigin: true,
      },
      '/file': {
        target: 'http://localhost:3002', // Changed from 3001 to 3002
        changeOrigin: true,
      },
      '/message-attachments': {
        target: 'http://localhost:3002', // Changed from 3001 to 3002
        changeOrigin: true,
      }
    }
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));