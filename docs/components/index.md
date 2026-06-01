# Components

## Component List

- [JSON Format](/components/json-format) - Advanced JSON viewer and editor with syntax highlighting
- `SqlFormat` - SQL formatter and clause viewer with external `dialect` prop support (dialects follow `sql-formatter`'s `supportedDialects`, e.g. `sql`, `mysql`, `postgresql`, `sqlite`, `plsql`, `tsql`, `snowflake`, `trino`)

## SQL Dialect Usage

```vue
<template>
  <SqlFormat v-model="sql" dialect="snowflake" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { SqlFormat } from 'lone-format'

const sql = ref('select * from users')
</script>
```

## Design Principles

All components in Lone Format follow these principles:

- **Consistent API**: Similar prop patterns across components
- **Accessibility**: Built with accessibility in mind
- **Customizable**: Easy to theme and customize
- **Lightweight**: Minimal dependencies and optimized bundle size
- **TypeScript First**: Designed with TypeScript from the ground up
