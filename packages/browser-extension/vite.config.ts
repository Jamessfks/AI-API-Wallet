import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import fs from 'node:fs'

// Copy static files to dist after build
function copyExtensionFiles() {
  return {
    name: 'copy-extension-files',
    closeBundle() {
      const dist = resolve(__dirname, 'dist')

      // Copy manifest with updated paths
      const manifest = JSON.parse(fs.readFileSync(resolve(__dirname, 'manifest.json'), 'utf8'))
      manifest.background.service_worker = 'background/service-worker.js'
      manifest.content_scripts[0].js = ['content/detector.js']
      manifest.content_scripts[0].css = ['content/overlay.css']
      manifest.action.default_popup = 'popup/popup.html'
      fs.writeFileSync(resolve(dist, 'manifest.json'), JSON.stringify(manifest, null, 2))

      // Copy icons
      const iconsDir = resolve(__dirname, 'icons')
      if (fs.existsSync(iconsDir)) {
        fs.mkdirSync(resolve(dist, 'icons'), { recursive: true })
        for (const file of fs.readdirSync(iconsDir)) {
          fs.copyFileSync(resolve(iconsDir, file), resolve(dist, 'icons', file))
        }
      }

      // Copy CSS
      fs.mkdirSync(resolve(dist, 'content'), { recursive: true })
      fs.copyFileSync(
        resolve(__dirname, 'src/content/overlay.css'),
        resolve(dist, 'content/overlay.css'),
      )

      // Copy popup
      fs.mkdirSync(resolve(dist, 'popup'), { recursive: true })
      fs.copyFileSync(
        resolve(__dirname, 'src/popup/popup.html'),
        resolve(dist, 'popup/popup.html'),
      )
      fs.copyFileSync(
        resolve(__dirname, 'src/popup/popup.js'),
        resolve(dist, 'popup/popup.js'),
      )
    },
  }
}

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        'background/service-worker': resolve(__dirname, 'src/background/service-worker.ts'),
        'content/detector': resolve(__dirname, 'src/content/detector.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'shared/[name].js',
        format: 'es',
      },
    },
  },
  plugins: [copyExtensionFiles()],
})
