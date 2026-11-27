# lone-format

**JSON, XML, and SQL viewers for Vue 3.**

Turn source strings into syntax-highlighted, collapsible views. Add your own toolbar to inspect, filter, sort, copy, or rewrite the source through component refs.

**English** · [简体中文](./README.zh-CN.md)

[Installation](#installation) · [JSON](#jsonformat) · [XML](#xmlformat) · [SQL](#sqlformat) · [Events](#events) · [Themes](#themes) · [Notes](#integration-notes) · [Development](#development)

## At a glance

| Component | View | Query | Additional operations |
| --- | --- | --- | --- |
| `JsonFormat` | Collapsible objects and arrays | JSONPath / JavaScript expressions | Edit keys and values, sort keys, preserve numeric source text |
| `XmlFormat` | Collapsible elements and attributes | XPath | Edit XML nodes, sort attributes and elements, format source |
| `SqlFormat` | Collapsible clauses, nested queries, and INSERT value tuples | — | Dialect-aware formatting, source compression |

All three accept a **string** through `v-model`, support five built-in themes, and expose copy and expand/collapse methods. Components do not include the playground's toolbar or source editor; compose those in your application.

## Installation

Install in an existing Vue 3 application:

```bash
npm install lone-format
```

Import the stylesheet **once**, usually in your application's entry file:

```ts
import 'lone-format/style.css'
```

Use named imports:

```ts
import { JsonFormat, XmlFormat, SqlFormat } from 'lone-format'
```

Or use individual ES module entry points to keep imports scoped to a format:

```ts
import JsonFormat from 'lone-format/json-format'
import XmlFormat from 'lone-format/xml-format'
import SqlFormat from 'lone-format/sql-format'
```

Both styles require the same stylesheet. Vue is a peer dependency, not bundled with the library.

## JsonFormat

### Example

A complete single-file component with JSONPath filtering and a custom toolbar:

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
    <textarea v-model="source" aria-label="JSON source" rows="8" />
    <div>
      <button @click="viewer?.expandAll()">Expand</button>
      <button @click="viewer?.collapseAll()">Collapse</button>
      <button @click="filterActive">Active users</button>
      <button @click="viewer?.clearFilter()">Clear filter</button>
      <button @click="viewer?.sortKeys()">Sort keys</button>
      <button @click="viewer?.clearSortKeys()">Reset sort</button>
      <button @click="viewer?.compressSource()">Compress view to source</button>
      <button @click="viewer?.copyJson()">Copy view</button>
    </div>
    <JsonFormat
      ref="viewer"
      v-model="source"
      theme="github-light"
      :readonly="false"
      @copy-success="message = 'Copied'"
      @copy-error="message = $event.message"
    />
    <p role="status">{{ message }}</p>
  </div>
</template>
```

JavaScript filters use **`$`**, not `data`, as the root value. For the same component ref:

```ts
viewer.value?.filter({
  type: 'js',
  expression: '$.users.filter(user => user.active)',
})
```

> JavaScript filters execute with `new Function`. They are **not sandboxed**. Only run trusted expressions; do not enable them for untrusted input. A Content Security Policy that disallows dynamic code evaluation will block this mode.

### Props

| Prop | Type | Default | Behavior |
| --- | --- | --- | --- |
| `modelValue` / `v-model` | `string` | `''` | JSON source text. Pass raw text to retain large numbers and decimal trailing zeros. |
| `theme` | `ThemeType` | `'github-light'` | Built-in syntax theme. |
| `readonly` | `boolean` | `false` | Blocks key/value updates. Does not disable exposed source operations or hide all editing controls. |
| `maxDepth` | `number` | `10` | Declared, but currently not enforced by the renderer. |

### Instance methods

Call methods on a mounted component ref. Methods return `void` unless stated otherwise.

| Method | Description / return value |
| --- | --- |
| `copyJson()` | `Promise<void>` — copy the formatted **current view**, including filters and key sorting. |
| `compressSource()` | Replace `v-model` with compressed **current-view** JSON; emits `compress`. Clear filters/sorting first if you want the original dataset/order. |
| `expandAll()` | Expand the current tree. |
| `collapseAll()` | Collapse the current tree. |
| `toggleExpand(path: string)` | Toggle an expansion path. Use paths from `getExpandedNodes()`. |
| `updateValue(path: string, value: any)` | Update original data and emit the new source; for example, `updateValue('users.0.name', 'Taylor')`. |
| `updateKey(path: string, newKey: string)` | Rename an object key; for example, `updateKey('users.0.name', 'displayName')`. |
| `filter(config: { type: 'jsonpath' \| 'js'; expression: string })` | Apply a view filter without changing the source. An empty expression clears it. |
| `clearFilter()` | Restore the unfiltered view and clear the filter error. |
| `sortKeys()` | Enable recursive object-key sorting in the view; array order is retained. |
| `clearSortKeys()` | Disable view sorting. |
| `isSorted()` | `boolean` — whether key sorting is enabled. |
| `isValidJson()` | `boolean` — whether the component currently has no parse error. |
| `getParsedJson()` | `any` — parsed original data, possibly containing protected-number objects. |
| `getFilteredJson()` | `any` — filter result; `null` also represents no active result. |
| `getExpandedNodes()` | `Set<string>` — current expansion paths. Treat the returned set as read-only. |
| `getParseError()` | `string` — parse error, or `''`. |
| `getFilterError()` | `string` — filter error, or `''`. |
| `parseJson(source: string)` | Parse into internal state without updating `v-model`. Prefer assigning to the bound source. |
| `copyValue(value: any)` | `Promise<void>` — copy one value using `getValue()`. Failures are logged; this helper does not emit copy events. |
| `getValue(value: any)` | `string` — single-value display/copy text, not a whole-document serializer. |

**Number handling.** Values whose numeric spelling would change when converted to JavaScript `Number` are stored internally as protected objects, including large integers and `12.3400`. Keep the original input as a string: precision lost before the component receives it cannot be recovered. Prefer `copyJson()` / `compressSource()` for document output; `JSON.stringify(getParsedJson())` and `getValue(object)` do not provide the same protected-number serialization. Arithmetic in JavaScript filters still uses JavaScript number semantics.

## XmlFormat

### Example

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
    <textarea v-model="source" aria-label="XML source" rows="6" />
    <div>
      <button @click="viewer?.expandAll()">Expand</button>
      <button @click="viewer?.collapseAll()">Collapse</button>
      <button @click="filterAvailable">Available books</button>
      <button @click="viewer?.clearFilter()">Clear filter</button>
      <button @click="viewer?.sort()">Sort view</button>
      <button @click="viewer?.clearSort()">Reset sort</button>
      <button @click="viewer?.formatSource()">Format source</button>
      <button @click="viewer?.compressSource()">Compress source</button>
      <button @click="viewer?.copyXml()">Copy view</button>
    </div>
    <XmlFormat
      ref="viewer"
      v-model="source"
      theme="github-light"
      @copy-success="message = 'Copied'"
      @copy-error="message = $event.message"
    />
    <p role="status">{{ message }}</p>
  </div>
</template>
```

### Props

| Prop | Type | Default | Behavior |
| --- | --- | --- | --- |
| `modelValue` / `v-model` | `string` | `''` | XML source text. |
| `theme` | `ThemeType` | `'github-light'` | Built-in syntax theme. |
| `readonly` | `boolean` | `false` | Declared, but currently does not prevent XML editing. |
| `maxDepth` | `number` | `10` | Declared, but currently not enforced. |
| `showComments` | `boolean` | `true` | Declared, but currently not connected to rendering. |
| `showCdata` | `boolean` | `true` | Declared, but currently not connected to rendering. |
| `preserveWhitespace` | `boolean` | `false` | Declared, but currently not forwarded to parsing/formatting. |

Do not rely on the declared-but-inactive options to enforce read-only behavior or control XML content visibility.

### Instance methods

Methods return `void` unless stated otherwise.

| Method | Description / return value |
| --- | --- |
| `copyXml()` | `Promise<void>` — copy the current view, including XPath filtering and sorting. |
| `formatSource()` | Format the bound source with two-space indentation; emits `update:modelValue` and `format`. |
| `compressSource()` | Compress the original parsed source, not the filtered view; emits `update:modelValue` and `compress`. |
| `expandAll()` | Expand the current tree. |
| `collapseAll()` | Collapse the current tree. |
| `toggleExpand(path: string)` | Toggle an expansion path from `getExpandedNodes()`. |
| `filter(config: { type: 'xpath'; expression: string })` | Run XPath against the original XML. Node-set results are wrapped in `<result>`. |
| `clearFilter()` | Restore the unfiltered view and clear the filter error. |
| `sort()` | Sort attributes **and sibling elements by tag name** in the view; does not directly update the source. |
| `clearSort()` | Disable view sorting. |
| `isSorted()` | `boolean` — whether sorting is enabled. |
| `isValidXml()` | `boolean` — whether the component currently has no parse error. |
| `getParsedXml()` | `ParsedXml \| null` — original parser data, normally a preserve-order array; not a DOM node. |
| `getFilteredXml()` | `ParsedXml \| null` — parsed filter result. |
| `getExpandedNodes()` | `Set<string>` — current expansion paths. Treat the returned set as read-only. |
| `getParseError()` | `string` — parse error, or `''`. |
| `getFilterError()` | `string` — XPath error, or `''`. |
| `parseXmlString(source: string)` | Parse into internal state without updating `v-model`. Prefer assigning to the bound source. |
| `copyValue(value: any)` | `Promise<void>` — copy one value; emits copy success/error events. |
| `getValue(value: any)` | `string` — strings unchanged, other values JSON-serialized; **not** an XML document serializer. |

**XPath and ordering.** The filter API does not accept a namespace map. For namespaced input, use expressions such as `//*[local-name()="book"]` (add a `namespace-uri()` condition when needed). Non-empty scalar results are displayed inside `<result>`; currently `0`, `false`, and `''` are treated as empty results. XML sibling order can be meaningful: sorting is opt-in, and copying a sorted view includes that reordered content.

## SqlFormat

### Example

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
    ? `${api.getParsedSql()?.length ?? 0} top-level clauses`
    : api.getParseError()
}
</script>

<template>
  <div>
    <textarea v-model="source" aria-label="SQL source" rows="6" />
    <div>
      <select v-model="dialect" aria-label="SQL dialect">
        <option value="mysql">MySQL</option>
        <option value="postgresql">PostgreSQL</option>
        <option value="sqlite">SQLite</option>
      </select>
      <button @click="viewer?.expandAll()">Expand</button>
      <button @click="viewer?.collapseAll()">Collapse</button>
      <button @click="viewer?.formatSource()">Format source</button>
      <button @click="viewer?.compressSource()">Compress source</button>
      <button @click="viewer?.copySql()">Copy SQL</button>
      <button @click="inspect">Inspect</button>
    </div>
    <SqlFormat
      ref="viewer"
      v-model="source"
      :dialect="dialect"
      :tab-width="2"
      theme="github-light"
      @copy-success="message = 'Copied'"
      @copy-error="message = $event.message"
    />
    <p role="status">{{ message }}</p>
  </div>
</template>
```

### Props

| Prop | Type | Default | Behavior |
| --- | --- | --- | --- |
| `modelValue` / `v-model` | `string` | `''` | SQL source text. |
| `theme` | `ThemeType` | `'github-light'` | Built-in syntax theme. |
| `dialect` | `SqlDialect` | `'sql'` | A language supported by `sql-formatter`, such as `mysql`, `postgresql`, `sqlite`, `tsql`, `plsql`, `snowflake`, `bigquery`, `trino`, or `spark`. Unsupported values produce a parse error. |
| `tabWidth` | `number` | `2` | Indentation used by source formatting and formatted copy output. Changing only this prop does not immediately reparse the view; call `formatSource()` to apply it to the source. |
| `readonly` | `boolean` | `false` | Declared, but currently not used. Does not disable instance methods. |

### Instance methods

Methods return `void` unless stated otherwise.

| Method | Description / return value |
| --- | --- |
| `copySql()` | `Promise<void>` — copy formatted SQL; emits copy success/error events. |
| `formatSource()` | Replace `v-model` with formatted SQL; emits `format`. |
| `compressSource()` | Replace `v-model` with compressed SQL; emits `compress`. |
| `expandAll()` | Expand clauses, including nested clauses. |
| `collapseAll()` | Collapse all clauses. |
| `toggleExpand(path: string)` | Toggle a clause's `path`, obtained from `getParsedSql()`. |
| `isValidSql()` | `boolean` — whether the component currently has no parse error. |
| `getParsedSql()` | `SqlClause[] \| null` — top-level clauses; nested clauses are represented in `body` segments. Returns `null` when there are no clauses. |
| `getParseError()` | `string` — parse/formatting error, or `''`. |
| `getValue()` | `string` — cached formatted SQL, falling back to the bound source. Unlike JSON/XML, this method takes **no argument**. |

`SqlDialect` follows `sql-formatter`'s `SqlLanguage` type. The component is a viewer/formatter, not a database parser, query runner, or SQL security validator. It has no filter or sort API. `SqlFormatOptions` is an exported utility type, **not** an `options` prop; settings such as `keywordCase` and `useTabs` are not component props.

## Events

| Event | Payload | Components | When |
| --- | --- | --- | --- |
| `update:modelValue` | `string` | All | An edit or source operation writes new text; handled by `v-model`. |
| `copy-success` | `string` | All | Document copy succeeds; payload is the copied text. Also emitted by XML's `copyValue()`. |
| `copy-error` | `Error` | All | A copy operation that emits events fails. |
| `expand-all` | None | All | `expandAll()` runs, including automatic expansion where used internally. |
| `collapse-all` | None | All | `collapseAll()` runs. |
| `compress` | `string` | All | Source compression succeeds. |
| `format` | `string` | XML, SQL | Source formatting succeeds. JSON does not expose `formatSource()`. |

Filters do **not** emit `filter-success` / `filter-error` at runtime. Read `getFilterError()` after calling `filter()`. There is no general parse-error event; use the format-specific `isValid…()` and `getParseError()` methods.

## Themes

Every component accepts the same `theme` values:

| Value | Appearance |
| --- | --- |
| `github-light` | Light, the default |
| `github-dark` | Dark |
| `min-light` | Minimal light |
| `min-dark` | Minimal dark |
| `slack-ochin` | Light with a muted palette |

Change the `theme` prop reactively to switch themes. The prop accepts a theme name, not an arbitrary color object. An exported `ThemeConfig` type does not imply a custom-theme prop.

## Integration notes

- **Refs and source updates.** Refs are available after mounting. After assigning new source text, `await nextTick()` before querying the parsed state. The examples use `InstanceType<typeof Component>` to follow the actual exposed API.
- **Type declarations.** Some handwritten interfaces lag behind runtime behavior: `JsonFormatExposed` currently omits `compressSource()`, and JSON's sub-entry prop/event interfaces list `showToolbar` and filter events that are not implemented. The tables above document runtime behavior. Root-level `FilterConfig` / `FilterType` describe **JSON**; XML-specific filter types are available from `lone-format/xml-format`.
- **View vs. source.** Filtering and sorting alone do not rewrite `v-model`. JSON compression serializes the current view; XML/SQL source operations work on the source. Keep your own original text if users need a reset/undo action.
- **Clipboard.** Copying uses the browser Clipboard API and generally requires HTTPS or localhost, permissions, and a focused user interaction. Document copy methods report failure through `copy-error`; a resolved `Promise<void>` is not itself proof of success.
- **Validation.** Empty input is treated as a clear state, so `isValid…()` can return `true` for an empty string. These getters indicate absence of a current component error, not schema or business validation.
- **Internal data.** Parsed data and expansion sets are internal structures, not immutable snapshots. Do not mutate them directly. JSON edit paths are dot-separated (`users.0.name`); literal dots in object keys are not escaped by this path API.

## Development

```bash
npm ci
npm run dev             # Local playground
npm run build           # Type-check + build the playground
npm run build:lib:full   # Type-check + build ES/UMD library and declarations
npm run docs:dev         # Local VitePress documentation
npm run docs:build       # Build documentation
```

The playground in [`src/demo`](./src/demo/) provides fixtures, a source editor, a rendered view, and an inspector for props, filters, state, and events. Each format has an adapter under [`src/demo/formats`](./src/demo/formats/). Add regression fixtures there. There is currently no automated test suite; use the playground for behavior checks.

See also the [documentation source](./docs/) and [library entry point](./src/index.ts).

### Maintainer release workflow

The current [GitHub Actions workflow](./.github/workflows/publish.yml) triggers on **pushes to `main`**, or manually via **Actions → Auto Publish and Merge → Run workflow**. Select `main` and `patch`, `minor`, or `major` for a manual release.

It bumps the version on `main`, merges `main` into `publish`, builds the library, publishes to npm, then creates a version tag. Do not manually bump the version as well, and do not trigger concurrent releases.

For push-triggered releases, the latest commit message is checked for literal substrings: `BREAKING CHANGE` / `major:` → major; `feat:` / `minor:` → minor; otherwise → patch. Scoped messages such as `feat(demo):` currently fall through to patch. CI-generated commits use `[skip ci]`.

**Pushing documentation-only changes to `main` can also publish a version.** Review changes before merging or pushing. npm versions cannot be reused after unpublishing.

## License

[MIT](./LICENSE)
