import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: {
    index: 'src/main/index.ts',
    preload: 'src/preload.ts',
  },
  bundle: true,
  platform: 'node',
  target: 'node20',
  outdir: 'dist/main',
  format: 'cjs',
  external: ['electron'],
  sourcemap: true,
})

console.log('Main process built successfully')
