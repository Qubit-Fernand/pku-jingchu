import vinext from 'vinext'
import { defineConfig } from 'vite'
import { sites } from './build/sites-vite-plugin'

export default defineConfig(async () => {
  process.env.WRANGLER_WRITE_LOGS ??= 'false'
  process.env.WRANGLER_LOG_PATH ??= '.wrangler/logs'
  process.env.MINIFLARE_REGISTRY_PATH ??= '.wrangler/registry'

  const { cloudflare } = await import('@cloudflare/vite-plugin')

  return {
    build: {
      // `react-notion-x` brings in the Node-only PDF renderer transitively.
      // PDF.js loads this optional module only when that renderer is used, so
      // keep it external rather than trying to bundle a native Canvas module
      // into the Worker.
      rolldownOptions: {
        external: ['canvas']
      }
    },
    plugins: [
      vinext(),
      sites(),
      cloudflare()
    ]
  }
})
