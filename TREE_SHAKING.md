# 按需引入 / Tree-shaking 改造

本文档记录 `lone-format` 从「声称支持按需引入但实际不工作」到「真正支持按需引入」的改造过程，以及面向使用方的最终用法。

---

## 一、改造前的状况

### 已声明的能力

`package.json` 的 `exports` 字段声明了三个子路径：

```json
"./json-format": { "import": "./dist/components/JsonFormat/index.js" }
"./xml-format":  { "import": "./dist/components/XmlFormat/index.js" }
"./sql-format":  { "import": "./dist/components/SqlFormat/index.js" }
```

### 实际坏掉的地方

1. **子路径入口不存在**：`vite.config.ts` 用的是单入口 `src/index.ts`，所有组件被合并到 `dist/lone-format.js`，`dist/components/` 目录根本没有生成。使用方写 `import JsonFormat from 'lone-format/json-format'` 会直接 `Module not found`。
2. **缺少 `sideEffects` 字段**：保守的打包器（特别是 Webpack）默认不会做 tree-shaking。
3. **第三方依赖被内联**：`jsonpath-plus` / `fast-xml-parser` / `@xmldom/xmldom` / `xpath` / `sql-formatter` 全部打进 `lone-format.js`，导致即使顶层 tree-shaking 摇掉了组件代码，依赖也很难被一起摇掉。

---

## 二、改造方案（方案 A：多入口构建）

### 目标

让 `import JsonFormat from 'lone-format/json-format'` 真正只引入 JsonFormat 及其依赖；其余两个组件以及它们的第三方依赖完全不进入产物。

### 关键改动

#### 1. `vite.config.ts` — 拆成两个 mode

```ts
const EXTERNAL_DEPS = [
  'vue',
  'jsonpath-plus',
  'fast-xml-parser',
  '@xmldom/xmldom',
  'xpath',
  'sql-formatter',
]

export default defineConfig(({ mode }) => {
  const isLibEs = mode === 'lib' || mode === 'lib-es'
  const isLibUmd = mode === 'lib-umd'
  // ...
})
```

- **`lib-es`**：多入口 ES 构建，主入口 + 三个组件入口，第三方依赖全部 `external`
- **`lib-umd`**：单入口 UMD 构建，第三方依赖内联，`emptyOutDir: false` 不冲掉 ES 产物
- **`cssCodeSplit: false`**：所有 Vue SFC 样式合并为单个 `lone-format.css`（避免多 entry 下三个同名 `index.vue` 引起的样式资源命名冲突 `index.css`/`index2.css`/`index3.css`）
- **dts 插件**：`tsconfigPath: 'tsconfig.app.json'` + `staticImport: true`，并 `exclude` 掉 demo 用的 `main.ts`/`App.vue`

#### 2. `package.json` — 新增 `sideEffects`，调整 scripts

```json
"sideEffects": ["**/*.css", "**/*.vue"],
"scripts": {
  "build:lib": "vite build --mode lib-es && vite build --mode lib-umd",
  "build:lib:full": "vue-tsc -b && vite build --mode lib-es && vite build --mode lib-umd"
}
```

`sideEffects` 告诉打包器：除 CSS 和 Vue 文件外，其余 JS 模块无副作用，可以安全 tree-shaking。

---

## 三、改造过程中踩过的坑

记录一下，避免后续翻车。

### 坑 1：`preserveModules: true` + Vue SFC

`preserveModules` 会让产物完全镜像源码目录，听起来很美好，但跟 `@vitejs/plugin-vue` 配合时：

- 每个 `.vue` 文件被拆成多个虚拟模块（template / script / style）
- 输出为 `index.vue.js` + `index.vue2.js` 这种丑陋的命名
- 纯重导出的 `index.ts`（例如 `export { default } from './index.vue'`）被 Rollup 优化消除，导致 `dist/components/JsonFormat/index.js` 根本没生成

**结论**：放弃 `preserveModules`，改用多入口（每个组件一个 `lib.entry`）。

### 坑 2：CSS 资源命名冲突

多入口下，三个组件的 SFC 都是 `index.vue`，CSS 资源名（asset.name）都是 "index"，Rollup 自动后缀消歧得到 `index.css` / `index2.css` / `index3.css`，无法稳定映射回组件路径。

尝试过 `manualChunks` 给每个组件分配命名 chunk，但 Rollup 的启发式不总按预期 inline / split，最后 CSS 仍命名混乱。

**结论**：`cssCodeSplit: false`，所有样式合并为单个 `lone-format.css`，使用方一次性引入。多余的样式（~11 KB / gzip ~2 KB）可忽略。

### 坑 3：`vite-plugin-dts` 在 v4 的选项变化

之前用的 `skipDiagnostics: true` + `insertTypesEntry: true` 在 v4 下行为不一致：

- `dist/lone-format.d.ts` 被生成成空的 `export {}`
- 一旦换 mode，所有 `.d.ts` 全变成空文件

**结论**：改用 `tsconfigPath: 'tsconfig.app.json'` + `staticImport: true`，并 `exclude` 掉 demo 文件。生成的 `.d.ts` 镜像源码结构，每个文件都有真实内容。

---

## 四、最终产物结构

```
dist/
├── lone-format.js              # ESM 主入口  (0.40 kB)
├── lone-format.umd.cjs         # UMD bundle (570 kB，含第三方依赖)
├── lone-format.css             # 合并样式    (11 kB)
├── index.d.ts                  # 主入口类型
├── components/
│   ├── JsonFormat/
│   │   ├── index.js            # 子入口  (0.09 kB)
│   │   ├── index.d.ts          # 子入口类型
│   │   ├── index.vue.d.ts
│   │   ├── JsonNode.vue.d.ts
│   │   ├── themes.d.ts
│   │   └── types.d.ts
│   ├── XmlFormat/...
│   └── SqlFormat/...
└── _chunks/                    # 各组件的实际代码
    ├── index-{hash}.js         # JsonFormat (27 kB)
    ├── index-{hash}.js         # SqlFormat  (29 kB)
    └── index-{hash}.js         # XmlFormat  (66 kB)
```

第三方依赖在 ESM 产物中完全 `external`，仅 UMD 中内联。

---

## 五、使用方法

### 安装

```bash
npm install lone-format
# 同时需要安装 peerDependency
npm install vue@^3
```

第三方依赖（`jsonpath-plus`、`fast-xml-parser`、`@xmldom/xmldom`、`xpath`、`sql-formatter`）是 `lone-format` 自身的 `dependencies`，npm install 时会自动装上，不需要使用方再单独装。

### 引入样式（任选其一，必须引入一次）

```ts
import 'lone-format/style.css'
// 或
import 'lone-format/lone-format.css'
```

### 用法 1：按需引入（推荐）

```ts
import JsonFormat from 'lone-format/json-format'
import XmlFormat  from 'lone-format/xml-format'
import SqlFormat  from 'lone-format/sql-format'

// 类型也会自动从对应子路径推断
import type { SqlDialect, SqlFormatOptions } from 'lone-format/sql-format'
```

**实际拉取的依赖**：

| 写法 | 拉取的代码 |
|------|------|
| `lone-format/json-format` | vue + **jsonpath-plus** |
| `lone-format/xml-format`  | vue + **fast-xml-parser** + **@xmldom/xmldom** + **xpath** |
| `lone-format/sql-format`  | vue + **sql-formatter** |

其余组件代码和它们的第三方依赖完全不会进入产物。

### 用法 2：顶层具名引入（依赖 tree-shaking）

```ts
import { JsonFormat, SqlFormat } from 'lone-format'
```

打包器（Vite / Webpack 5+ / Rollup）配合 `sideEffects` 字段会自动摇掉未使用的组件。效果通常与用法 1 接近，但要求打包器配置正确。如果想要确定性更强的按需，仍推荐用法 1。

### 用法 3：全局注册

```ts
import { createApp } from 'vue'
import LoneFormat from 'lone-format'
import 'lone-format/style.css'

const app = createApp(App)
app.use(LoneFormat)
```

注意：只有 `JsonFormat` 会通过 `app.use(LoneFormat)` 自动全局注册。其余组件请手动 `app.component('XmlFormat', XmlFormat)` 注册，或直接局部 `import` 使用。

### 用法 4：浏览器 `<script>` 直接使用（UMD）

```html
<link rel="stylesheet" href="https://unpkg.com/lone-format/dist/lone-format.css">
<script src="https://unpkg.com/vue@3"></script>
<script src="https://unpkg.com/lone-format/dist/lone-format.umd.cjs"></script>
<script>
  const { JsonFormat, XmlFormat, SqlFormat } = window.LoneFormat
</script>
```

UMD 包内联了所有第三方依赖，单文件即可使用（570 KB / gzip 156 KB）。

---

## 六、打包命令速查

```bash
# 开发
npm run dev              # demo 应用
npm run docs:dev         # VitePress 文档

# 库打包
npm run build:lib        # ES 多入口 + UMD（生产可用）
npm run build:lib:full   # 先跑 vue-tsc 类型检查再打包（发布前推荐）

# 验证
npm run publish:dry      # 预演 npm publish，确认 files / exports 配置
```

`build:lib` 内部会按顺序执行两次 vite build：

1. `vite build --mode lib-es` — 清空 dist，生成 ESM 多入口产物 + `.d.ts`
2. `vite build --mode lib-umd` — `emptyOutDir: false` 追加 UMD bundle 和单文件 CSS
