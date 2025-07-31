<script setup lang="ts">
import { ref } from 'vue'
import DemoFormat from './components/DemoFormat/index.vue'
import JsonFormat from './components/JsonFormat/index.vue'
import type { Action } from './types'
import type { JsonFormatExposed } from './components/JsonFormat/types'

const basicActions = ref<Action[]>([
  { label: 'Save', type: 'primary', handler: () => alert('Saved!') },
  { label: 'Cancel', type: 'default', handler: () => alert('Cancelled!') }
])

const advancedActions = ref<Action[]>([
  { label: 'Approve', type: 'success', handler: () => alert('Approved!') },
  { label: 'Reject', type: 'danger', handler: () => alert('Rejected!') },
  { label: 'Edit', type: 'warning', handler: () => alert('Editing...') }
])

const handleAction = (action: Action) => {
  console.log('Action clicked:', action)
}

// JsonFormat 组件引用
const jsonFormatRef = ref<JsonFormatExposed>()
const customJsonFormatRef = ref<JsonFormatExposed>()
const complexJsonFormatRef = ref<JsonFormatExposed>()

// 操作反馈消息
const message = ref('')
const messageType = ref<'success' | 'error' | 'info'>('info')

// 自定义按钮操作 - Custom Control Example 区块
const handleCustomCopy = async () => {
  try {
    await customJsonFormatRef.value?.copyJson()
    showMessage('自定义 JSON 已复制到剪贴板！', 'success')
  } catch (error) {
    showMessage('复制失败', 'error')
  }
}

const handleCustomExpandAll = () => {
  customJsonFormatRef.value?.expandAll()
  showMessage('自定义控制：已展开所有节点', 'info')
}

const handleCustomCollapseAll = () => {
  customJsonFormatRef.value?.collapseAll()
  showMessage('自定义控制：已折叠所有节点', 'info')
}

const checkCustomJsonStatus = () => {
  const isValid = customJsonFormatRef.value?.isValidJson()
  const errorMsg = customJsonFormatRef.value?.getParseError()
  if (isValid) {
    showMessage('自定义 JSON 格式正确', 'success')
  } else {
    showMessage(`自定义 JSON 格式错误: ${errorMsg}`, 'error')
  }
}

// Complex Nested Structure 区块的操作
const handleComplexCopy = async () => {
  try {
    await complexJsonFormatRef.value?.copyJson()
    showMessage('复杂 JSON 已复制！', 'success')
  } catch (error) {
    showMessage('复制失败', 'error')
  }
}

const showMessage = (msg: string, type: 'success' | 'error' | 'info') => {
  message.value = msg
  messageType.value = type
  setTimeout(() => {
    message.value = ''
  }, 3000)
}

// JsonFormat 示例数据 - 大型 JSON 测试性能
const sampleJson = ref(`{
  "name": "Lone Format Library - Performance Test",
  "version": "0.1.0",
  "description": "A Vue 3 component library for formatting with performance optimization",
  "bignumber": 12345678901234567890,
  "features": [
    "Tree-shaking support",
    "TypeScript support", 
    "Vue 3 Composition API",
    "VitePress documentation",
    "Performance optimized key editing",
    "Shallow copy for better performance"
  ],
  "config": {
    "build": {
      "target": "es2015",
      "minify": true,
      "bundle": true
    },
    "dev": {
      "port": 3000,
      "open": true,
      "hot": true
    },
    "performance": {
      "shallowCopy": true,
      "optimizedKeyRename": true,
      "lazyLoading": false
    }
  },
  "stats": {
    "downloads": 12345678901234567890,
    "stars": 1234,
    "forks": 56,
    "contributors": 8,
    "issues": 12,
    "pullRequests": 3
  },
  "largeDataset": {
    "users": {
      "user1": { "id": 1, "name": "Alice", "email": "alice@example.com", "role": "admin", "lastLogin": "2024-01-15T10:30:00Z" },
      "user2": { "id": 2, "name": "Bob", "email": "bob@example.com", "role": "user", "lastLogin": "2024-01-14T15:45:00Z" },
      "user3": { "id": 3, "name": "Charlie", "email": "charlie@example.com", "role": "moderator", "lastLogin": "2024-01-13T09:20:00Z" },
      "user4": { "id": 4, "name": "Diana", "email": "diana@example.com", "role": "user", "lastLogin": "2024-01-12T14:10:00Z" },
      "user5": { "id": 5, "name": "Eve", "email": "eve@example.com", "role": "admin", "lastLogin": "2024-01-11T11:55:00Z" }
    },
    "products": {
      "product1": { "id": "p1", "name": "Widget A", "price": 29.99, "category": "electronics", "stock": 100 },
      "product2": { "id": "p2", "name": "Gadget B", "price": 49.99, "category": "electronics", "stock": 50 },
      "product3": { "id": "p3", "name": "Tool C", "price": 19.99, "category": "hardware", "stock": 200 },
      "product4": { "id": "p4", "name": "Device D", "price": 99.99, "category": "electronics", "stock": 25 },
      "product5": { "id": "p5", "name": "Component E", "price": 15.99, "category": "parts", "stock": 300 }
    },
    "orders": {
      "order1": { "id": "o1", "userId": 1, "products": ["p1", "p3"], "total": 49.98, "status": "completed" },
      "order2": { "id": "o2", "userId": 2, "products": ["p2"], "total": 49.99, "status": "pending" },
      "order3": { "id": "o3", "userId": 3, "products": ["p4", "p5"], "total": 115.98, "status": "shipped" }
    }
  },
  "metadata": {
    "created": "2024-01-01T00:00:00.000Z",
    "updated": "2024-07-23T12:00:00.000Z",
    "active": true,
    "deprecated": false,
    "author": null
  }
}`)

const complexJson = ref(`{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "profile": {
        "age": 30,
        "address": {
          "street": "123 Main St",
          "city": "New York",
          "country": "USA"
        },
        "preferences": {
          "theme": "dark",
          "notifications": true,
          "languages": ["en", "es", "fr"]
        }
      }
    },
    {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "profile": {
        "age": 25,
        "address": {
          "street": "456 Oak Ave",
          "city": "Los Angeles",
          "country": "USA"
        },
        "preferences": {
          "theme": "light",
          "notifications": false,
          "languages": ["en", "zh"]
        }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "hasNext": false
  }
}`)

const invalidJson = ref(`{
  "name": "Invalid JSON",
  "missing": quote,
  "extra": "comma",
}`)
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>🎨 Lone Format Component Library</h1>
      <p>A Vue 3 component library demo with tree-shaking support</p>
    </header>

    <main class="app-main">
      <!-- DemoFormat 组件演示 -->
      <section class="demo-section">
        <h2>🎯 Demo Format Component</h2>
        <div class="component-grid">
          <div class="component-item">
            <h3>Basic Usage</h3>
            <DemoFormat title="Welcome to Lone Format"
              content="This is a basic demo format component showcasing the default styling and functionality."
              badge="Demo" type="info" :actions="basicActions" @action="handleAction" />
          </div>

          <div class="component-item">
            <h3>Success Type with Actions</h3>
            <DemoFormat title="Success Format"
              content="This example demonstrates the success type with multiple action buttons." badge="Success"
              type="success" :actions="advancedActions" @action="handleAction" />
          </div>
        </div>
      </section>

      <!-- JsonFormat 组件演示 -->
      <section class="demo-section">
        <h2>🔧 JSON Format Component</h2>

        <div class="component-item">
          <h3>Sample JSON with Large Numbers</h3>
          <p class="description">
            This example shows JSON formatting with large numbers (handled by json-bigint),
            nested objects, arrays, and different data types. Click on brackets to expand/collapse,
            and click on values to edit them.
          </p>
          <JsonFormat ref="jsonFormatRef" v-model="sampleJson" />
        </div>

        <div class="component-item">
          <h3>🎛️ Custom Control Example</h3>
          <p class="description">
            这个示例展示了如何使用自定义按钮控制 JsonFormat 组件。
            工具栏被隐藏，所有功能通过外部按钮控制。
          </p>

          <!-- 消息提示 - 仅用于自定义控制示例 -->
          <div v-if="message" :class="['message', `message--${messageType}`]">
            {{ message }}
          </div>

          <!-- 自定义控制按钮 -->
          <div class="custom-controls">
            <button @click="handleCustomCopy" class="custom-btn custom-btn--primary">
              📋 自定义复制
            </button>
            <button @click="handleCustomExpandAll" class="custom-btn custom-btn--success">
              📖 展开全部
            </button>
            <button @click="handleCustomCollapseAll" class="custom-btn custom-btn--warning">
              📕 折叠全部
            </button>
            <button @click="checkCustomJsonStatus" class="custom-btn custom-btn--info">
              🔍 检查状态
            </button>
          </div>

          <!-- 无工具栏的 JsonFormat -->
          <JsonFormat ref="customJsonFormatRef" v-model="sampleJson" :show-toolbar="false" />
        </div>

        <div class="component-item">
          <h3>Complex Nested Structure</h3>
          <p class="description">
            A more complex example with deeply nested objects and arrays.
            Test the collapsible functionality and value editing.
          </p>
          <JsonFormat ref="complexJsonFormatRef" v-model="complexJson" />

          <!-- 另一组自定义按钮 -->
          <div class="custom-controls" style="margin-top: 16px;">
            <button @click="handleComplexCopy" class="custom-btn custom-btn--secondary">
              📄 复制复杂 JSON
            </button>
          </div>
        </div>

        <div class="component-item">
          <h3>Invalid JSON Example</h3>
          <p class="description">
            This example shows how the component handles invalid JSON with proper error display.
          </p>
          <JsonFormat v-model="invalidJson" />
        </div>
      </section>

      <!-- 自定义内容示例 -->
      <section class="demo-section">
        <h2>🎨 Custom Content</h2>
        <DemoFormat title="Custom Content Example" badge="Custom" type="warning"
          :actions="[{ label: 'Acknowledge', type: 'warning' }]" @action="handleAction">
          <div class="custom-content">
            <p><strong>Custom Content:</strong> You can use slots to insert any content here!</p>
            <ul>
              <li>✅ Lists</li>
              <li>🖼️ Images</li>
              <li>🧩 Other Vue components</li>
              <li>📝 Rich text content</li>
            </ul>
          </div>
        </DemoFormat>
      </section>
    </main>

    <footer class="app-footer">
      <p>Built with ❤️ using Vue 3, TypeScript, and Vite</p>
    </footer>
  </div>
</template>

<style scoped>
.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.app-header {
  text-align: center;
  margin-bottom: 40px;
  padding: 40px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
}

.app-header h1 {
  margin: 0 0 16px 0;
  font-size: 2.5rem;
  font-weight: 700;
}

.app-header p {
  margin: 0;
  font-size: 1.2rem;
  opacity: 0.9;
}

.app-main {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.demo-section {
  padding: 24px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.demo-section h2 {
  margin: 0 0 24px 0;
  color: #333;
  font-size: 1.8rem;
  font-weight: 600;
  border-bottom: 2px solid #667eea;
  padding-bottom: 8px;
}

.component-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
}

.component-item {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.component-item h3 {
  margin: 0 0 12px 0;
  color: #495057;
  font-size: 1.2rem;
  font-weight: 600;
}

.description {
  margin: 0 0 16px 0;
  color: #6c757d;
  font-size: 0.9rem;
  line-height: 1.5;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #667eea;
}

.custom-content {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #ff9800;
}

.custom-content ul {
  margin: 12px 0 0 0;
  padding-left: 20px;
}

.custom-content li {
  margin: 8px 0;
}

.app-footer {
  text-align: center;
  margin-top: 40px;
  padding: 20px;
  color: #666;
  border-top: 1px solid #e9ecef;
}

@media (max-width: 768px) {
  .app {
    padding: 16px;
  }

  .app-header h1 {
    font-size: 2rem;
  }

  .demo-section {
    padding: 16px;
  }

  .component-grid {
    grid-template-columns: 1fr;
  }

  .component-item {
    padding: 16px;
  }
}

/* 消息提示样式 */
.message {
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-weight: 500;
  animation: fadeIn 0.3s ease;
}

.message--success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message--error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.message--info {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

/* 自定义控制按钮样式 */
.custom-controls {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.custom-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.custom-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.custom-btn--primary {
  background: #007bff;
  color: white;
}

.custom-btn--primary:hover {
  background: #0056b3;
}

.custom-btn--success {
  background: #28a745;
  color: white;
}

.custom-btn--success:hover {
  background: #1e7e34;
}

.custom-btn--warning {
  background: #ffc107;
  color: #212529;
}

.custom-btn--warning:hover {
  background: #e0a800;
}

.custom-btn--info {
  background: #17a2b8;
  color: white;
}

.custom-btn--info:hover {
  background: #138496;
}

.custom-btn--secondary {
  background: #6c757d;
  color: white;
}

.custom-btn--secondary:hover {
  background: #545b62;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
