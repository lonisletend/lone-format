# Lone Format

A Vue 3 component library for formatting with tree-shaking support.

## Features

- 🚀 **Vue 3 Support**: Built with Vue 3 and Composition API
- 📦 **Tree-shakable**: Only import what you need
- 🎨 **TypeScript**: Full TypeScript support
- 📚 **Well Documented**: Comprehensive documentation with VitePress
- 🛠️ **Easy to Use**: Simple and intuitive API

## Quick Start

```bash
npm install lone-format
```

```vue
<template>
  <!-- Demo Format Component -->
  <DemoFormat
    title="Hello World"
    content="This is a demo component"
    badge="New"
    type="success"
    :actions="actions"
    @action="handleAction"
  />
  
  <!-- JSON Format Component -->
  <JsonFormat v-model="jsonData" />
</template>

<script setup>
import { DemoFormat, JsonFormat } from 'lone-format'
import { ref } from 'vue'

const actions = [
  { label: 'Confirm', type: 'primary', handler: () => console.log('Confirmed') },
  { label: 'Cancel', type: 'default', handler: () => console.log('Cancelled') }
]

const jsonData = ref(`{
  "name": "Example",
  "version": "1.0.0",
  "features": ["tree-shaking", "typescript"]
}`)

const handleAction = (action) => {
  console.log('Action clicked:', action)
}
</script>
```

[Get Started →](/guide/)
