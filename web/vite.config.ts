import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  test: {
    // a maioria dos testes é de funções puras; os de hook/componente pedem jsdom no próprio arquivo
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}"],
  },
});
