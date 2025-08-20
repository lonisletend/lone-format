import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isLib = mode === 'lib'

  return {
    plugins: [
      vue(),
      isLib ? dts({ 
        insertTypesEntry: true, 
        outDir: 'dist',
        skipDiagnostics: true // Skip TypeScript diagnostics for faster builds
      }) : undefined
    ].filter(Boolean),
    build: isLib ? {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'LoneFormat',
        fileName: 'lone-format',
        formats: ['es', 'umd']
      },
      rollupOptions: {
        external: ['vue'],
        output: {
          globals: {
            vue: 'Vue'
          }
        }
      },
      // Ensure dist directory is cleaned
      emptyOutDir: true
    } : undefined
  }
})
