# Quick Start

## Full Import

```javascript
import { createApp } from 'vue'
import LoneFormat from 'lone-format'
import App from './App.vue'

const app = createApp(App)
app.use(LoneFormat)
app.mount('#app')
```

After importing, you can use all components in any Vue template:

```vue
<template>
  <DemoFormat 
    title="Hello World" 
    content="This is a demo" 
    type="success" 
  />
</template>
```

## On-demand Import (Recommended)

For better tree-shaking, import only the components you need:

```vue
<template>
  <DemoFormat 
    title="On-demand Import" 
    :actions="actions"
    @action="handleAction"
  />
</template>

<script setup>
import { DemoFormat } from 'lone-format'

const actions = [
  { label: 'Save', type: 'primary' },
  { label: 'Cancel', type: 'default' }
]

const handleAction = (action) => {
  console.log('Action:', action.label)
}
</script>
```

## TypeScript Support

Lone Format has full TypeScript support. When using TypeScript, you'll get full IntelliSense and type checking:

```vue
<script setup lang="ts">
import { DemoFormat, type Action } from 'lone-format'

const actions: Action[] = [
  { label: 'Confirm', type: 'primary', handler: () => {} },
  { label: 'Cancel', type: 'default', handler: () => {} }
]
</script>
```
