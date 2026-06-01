# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev              # Start Vite dev server (demo app)
npm run docs:dev         # Start VitePress docs server

# Build
npm run build:lib        # Build library only (no type check)
npm run build:lib:full   # Build library with TypeScript type check (use before publishing)

# Documentation
npm run docs:build       # Build VitePress documentation

# Publishing (done via CI/CD on the `publish` branch)
npm run version:patch    # Bump patch version (no git tag)
npm run version:minor    # Bump minor version (no git tag)
npm run publish:dry      # Dry run npm publish to verify output
```

There are no test commands — the project has no test suite. Manual verification is done via the demo app (`npm run dev`) or the HTML test files in the root (`test-xml-sort.html`, `index.html`).

## Architecture

### Library structure

This is a **Vue 3 component library** built with Vite in library mode. The entry point is [src/index.ts](src/index.ts), which exports three components and their TypeScript types. Each component is independently tree-shakeable via the `exports` map in `package.json`.

The three components are:

| Component | Format | Filter | External dependency |
|-----------|--------|--------|---------------------|
| `JsonFormat` | JSON | JSONPath, JavaScript expression | `jsonpath-plus` |
| `XmlFormat` | XML | XPath | `fast-xml-parser`, `@xmldom/xmldom`, `xpath` |
| `SqlFormat` | SQL | — | `sql-formatter` |

### Per-component file layout

Each component under `src/components/<Name>/` follows the same pattern:

- **`index.vue`** — The root Vue component. Owns all reactive state, exposes its API via `defineExpose`, emits events, and renders either a node tree or an error message.
- **`types.ts`** — All TypeScript interfaces for that component: props, emits, exposed methods, and the theme color schema.
- **`themes.ts`** — Five built-in theme objects (`github-light`, `github-dark`, `min-light`, `min-dark`, `slack-ochin`) plus `getTheme()`/`getAvailableThemes()` helpers.
- **`parser.ts`** — Pure functions for parsing, formatting, compressing, and validating the format (no Vue dependency). Used internally by `index.vue`.
- **`XmlNode.vue` / `JsonNode.vue`** — Recursive rendering components for the tree view (only present in XML and JSON components).

### Theme system

All three components share the same five `ThemeType` values. Each component has its own `ThemeConfig` interface in its `types.ts` with format-specific syntax highlight color keys (e.g., `syntaxKey` for JSON, `xmlTag`/`xmlAttribute` for XML, `sqlKeyword` for SQL). The theme is passed to child nodes via props and applied inline using `v-bind` in `<style scoped>`.

### Big-number precision (JSON)

`JsonFormat` wraps numbers ≥ 16 digits and trailing-zero decimals in a `{ __protected_number__: "..." }` sentinel object before `JSON.parse`. This preserves precision that would otherwise be lost. Rendering, copying, and re-serializing all check for this sentinel and unwrap it. Any code touching JSON values must handle this shape.

### Node path model

All three components track expand/collapse state via a `Set<string>` of dot-separated paths (e.g., `root.users.0.name`). Paths are also used for value and key editing in JsonFormat. When renaming a key, all descendant paths in `expandedNodes` must be updated — see `updateExpandedPaths` in [src/components/JsonFormat/index.vue](src/components/JsonFormat/index.vue).

### SQL clause parsing

`SqlFormat` uses `sql-formatter` to normalise SQL, then splits the output on major clause keywords (`SELECT`, `FROM`, `JOIN`, etc.) to produce a flat `SqlClause[]` array. `INSERT INTO ... VALUES` is special-cased: each value tuple becomes its own collapsible `VALUE_TUPLE` clause. The tokenizer (`tokenizeSql`) is a hand-written regex scanner used for syntax highlighting.

### Build modes

`vite.config.ts` switches behaviour based on `mode`:
- Default (`npm run dev`): standard Vite SPA build for the demo app in `src/App.vue`.
- `lib` mode (`npm run build:lib`): builds `ES` + `UMD` bundles and runs `vite-plugin-dts` to emit `.d.ts` files. `vue` is externalised.

## CI/CD

Pushing to the `publish` branch triggers auto-versioning (commit message convention: `feat:` → minor, `fix:` → patch) and auto-publishing to npm, then auto-merges back to `main`. Never push non-release work directly to `publish`.
