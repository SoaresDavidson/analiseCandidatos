import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// base relativa: o build funciona servido de qualquer subcaminho.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
});
