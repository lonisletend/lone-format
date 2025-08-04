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
  <JsonFormat 
    v-model="jsonData"
    :readonly="false"
  />
</template>

<script setup>
import { ref } from 'vue'

const jsonData = ref('{"hello": "world"}')
</script>
```

## On-demand Import (Recommended)

For better tree-shaking, import only the components you need:

```vue
<template>
  <JsonFormat 
    v-model="data"
    @update:modelValue="handleUpdate"
  />
</template>

<script setup>
import { ref } from 'vue'
import { JsonFormat } from 'lone-format'

const data = ref('{"example": "data"}')

const handleUpdate = (newValue) => {
  console.log('JSON updated:', newValue)
}
</script>
```

## TypeScript Support

Lone Format has full TypeScript support. When using TypeScript, you'll get full IntelliSense and type checking:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { JsonFormat } from 'lone-format'

const jsonData = ref<string>('{"typed": "data"}')

const handleJsonUpdate = (newValue: string): void => {
  console.log('Updated:', newValue)
}
</script>
```
