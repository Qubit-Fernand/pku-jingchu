import { access, cp, mkdir, readdir, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'

async function exists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false
    }
    throw error
  }
}

export function sites(): Plugin {
  let root = process.cwd()

  return {
    name: 'sites',
    apply: 'build',
    configResolved(config) {
      root = config.root
    },
    async closeBundle() {
      const outputDirectory = resolve(root, 'dist', '.openai')
      const hostingConfig = resolve(root, '.openai', 'hosting.json')
      const drizzleSource = resolve(root, 'drizzle')

      await rm(outputDirectory, { recursive: true, force: true })
      await mkdir(outputDirectory, { recursive: true })

      if (await exists(hostingConfig)) {
        await cp(hostingConfig, resolve(outputDirectory, 'hosting.json'))
      }
      if (await exists(drizzleSource)) {
        await cp(drizzleSource, resolve(outputDirectory, 'drizzle'), {
          recursive: true
        })
      }

      // With the Cloudflare Vite plugin, vinext emits the Worker entry as
      // `dist/<worker-name>/index.js`. Sites packages server code from the
      // standard vinext location, so provide that entry point as well.
      const serverEntry = resolve(root, 'dist', 'server', 'index.js')
      if (!(await exists(serverEntry))) {
        const entries = await readdir(resolve(root, 'dist'), {
          withFileTypes: true
        })
        const workerEntries = entries
          .filter((entry) => entry.isDirectory())
          .map((entry) => resolve(root, 'dist', entry.name, 'index.js'))
        const workerEntry = (
          await Promise.all(
            workerEntries.map(async (entry) =>
              (await exists(entry)) ? entry : undefined
            )
          )
        ).find((entry): entry is string => entry !== undefined)

        if (workerEntry) {
          await mkdir(resolve(root, 'dist', 'server'), { recursive: true })
          await cp(workerEntry, serverEntry)
        }
      }
    }
  }
}
