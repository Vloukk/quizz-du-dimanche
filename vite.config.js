import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/", 
  server: {
    historyApiFallback: true, // 📌 Ajoute cette ligne pour gérer les routes
  }
});
