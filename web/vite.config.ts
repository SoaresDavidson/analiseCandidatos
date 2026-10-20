import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { createReadStream, existsSync } from 'node:fs'
import { join, normalize } from 'node:path'
import { defineConfig, type Connect, type Plugin } from 'vite'

// As fotos dos eleitos ficam fora do app, em docs/candidatos-painel/fotos (baixadas do
// TSE pelo scripts/servir_painel.py e fora do git). No dev e no preview, /fotos/... lê de lá.
const PASTA_FOTOS = join(import.meta.dirname, '../docs/candidatos-painel/fotos')

function servirFotos(): Plugin {
  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    const caminho = normalize(decodeURIComponent((req.url ?? '').split('?')[0]))
    const arquivo = join(PASTA_FOTOS, caminho)
    if (!/^\/\d{4}\/\d+\.jpg$/.test(caminho) || !existsSync(arquivo)) return next()
    res.setHeader('Content-Type', 'image/jpeg')
    createReadStream(arquivo).pipe(res)
  }
  return {
    name: 'servir-fotos',
    configureServer: server => { server.middlewares.use('/fotos', middleware) },
    configurePreviewServer: server => { server.middlewares.use('/fotos', middleware) },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), servirFotos()],
})
