# Demo Format

A versatile formatting component that displays content with title, badge, and action buttons.

## Basic Usage

```vue
<template>
  <DemoFormat
    title="Basic Example"
    content="This is a basic demo format component"
  />
</template>

<script setup>
import { DemoFormat } from 'lone-format'
</script>
```

## With Badge

```vue
<template>
  <DemoFormat
    title="With Badge"
    content="This example shows a component with a badge"
    badge="New"
    type="success"
  />
</template>
```

## With Actions

```vue
<template>
  <DemoFormat
    title="With Actions"
    content="This example includes action buttons"
    :actions="actions"
    @action="handleAction"
  />
</template>

<script setup>
import { DemoFormat } from 'lone-format'

const actions = [
  { label: 'Save', type: 'primary', handler: () => alert('Saved!') },
  { label: 'Edit', type: 'default', handler: () => alert('Editing...') },
  { label: 'Delete', type: 'danger', handler: () => alert('Deleted!') }
]

const handleAction = (action) => {
  console.log('Action clicked:', action)
}
</script>
```

## Custom Content

```vue
<template>
  <DemoFormat title="Custom Content">
    <div style="padding: 16px; background: #f5f5f5; border-radius: 4px;">
      <h4>Custom HTML Content</h4>
      <p>You can put any content here using slots.</p>
      <ul>
        <li>Lists</li>
        <li>Images</li>
        <li>Any Vue components</li>
      </ul>
    </div>
  </DemoFormat>
</template>
```

## API

### Props

| Name | Type | Default | Description |
|------|------|---------|-------------|
| title | `string` | `'Demo Format'` | The title text |
| content | `string` | `''` | The content text (when not using slots) |
| badge | `string` | `''` | Badge text to display |
| type | `'info' \| 'success' \| 'warning' \| 'error'` | `'info'` | Badge type/color |
| actions | `Action[]` | `[]` | Array of action buttons |
| showActions | `boolean` | `true` | Whether to show action buttons |

### Action Interface

```typescript
interface Action {
  label: string
  type?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  handler?: () => void
}
```

### Events

| Name | Description | Type |
|------|-------------|------|
| action | Emitted when an action button is clicked | `(action: Action) => void` |

### Slots

| Name | Description |
|------|-------------|
| default | Custom content area |
