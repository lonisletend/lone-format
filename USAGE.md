# Usage Examples

This document provides practical examples of how to use the Lone Format component library.

## Installation

```bash
npm install lone-format
```

## Basic Setup

### Full Import (Global Registration)

```javascript
import { createApp } from 'vue'
import LoneFormat from 'lone-format'
import App from './App.vue'

const app = createApp(App)
app.use(LoneFormat)
app.mount('#app')
```

After global registration, you can use components anywhere:

```vue
<template>
  <div>
    <DemoFormat title="Globally Registered" />
    <JsonFormat v-model="jsonData" />
  </div>
</template>
```

### On-Demand Import (Recommended)

```vue
<template>
  <div>
    <DemoFormat
      title="Task Complete"
      content="Your task has been completed successfully!"
      badge="Success"
      type="success"
      :actions="actions"
      @action="handleTaskAction"
    />
    
    <JsonFormat
      v-model="apiResponse"
      :readonly="false"
      @update:modelValue="handleJsonUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { DemoFormat, JsonFormat, type Action } from 'lone-format'

const actions: Action[] = [
  { label: 'Continue', type: 'primary', handler: () => navigateNext() },
  { label: 'Review', type: 'default', handler: () => showReview() }
]

const apiResponse = ref(`{
  "status": "success",
  "data": {
    "users": [
      { "id": 1, "name": "John Doe", "active": true },
      { "id": 2, "name": "Jane Smith", "active": false }
    ]
  },
  "timestamp": 1640995200000
}`)

const handleTaskAction = (action: Action) => {
  console.log('Task action:', action.label)
}

const handleJsonUpdate = (newJson: string) => {
  console.log('JSON updated:', newJson)
}

const navigateNext = () => {
  // Navigation logic
}

const showReview = () => {
  // Review logic
}
</script>
```

## Real-World Examples

### API Response Viewer

```vue
<template>
  <div class="api-viewer">
    <DemoFormat
      title="API Response Viewer"
      :content="`Status: ${responseStatus}`"
      :badge="statusBadge"
      :type="statusType"
      :actions="apiActions"
      @action="handleApiAction"
    >
      <div class="response-meta">
        <p><strong>Endpoint:</strong> {{ endpoint }}</p>
        <p><strong>Method:</strong> {{ method }}</p>
        <p><strong>Response Time:</strong> {{ responseTime }}ms</p>
      </div>
    </DemoFormat>
    
    <JsonFormat
      v-model="responseData"
      :readonly="!isEditable"
      class="response-json"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { DemoFormat, JsonFormat, type Action } from 'lone-format'

const endpoint = ref('/api/users')
const method = ref('GET')
const responseTime = ref(145)
const responseStatus = ref('200 OK')
const isEditable = ref(false)

const responseData = ref(`{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "per_page": 10
  }
}`)

const statusType = computed(() => {
  if (responseStatus.value.startsWith('2')) return 'success'
  if (responseStatus.value.startsWith('4')) return 'warning'
  if (responseStatus.value.startsWith('5')) return 'error'
  return 'info'
})

const statusBadge = computed(() => {
  return responseStatus.value.split(' ')[0]
})

const apiActions: Action[] = [
  { label: 'Copy cURL', type: 'default', handler: () => copyCurl() },
  { label: 'Edit Response', type: 'primary', handler: () => toggleEdit() },
  { label: 'Save', type: 'success', handler: () => saveResponse() }
]

const handleApiAction = (action: Action) => {
  console.log('API action:', action.label)
}

const copyCurl = () => {
  const curl = \`curl -X \${method.value} \${endpoint.value}\`
  navigator.clipboard.writeText(curl)
}

const toggleEdit = () => {
  isEditable.value = !isEditable.value
}

const saveResponse = () => {
  // Save logic
}
</script>

<style scoped>
.api-viewer {
  max-width: 800px;
  margin: 0 auto;
  space-y: 16px;
}

.response-meta {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
  margin-top: 12px;
}

.response-meta p {
  margin: 4px 0;
  font-family: monospace;
  font-size: 14px;
}

.response-json {
  margin-top: 16px;
}
</style>
```

### Configuration Editor

```vue
<template>
  <div class="config-editor">
    <DemoFormat
      title="Application Configuration"
      content="Edit your application settings below"
      badge="Config"
      type="info"
      :actions="configActions"
      @action="handleConfigAction"
    />
    
    <JsonFormat
      v-model="configJson"
      :readonly="!editMode"
      @update:modelValue="handleConfigChange"
    />
    
    <div v-if="hasChanges" class="changes-indicator">
      <DemoFormat
        title="Unsaved Changes"
        content="You have unsaved configuration changes"
        badge="Modified"
        type="warning"
        :actions="saveActions"
        @action="handleSaveAction"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { DemoFormat, JsonFormat, type Action } from 'lone-format'

const editMode = ref(false)
const originalConfig = ref('')
const configJson = ref(`{
  "app": {
    "name": "My Application",
    "version": "1.0.0",
    "debug": false
  },
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "myapp_db"
  },
  "features": {
    "user_registration": true,
    "email_notifications": true,
    "analytics": false
  }
}`)

// Initialize original config
watch(() => configJson.value, (newVal) => {
  if (!originalConfig.value) {
    originalConfig.value = newVal
  }
}, { immediate: true })

const hasChanges = computed(() => {
  return originalConfig.value !== configJson.value
})

const configActions: Action[] = [
  { label: 'Edit', type: 'primary', handler: () => toggleEdit() },
  { label: 'Reset', type: 'default', handler: () => resetConfig() },
  { label: 'Validate', type: 'default', handler: () => validateConfig() }
]

const saveActions: Action[] = [
  { label: 'Save Changes', type: 'success', handler: () => saveConfig() },
  { label: 'Discard', type: 'danger', handler: () => discardChanges() }
]

const handleConfigAction = (action: Action) => {
  console.log('Config action:', action.label)
}

const handleSaveAction = (action: Action) => {
  console.log('Save action:', action.label)
}

const handleConfigChange = (newJson: string) => {
  configJson.value = newJson
}

const toggleEdit = () => {
  editMode.value = !editMode.value
}

const resetConfig = () => {
  configJson.value = originalConfig.value
}

const validateConfig = () => {
  try {
    JSON.parse(configJson.value)
    alert('Configuration is valid!')
  } catch (error) {
    alert('Configuration is invalid: ' + error.message)
  }
}

const saveConfig = () => {
  originalConfig.value = configJson.value
  editMode.value = false
  alert('Configuration saved!')
}

const discardChanges = () => {
  configJson.value = originalConfig.value
}
</script>

<style scoped>
.config-editor {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.changes-indicator {
  margin-top: 20px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>
```

## TypeScript Integration

### Component Props Types

```typescript
import type { DemoFormatProps, JsonFormatProps, Action } from 'lone-format'

// Define your component props
interface MyComponentProps {
  demoConfig: DemoFormatProps
  jsonConfig: JsonFormatProps
  actions: Action[]
}

// Use in component
const props = defineProps<MyComponentProps>()
```

### Event Handling with Types

```typescript
import { ref } from 'vue'
import type { Action } from 'lone-format'

// Typed event handlers
const handleAction = (action: Action): void => {
  switch (action.type) {
    case 'primary':
      // Handle primary action
      break
    case 'danger':
      // Handle danger action
      break
    default:
      // Handle default action
  }
}

// Typed JSON update handler
const handleJsonUpdate = (jsonString: string): void => {
  try {
    const parsed = JSON.parse(jsonString)
    // Process parsed JSON with full type safety
    console.log('Parsed JSON:', parsed)
  } catch (error) {
    console.error('Invalid JSON:', error)
  }
}
```

## Integration with Popular Frameworks

### Nuxt.js

```javascript
// plugins/lone-format.client.js
import LoneFormat from 'lone-format'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(LoneFormat)
})
```

### Vue Router Integration

```vue
<template>
  <div>
    <DemoFormat
      title="Route Information"
      :content="\`Current route: \${$route.path}\`"
      badge="Route"
      type="info"
      :actions="routeActions"
      @action="handleRouteAction"
    />
    
    <JsonFormat 
      :model-value="routeDataJson" 
      :readonly="true"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { DemoFormat, JsonFormat, type Action } from 'lone-format'

const route = useRoute()
const router = useRouter()

const routeDataJson = computed(() => {
  return JSON.stringify({
    path: route.path,
    name: route.name,
    params: route.params,
    query: route.query,
    meta: route.meta
  }, null, 2)
})

const routeActions: Action[] = [
  { label: 'Go Back', type: 'default', handler: () => router.back() },
  { label: 'Go Home', type: 'primary', handler: () => router.push('/') }
]

const handleRouteAction = (action: Action) => {
  // Action handling logic
}
</script>
```

## Best Practices

### Performance Optimization

1. **Use On-demand Import**: Only import components you need
2. **Lazy Load Large JSON**: For very large JSON objects, consider lazy loading
3. **Debounce Updates**: When editing JSON, debounce the update events

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'
import { debounce } from 'lodash-es'
import { JsonFormat } from 'lone-format'

const jsonData = ref('')
const debouncedUpdate = debounce((newValue: string) => {
  // Handle update
  console.log('JSON updated:', newValue)
}, 300)

watch(() => jsonData.value, debouncedUpdate)
</script>
```

### Error Handling

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { JsonFormat } from 'lone-format'

const jsonData = ref('')
const jsonError = ref('')

const isValidJson = computed(() => {
  try {
    JSON.parse(jsonData.value)
    jsonError.value = ''
    return true
  } catch (error) {
    jsonError.value = error.message
    return false
  }
})

const handleJsonUpdate = (newJson: string) => {
  jsonData.value = newJson
  if (isValidJson.value) {
    // Process valid JSON
  }
}
</script>
```

### Accessibility

```vue
<template>
  <div>
    <DemoFormat
      title="Accessible Demo"
      content="This component follows accessibility best practices"
      :actions="actions"
      @action="handleAction"
      role="region"
      aria-label="Demo content area"
    />
    
    <JsonFormat
      v-model="jsonData"
      role="region"
      aria-label="JSON editor"
    />
  </div>
</template>
```
