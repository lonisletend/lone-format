# JSON Format

A powerful JSON formatting component with syntax highlighting, tree-shaking support, and advanced features for viewing and editing JSON data.

## Features

- 🎨 **GitHub-style Syntax Highlighting**: Beautiful JSON rendering with GitHub theme colors
- 📦 **Tree-shakable**: Large number support using json-bigint to prevent overflow
- 🔧 **Interactive Editing**: Click on keys and values to edit them inline
- 📁 **Collapsible Structure**: Click on `{}` or `[]` to expand/collapse objects and arrays
- 📋 **Copy Support**: Copy entire JSON or individual values
- ❌ **Error Handling**: Clear error messages for invalid JSON
- 🎯 **TypeScript Support**: Full type definitions included

## Basic Usage

```vue
<template>
  <JsonFormat v-model="jsonData" />
</template>

<script setup>
import { ref } from 'vue'
import { JsonFormat } from 'lone-format'

const jsonData = ref(`{
  "name": "Example",
  "version": "1.0.0",
  "active": true
}`)
</script>
```

## Large Numbers Support

The component uses `json-bigint` to handle large numbers without precision loss:

```vue
<template>
  <JsonFormat v-model="bigNumberJson" />
</template>

<script setup>
import { ref } from 'vue'
import { JsonFormat } from 'lone-format'

const bigNumberJson = ref(`{
  "id": 12345678901234567890,
  "timestamp": 1234567890123456789
}`)
</script>
```

## Readonly Mode

Prevent editing by setting the readonly prop:

```vue
<template>
  <JsonFormat 
    v-model="jsonData" 
    :readonly="true" 
  />
</template>
```

## Complex Nested Example

```vue
<template>
  <JsonFormat v-model="complexJson" />
</template>

<script setup>
import { ref } from 'vue'
import { JsonFormat } from 'lone-format'

const complexJson = ref(`{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "profile": {
        "settings": {
          "theme": "dark",
          "notifications": true
        }
      }
    }
  ],
  "metadata": {
    "total": 1,
    "created": "2024-01-01T00:00:00Z"
  }
}`)
</script>
```

## Error Handling

The component gracefully handles invalid JSON:

```vue
<template>
  <JsonFormat v-model="invalidJson" />
</template>

<script setup>
import { ref } from 'vue'
import { JsonFormat } from 'lone-format'

const invalidJson = ref(`{
  "name": "Invalid",
  "missing": quote,
  "extra": "comma",
}`)
</script>
```

## Interactive Features

### Expanding and Collapsing

- Click on `{` or `[` brackets to expand/collapse objects and arrays
- Use the toolbar buttons to expand or collapse all nodes at once

### Editing Values

- Click on any key or value to edit it inline
- Supports editing strings, numbers, booleans, and null values
- Changes are automatically reflected in the bound data

### Copying Data

- Use the "Copy" button to copy the entire formatted JSON
- Double-click on any value to copy it to clipboard

## API

### Props

| Name | Type | Default | Description |
|------|------|---------|-------------|
| modelValue | `string` | `''` | The JSON string to format and display |
| readonly | `boolean` | `false` | Whether the JSON is readonly (prevents editing) |
| maxDepth | `number` | `10` | Maximum nesting depth for rendering |

### Events

| Name | Description | Type |
|------|-------------|------|
| update:modelValue | Emitted when JSON is edited | `(value: string) => void` |

### Slots

This component does not support slots as it renders structured JSON data.

## Styling

The component uses GitHub-inspired styling with these color schemes:

- **Keys**: Blue (`#0969da`)
- **Strings**: Dark blue (`#0a3069`)
- **Numbers**: Blue (`#0969da`)
- **Booleans**: Purple (`#8250df`)
- **Null values**: Gray italic (`#656d76`)
- **Brackets**: Purple (`#6f42c1`)

## TypeScript Support

Full TypeScript definitions are included:

```typescript
interface JsonFormatProps {
  modelValue: string
  readonly?: boolean
  maxDepth?: number
}

// Events
interface JsonFormatEvents {
  'update:modelValue': (value: string) => void
}
```

## Performance Considerations

- Large JSON objects are efficiently rendered with virtual scrolling
- Only visible nodes are fully rendered to maintain performance
- json-bigint processing adds minimal overhead for number parsing

## Accessibility

- Keyboard navigation support for interactive elements
- Screen reader friendly with proper ARIA labels
- High contrast colors for better visibility
