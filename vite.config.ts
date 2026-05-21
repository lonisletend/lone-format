import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

// 第三方依赖：ES 多入口构建时全部 external，避免每个子入口都内联拷贝
const EXTERNAL_DEPS = [
  'vue',
  'jsonpath-plus',
  'fast-xml-parser',
  '@xmldom/xmldom',
  'xpath',
  'sql-formatter',
]

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // mode = 'lib' / 'lib-es' → 多入口 ES 构建（默认 lib 等同 lib-es）
  // mode = 'lib-umd'       → 单入口 UMD 构建（追加到现有 dist）
  const isLibEs = mode === 'lib' || mode === 'lib-es'
  const isLibUmd = mode === 'lib-umd'
  const isLib = isLibEs || isLibUmd

  return {
    plugins: [
      vue(),
      isLibEs
        ? dts({
            outDir: 'dist',
            tsconfigPath: 'tsconfig.app.json',
            staticImport: true,
            // 仅 demo 使用的 main.ts / App.vue 不进入产物
            exclude: ['src/main.ts', 'src/App.vue'],
          })
        : undefined,
    ].filter(Boolean),
    build: !isLib
      ? undefined
      : isLibUmd
      ? {
          // UMD 单 bundle（含第三方依赖，方便 <script> 直接使用），保留遗留 require 兼容
          lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'LoneFormat',
            fileName: 'lone-format',
            formats: ['umd'],
          },
          rollupOptions: {
            external: ['vue'],
            output: {
              globals: { vue: 'Vue' },
              exports: 'named',
            },
          },
          emptyOutDir: false, // 保留前一次 ES 构建产物
        }
      : {
          // ES 多入口：每个组件一个独立入口，第三方依赖 external，第三方代码不打入产物
          lib: {
            entry: {
              'lone-format': resolve(__dirname, 'src/index.ts'),
              'components/JsonFormat/index': resolve(
                __dirname,
                'src/components/JsonFormat/index.ts'
              ),
              'components/XmlFormat/index': resolve(
                __dirname,
                'src/components/XmlFormat/index.ts'
              ),
              'components/SqlFormat/index': resolve(
                __dirname,
                'src/components/SqlFormat/index.ts'
              ),
            },
            formats: ['es'],
          },
          rollupOptions: {
            external: EXTERNAL_DEPS,
            output: {
              entryFileNames: '[name].js',
              chunkFileNames: '_chunks/[name]-[hash].js',
              // 所有样式合并为单个 lone-format.css（与 UMD 一致，使用方只需一次引入）
              assetFileNames: (assetInfo) => {
                if (assetInfo.name && assetInfo.name.endsWith('.css')) {
                  return 'lone-format.css'
                }
                return 'assets/[name][extname]'
              },
            },
          },
          // 单一 CSS 产出：避免多 entry 下 Vue SFC 同名 .vue 引起的 index/index2/index3 命名冲突
          cssCodeSplit: false,
          emptyOutDir: true,
        },
  }
})
