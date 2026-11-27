# lone-format

**面向 Vue 3 的 JSON、XML 与 SQL 查看组件。**

将源码字符串渲染为带语法高亮、可折叠的结构视图。通过组件 ref 接入你自己的工具栏，完成查看、过滤、排序、复制与源码改写。

[English](./README.md) · **简体中文**

[安装](#installation) · [JSON](#jsonformat) · [XML](#xmlformat) · [SQL](#sqlformat) · [事件](#events) · [主题](#themes) · [接入须知](#integration-notes) · [本地开发](#development)

## 功能概览

| 组件 | 视图 | 查询方式 | 其他操作 |
| --- | --- | --- | --- |
| `JsonFormat` | 可折叠的对象与数组 | JSONPath / JavaScript 表达式 | 编辑键和值、键名排序、保留数字原始文本 |
| `XmlFormat` | 可折叠的元素与属性 | XPath | 编辑 XML 节点、属性与元素排序、源码格式化 |
| `SqlFormat` | 可折叠的子句、嵌套查询及 INSERT 值元组 | — | 按 SQL 方言格式化、源码压缩 |

三个组件都通过 `v-model` 接收**字符串**，支持五种内置主题，并暴露复制、展开和折叠方法。组件本身不包含演示工作台的工具栏和源码编辑器，由接入方自行组合。

<a id="installation"></a>

## 安装

在已有 Vue 3 项目中安装：

```bash
npm install lone-format
```

在应用入口等位置**引入一次样式**：

```ts
import 'lone-format/style.css'
```

可以使用具名导入：

```ts
import { JsonFormat, XmlFormat, SqlFormat } from 'lone-format'
```

也可以通过独立的 ES 模块入口，按格式导入：

```ts
import JsonFormat from 'lone-format/json-format'
import XmlFormat from 'lone-format/xml-format'
import SqlFormat from 'lone-format/sql-format'
```

两种导入方式都需要上述样式。Vue 是 peer dependency，不会打包进组件库。

## JsonFormat

### 使用示例

下面是包含 JSONPath 过滤与自定义工具栏的完整单文件组件：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { JsonFormat } from 'lone-format'

const viewer = ref<InstanceType<typeof JsonFormat> | null>(null)
const source = ref(`{
  "users": [
    { "id": 1, "name": "Alex", "active": true },
    { "id": 2, "name": "Sam", "active": false }
  ],
  "largeId": 12345678901234567890,
  "amount": 12.3400
}`)
const message = ref('')

function filterActive() {
  viewer.value?.filter({
    type: 'jsonpath',
    expression: '$.users[?(@.active == true)]',
  })
  message.value = viewer.value?.getFilterError() || ''
}
</script>

<template>
  <div>
    <textarea v-model="source" aria-label="JSON 源码" rows="8" />
    <div>
      <button @click="viewer?.expandAll()">展开</button>
      <button @click="viewer?.collapseAll()">折叠</button>
      <button @click="filterActive">活跃用户</button>
      <button @click="viewer?.clearFilter()">清除过滤</button>
      <button @click="viewer?.sortKeys()">键名排序</button>
      <button @click="viewer?.clearSortKeys()">取消排序</button>
      <button @click="viewer?.compressSource()">压缩当前视图到源码</button>
      <button @click="viewer?.copyJson()">复制当前视图</button>
    </div>
    <JsonFormat
      ref="viewer"
      v-model="source"
      theme="github-light"
      :readonly="false"
      @copy-success="message = '已复制'"
      @copy-error="message = $event.message"
    />
    <p role="status">{{ message }}</p>
  </div>
</template>
```

JavaScript 过滤使用 **`$`** 表示根数据，而不是 `data`。对同一个组件 ref：

```ts
viewer.value?.filter({
  type: 'js',
  expression: '$.users.filter(user => user.active)',
})
```

> JavaScript 过滤通过 `new Function` 执行，**不是沙箱**。只运行可信表达式，不要允许不可信输入使用此模式。禁止动态代码执行的 Content Security Policy 会阻止该模式运行。

### Props 选项

| 属性 | 类型 | 默认值 | 实际行为 |
| --- | --- | --- | --- |
| `modelValue` / `v-model` | `string` | `''` | JSON 源码。保留原始字符串输入，才能保留大整数和小数尾随零。 |
| `theme` | `ThemeType` | `'github-light'` | 内置语法主题。 |
| `readonly` | `boolean` | `false` | 阻止键和值的更新，但不会禁用暴露的源码操作，也不会隐藏所有编辑控件。 |
| `maxDepth` | `number` | `10` | 已声明，但当前渲染逻辑未执行深度限制。 |

### 实例方法

在组件挂载后通过 ref 调用。未单独注明的方法返回 `void`。

| 方法 | 说明 / 返回值 |
| --- | --- |
| `copyJson()` | `Promise<void>` — 复制格式化后的**当前视图**，包含过滤和键名排序结果。 |
| `compressSource()` | 将**当前视图**压缩后写回 `v-model`，触发 `compress`。如需保留原始数据集与顺序，应先清除过滤和排序。 |
| `expandAll()` | 展开当前树。 |
| `collapseAll()` | 折叠当前树。 |
| `toggleExpand(path: string)` | 切换指定路径的展开状态。路径可从 `getExpandedNodes()` 获取。 |
| `updateValue(path: string, value: any)` | 更新原始数据并发出新源码，例如 `updateValue('users.0.name', 'Taylor')`。 |
| `updateKey(path: string, newKey: string)` | 重命名对象键，例如 `updateKey('users.0.name', 'displayName')`。 |
| `filter(config: { type: 'jsonpath' \| 'js'; expression: string })` | 过滤视图，不修改源码。空表达式会清除过滤。 |
| `clearFilter()` | 恢复未过滤的视图，并清除过滤错误。 |
| `sortKeys()` | 对视图中的对象键递归排序，保留数组顺序。 |
| `clearSortKeys()` | 取消视图排序。 |
| `isSorted()` | `boolean` — 是否启用了键名排序。 |
| `isValidJson()` | `boolean` — 当前是否没有解析错误。 |
| `getParsedJson()` | `any` — 原始解析结果，可能包含数字保护对象。 |
| `getFilteredJson()` | `any` — 过滤结果；`null` 也表示没有活动结果。 |
| `getExpandedNodes()` | `Set<string>` — 当前展开路径集合。请将返回集合视为只读。 |
| `getParseError()` | `string` — 解析错误，无错误时为 `''`。 |
| `getFilterError()` | `string` — 过滤错误，无错误时为 `''`。 |
| `parseJson(source: string)` | 只更新内部解析状态，不更新 `v-model`。通常应直接修改绑定的源码。 |
| `copyValue(value: any)` | `Promise<void>` — 按 `getValue()` 的规则复制单个值。失败仅记录日志，此辅助方法不触发复制事件。 |
| `getValue(value: any)` | `string` — 单个值的显示/复制文本，不是整份 JSON 的序列化接口。 |

**数字处理。** 转为 JavaScript `Number` 后文本会变化的数字，会在内部保存为保护对象，包括大整数和 `12.3400` 等。请保留原始字符串输入：传入组件前已经丢失的精度无法恢复。整份文档输出优先使用 `copyJson()` / `compressSource()`；`JSON.stringify(getParsedJson())` 和 `getValue(object)` 没有同样的数字保护序列化能力。JavaScript 过滤中的算术仍遵循 JavaScript 数字语义。

## XmlFormat

### 使用示例

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { XmlFormat } from 'lone-format'

const viewer = ref<InstanceType<typeof XmlFormat> | null>(null)
const source = ref(`<catalog>
  <book id="1" available="true"><title>Vue Guide</title></book>
  <book id="2" available="false"><title>XML Guide</title></book>
</catalog>`)
const message = ref('')

function filterAvailable() {
  viewer.value?.filter({
    type: 'xpath',
    expression: '//book[@available="true"]',
  })
  message.value = viewer.value?.getFilterError() || ''
}
</script>

<template>
  <div>
    <textarea v-model="source" aria-label="XML 源码" rows="6" />
    <div>
      <button @click="viewer?.expandAll()">展开</button>
      <button @click="viewer?.collapseAll()">折叠</button>
      <button @click="filterAvailable">可用书籍</button>
      <button @click="viewer?.clearFilter()">清除过滤</button>
      <button @click="viewer?.sort()">视图排序</button>
      <button @click="viewer?.clearSort()">取消排序</button>
      <button @click="viewer?.formatSource()">格式化源码</button>
      <button @click="viewer?.compressSource()">压缩源码</button>
      <button @click="viewer?.copyXml()">复制当前视图</button>
    </div>
    <XmlFormat
      ref="viewer"
      v-model="source"
      theme="github-light"
      @copy-success="message = '已复制'"
      @copy-error="message = $event.message"
    />
    <p role="status">{{ message }}</p>
  </div>
</template>
```

### Props 选项

| 属性 | 类型 | 默认值 | 实际行为 |
| --- | --- | --- | --- |
| `modelValue` / `v-model` | `string` | `''` | XML 源码。 |
| `theme` | `ThemeType` | `'github-light'` | 内置语法主题。 |
| `readonly` | `boolean` | `false` | 已声明，但当前不会阻止 XML 编辑。 |
| `maxDepth` | `number` | `10` | 已声明，但当前未执行深度限制。 |
| `showComments` | `boolean` | `true` | 已声明，但当前未接入渲染逻辑。 |
| `showCdata` | `boolean` | `true` | 已声明，但当前未接入渲染逻辑。 |
| `preserveWhitespace` | `boolean` | `false` | 已声明，但当前未传入解析/格式化流程。 |

不要依赖这些已声明但未生效的选项来限制编辑或控制 XML 内容的可见性。

### 实例方法

未单独注明的方法返回 `void`。

| 方法 | 说明 / 返回值 |
| --- | --- |
| `copyXml()` | `Promise<void>` — 复制当前视图，包含 XPath 过滤和排序结果。 |
| `formatSource()` | 使用两空格缩进格式化绑定源码，触发 `update:modelValue` 和 `format`。 |
| `compressSource()` | 压缩原始解析数据，而非过滤视图，触发 `update:modelValue` 和 `compress`。 |
| `expandAll()` | 展开当前树。 |
| `collapseAll()` | 折叠当前树。 |
| `toggleExpand(path: string)` | 切换 `getExpandedNodes()` 返回路径的展开状态。 |
| `filter(config: { type: 'xpath'; expression: string })` | 在原始 XML 上执行 XPath。节点集结果会包裹在 `<result>` 中。 |
| `clearFilter()` | 恢复未过滤的视图，并清除过滤错误。 |
| `sort()` | 对视图中的属性以及**同级元素的标签名**排序，不直接更新源码。 |
| `clearSort()` | 取消视图排序。 |
| `isSorted()` | `boolean` — 是否启用了排序。 |
| `isValidXml()` | `boolean` — 当前是否没有解析错误。 |
| `getParsedXml()` | `ParsedXml \| null` — 原始解析结构，通常是保留节点顺序的数组，不是 DOM 节点。 |
| `getFilteredXml()` | `ParsedXml \| null` — 过滤后的解析结构。 |
| `getExpandedNodes()` | `Set<string>` — 当前展开路径集合。请将返回集合视为只读。 |
| `getParseError()` | `string` — 解析错误，无错误时为 `''`。 |
| `getFilterError()` | `string` — XPath 错误，无错误时为 `''`。 |
| `parseXmlString(source: string)` | 只更新内部解析状态，不更新 `v-model`。通常应直接修改绑定的源码。 |
| `copyValue(value: any)` | `Promise<void>` — 复制单个值，触发复制成功/失败事件。 |
| `getValue(value: any)` | `string` — 字符串原样返回，其他值按 JSON 序列化；**不是** XML 文档序列化接口。 |

**XPath 与顺序。** 过滤 API 不接受命名空间映射。对于带命名空间的 XML，可使用 `//*[local-name()="book"]` 等表达式，必要时增加 `namespace-uri()` 条件。非空标量结果显示在 `<result>` 中；当前 `0`、`false` 和 `''` 会被视为空结果。XML 同级节点顺序可能具有业务含义，排序需要主动启用，复制排序后的视图也会包含调整后的顺序。

## SqlFormat

### 使用示例

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { SqlFormat } from 'lone-format'
import type { SqlDialect } from 'lone-format'

const viewer = ref<InstanceType<typeof SqlFormat> | null>(null)
const dialect = ref<SqlDialect>('mysql')
const source = ref(`select u.id, u.name, count(o.id) as order_count
from users u left join orders o on o.user_id = u.id
group by u.id, u.name order by order_count desc limit 10;`)
const message = ref('')

function inspect() {
  const api = viewer.value
  if (!api) return
  message.value = api.isValidSql()
    ? `${api.getParsedSql()?.length ?? 0} 个顶层子句`
    : api.getParseError()
}
</script>

<template>
  <div>
    <textarea v-model="source" aria-label="SQL 源码" rows="6" />
    <div>
      <select v-model="dialect" aria-label="SQL 方言">
        <option value="mysql">MySQL</option>
        <option value="postgresql">PostgreSQL</option>
        <option value="sqlite">SQLite</option>
      </select>
      <button @click="viewer?.expandAll()">展开</button>
      <button @click="viewer?.collapseAll()">折叠</button>
      <button @click="viewer?.formatSource()">格式化源码</button>
      <button @click="viewer?.compressSource()">压缩源码</button>
      <button @click="viewer?.copySql()">复制 SQL</button>
      <button @click="inspect">检查状态</button>
    </div>
    <SqlFormat
      ref="viewer"
      v-model="source"
      :dialect="dialect"
      :tab-width="2"
      theme="github-light"
      @copy-success="message = '已复制'"
      @copy-error="message = $event.message"
    />
    <p role="status">{{ message }}</p>
  </div>
</template>
```

### Props 选项

| 属性 | 类型 | 默认值 | 实际行为 |
| --- | --- | --- | --- |
| `modelValue` / `v-model` | `string` | `''` | SQL 源码。 |
| `theme` | `ThemeType` | `'github-light'` | 内置语法主题。 |
| `dialect` | `SqlDialect` | `'sql'` | `sql-formatter` 支持的语言，例如 `mysql`、`postgresql`、`sqlite`、`tsql`、`plsql`、`snowflake`、`bigquery`、`trino`、`spark`。不支持的值会产生解析错误。 |
| `tabWidth` | `number` | `2` | 源码格式化及格式化复制文本的缩进宽度。仅修改此属性不会立即重新解析视图，可调用 `formatSource()` 将设置应用到源码。 |
| `readonly` | `boolean` | `false` | 已声明，但当前未使用，也不会禁用实例方法。 |

### 实例方法

未单独注明的方法返回 `void`。

| 方法 | 说明 / 返回值 |
| --- | --- |
| `copySql()` | `Promise<void>` — 复制格式化后的 SQL，触发复制成功/失败事件。 |
| `formatSource()` | 将格式化后的 SQL 写回 `v-model`，触发 `format`。 |
| `compressSource()` | 将压缩后的 SQL 写回 `v-model`，触发 `compress`。 |
| `expandAll()` | 展开所有子句，包括嵌套子句。 |
| `collapseAll()` | 折叠所有子句。 |
| `toggleExpand(path: string)` | 切换子句的展开状态，`path` 可从 `getParsedSql()` 返回的子句取得。 |
| `isValidSql()` | `boolean` — 当前是否没有解析错误。 |
| `getParsedSql()` | `SqlClause[] \| null` — 顶层子句数组，嵌套子句位于 `body` 片段中。没有子句时返回 `null`。 |
| `getParseError()` | `string` — 解析/格式化错误，无错误时为 `''`。 |
| `getValue()` | `string` — 缓存的格式化 SQL，没有时回退到绑定源码。与 JSON/XML 不同，该方法**不接收参数**。 |

`SqlDialect` 跟随 `sql-formatter` 的 `SqlLanguage` 类型。此组件用于查看和格式化，不是数据库语法解析器、查询执行器或 SQL 安全校验器，也没有过滤和排序 API。`SqlFormatOptions` 是导出的工具类型，**不是**组件的 `options` 属性；`keywordCase`、`useTabs` 等并非组件 Props。

<a id="events"></a>

## 事件

| 事件 | 参数 | 适用组件 | 触发时机 |
| --- | --- | --- | --- |
| `update:modelValue` | `string` | 全部 | 编辑或源码操作写入新文本，由 `v-model` 接收。 |
| `copy-success` | `string` | 全部 | 文档复制成功，参数是复制的文本。XML 的 `copyValue()` 也会触发。 |
| `copy-error` | `Error` | 全部 | 支持事件的复制操作失败。 |
| `expand-all` | 无 | 全部 | 执行 `expandAll()`，也包括内部通过此方法自动展开的情况。 |
| `collapse-all` | 无 | 全部 | 执行 `collapseAll()`。 |
| `compress` | `string` | 全部 | 源码压缩成功。 |
| `format` | `string` | XML、SQL | 源码格式化成功。JSON 不提供 `formatSource()`。 |

过滤操作在运行时**不会**触发 `filter-success` / `filter-error`。调用 `filter()` 后使用 `getFilterError()` 读取错误。组件也没有通用的解析错误事件，请使用对应格式的 `isValid…()` 与 `getParseError()`。

<a id="themes"></a>

## 主题

三个组件接受相同的 `theme` 值：

| 值 | 风格 |
| --- | --- |
| `github-light` | 浅色，默认主题 |
| `github-dark` | 深色 |
| `min-light` | 简约浅色 |
| `min-dark` | 简约深色 |
| `slack-ochin` | 配色柔和的浅色 |

响应式修改 `theme` 属性即可切换。该属性接受主题名称，而不是任意颜色对象。导出 `ThemeConfig` 类型并不代表组件提供了自定义主题属性。

<a id="integration-notes"></a>

## 接入须知

- **Ref 与源码更新。** 组件挂载后才能使用 ref。修改绑定源码后，如需读取解析状态，请先 `await nextTick()`。示例使用 `InstanceType<typeof Component>` 跟随组件实际暴露的 API。
- **类型声明差异。** 部分手写接口落后于运行实现：`JsonFormatExposed` 当前缺少 `compressSource()`；JSON 子入口的属性/事件接口还包含未实现的 `showToolbar` 和过滤事件。上面的表格以运行行为为准。根入口导出的 `FilterConfig` / `FilterType` 属于 **JSON**；XML 过滤类型可从 `lone-format/xml-format` 导入。
- **视图与源码。** 单独过滤和排序不会改写 `v-model`。JSON 压缩序列化当前视图；XML/SQL 源码操作针对原始源码。如果需要重置或撤销，请在应用侧保存原文。
- **剪贴板。** 复制使用浏览器 Clipboard API，通常需要 HTTPS 或 localhost、权限以及聚焦状态下的用户交互。文档复制方法通过 `copy-error` 报告失败，`Promise<void>` 正常结束不代表一定复制成功。
- **校验语义。** 空输入被视为清空状态，所以 `isValid…()` 对空字符串也可能返回 `true`。这些方法表示当前没有组件错误，不代表通过了 Schema 或业务校验。
- **内部数据。** 解析结果和展开集合是内部结构，不是不可变快照，请勿直接修改。JSON 编辑路径以点分隔，如 `users.0.name`；此路径 API 不会转义键名本身包含的点。

<a id="development"></a>

## 本地开发

```bash
npm ci
npm run dev             # 启动本地演示工作台
npm run build           # 类型检查并构建演示工作台
npm run build:lib:full   # 类型检查，构建 ES/UMD 组件库及声明文件
npm run docs:dev         # 启动本地 VitePress 文档
npm run docs:build       # 构建文档
```

[`src/demo`](./src/demo/) 下的工作台包含用例库、源码编辑器、渲染视图，以及 Props、过滤、状态和事件检查面板。各格式的适配器位于 [`src/demo/formats`](./src/demo/formats/)，新增回归用例可直接修改对应适配器。项目目前没有自动化测试套件，行为验证通过工作台完成。

另见[文档源码](./docs/)与[组件库入口](./src/index.ts)。

### 维护者发布流程

当前 [GitHub Actions 工作流](./.github/workflows/publish.yml) 在**推送到 `main`** 时触发，也可以在 **Actions → Auto Publish and Merge → Run workflow** 手动触发。手动发布请选择 `main`，并选择 `patch`、`minor` 或 `major`。

流程依次为：在 `main` 升级版本 → 合并 `main` 到 `publish` → 构建组件库 → 发布 npm → 创建版本标签。不要再同时手动升级版本号，也不要并发触发多次发布。

自动发布按最新提交信息的字面子串判断版本：`BREAKING CHANGE` / `major:` → major；`feat:` / `minor:` → minor；其他 → patch。`feat(demo):` 等带作用域的写法当前会落入 patch。CI 自动生成的提交带有 `[skip ci]`。

**仅修改文档并推送到 `main`，也可能触发新版本发布。** 请先审核再合并或推送。npm 版本撤下后不能重复使用。

## 许可证

[MIT](./LICENSE)
