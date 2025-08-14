<script setup lang="ts">
import { ref } from 'vue'
import JsonFormat from './components/JsonFormat/index.vue'
import type { JsonFormatExposed } from './components/JsonFormat/types'


// JsonFormat 组件引用
const jsonFormatRef = ref<JsonFormatExposed>()
const customJsonFormatRef = ref<JsonFormatExposed>()
const complexJsonFormatRef = ref<JsonFormatExposed>()
const filterTestRef = ref<JsonFormatExposed>()

// Filter 测试相关
const filterType = ref<'jsonpath' | 'js' | ''>('')
const filterExpression = ref('')
const filterTestJson = ref('')

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

// Filter 相关操作
const applyFilter = () => {
  if (filterType.value && filterExpression.value.trim()) {
    const config = {
      type: filterType.value as 'jsonpath' | 'js',
      expression: filterExpression.value.trim()
    }

    // 调用组件的 filter 方法
    filterTestRef.value?.filter(config)

    showMessage(`已应用 ${filterType.value} 过滤器`, 'info')
  } else {
    showMessage('请选择过滤类型并输入表达式', 'error')
  }
}

const clearFilter = () => {
  filterType.value = ''
  filterExpression.value = ''

  // 调用组件的 clearFilter 方法
  filterTestRef.value?.clearFilter()

  showMessage('已清除过滤器', 'info')
}

const loadFilterSampleData = () => {
  const sampleData = {
    "users": [
      { "id": 1, "name": "Alice", "age": 25, "department": "Engineering", "active": true },
      { "id": 2, "name": "Bob", "age": 30, "department": "Marketing", "active": false },
      { "id": 3, "name": "Charlie", "age": 35, "department": "Engineering", "active": true },
      { "id": 4, "name": "Diana", "age": 28, "department": "Sales", "active": true }
    ],
    "departments": {
      "Engineering": { "budget": 100000, "headCount": 15 },
      "Marketing": { "budget": 50000, "headCount": 8 },
      "Sales": { "budget": 75000, "headCount": 12 }
    },
    "company": {
      "name": "Tech Corp",
      "founded": 2010,
      "revenue": 5000000
    }
  }

  filterTestJson.value = JSON.stringify(sampleData, null, 2)
  showMessage('已加载示例数据', 'success')
}

const getFilterPlaceholder = () => {
  if (filterType.value === 'jsonpath') {
    return '例如: $.users[*].name 或 $.departments.Engineering'
  } else if (filterType.value === 'js') {
    return '例如: data.users.filter(u => u.age > 30) 或 data.company.name'
  }
  return '选择过滤类型后输入表达式'
}

// 初始化过滤器测试数据
loadFilterSampleData()

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

// 互动式编辑器的数据
const interactiveJson = ref(`{"status":200,"text":"","error":null,"data":[{"news_id":123456789012345678901234567890,"title":"iPhone X Review: Innovative future with real black technology","source":"Netease phone","rating":0.5},{"news_id":123456789012345678901234567891,"title":"Traffic paradise: How to design streets for people and unmanned vehicles in the future?","source":"Netease smart","link":"http://netease.smart/traffic-paradise/1235","rating":0.60},{"news_id":123456789012345678901234567892,"title":"Teslamask's American Business Relations: The government does not pay billions to build factories","source":"AI Finance","rating":0.8000,"members":["Daniel","Mike","John"]}]}`)

// Tab 管理
const activeTab = ref('interactive')
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>🎨 Lone Format Component Library</h1>
      <p>A Vue 3 component library demo with tree-shaking support</p>
    </header>

    <main class="app-main">

      <!-- JsonFormat 组件演示 -->
      <section class="demo-section">
        <h2>🔧 JSON Format Component</h2>

        <!-- Tab 导航 -->
        <div class="tab-navigation">
          <button :class="['tab-btn', { 'tab-btn--active': activeTab === 'interactive' }]"
            @click="activeTab = 'interactive'">
            🚀 Interactive Example
          </button>
          <button :class="['tab-btn', { 'tab-btn--active': activeTab === 'basic' }]" @click="activeTab = 'basic'">
            📄 Basic Example
          </button>
          <button :class="['tab-btn', { 'tab-btn--active': activeTab === 'custom' }]" @click="activeTab = 'custom'">
            🎛️ Custom Control
          </button>
          <button :class="['tab-btn', { 'tab-btn--active': activeTab === 'complex' }]" @click="activeTab = 'complex'">
            🌐 Complex Structure
          </button>
          <button :class="['tab-btn', { 'tab-btn--active': activeTab === 'filter' }]" @click="activeTab = 'filter'">
            🔍 Filter Test
          </button>
          <button :class="['tab-btn', { 'tab-btn--active': activeTab === 'invalid' }]" @click="activeTab = 'invalid'">
            ❌ Invalid JSON
          </button>
        </div>

        <!-- Tab 内容 -->
        <div class="tab-content">
          <!-- Basic Example Tab -->
          <div v-show="activeTab === 'basic'" class="component-item">
            <h3>Sample JSON with Large Numbers</h3>
            <p class="description">
              This example shows JSON formatting with large numbers (handled by json-bigint),
              nested objects, arrays, and different data types. Click on brackets to expand/collapse,
              and click on values to edit them.
            </p>
            <JsonFormat ref="jsonFormatRef" v-model="sampleJson" />
          </div>

          <!-- Custom Control Tab -->
          <div v-show="activeTab === 'custom'" class="component-item">
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

          <!-- Complex Structure Tab -->
          <div v-show="activeTab === 'complex'" class="component-item">
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

          <!-- Filter Test Tab -->
          <div v-show="activeTab === 'filter'" class="component-item">
            <h3>🔍 Filter Functionality Test</h3>
            <p class="description">
              Test the new Filter functionality that supports JSONPath and JavaScript expressions.
              Apply filters to extract specific data from the JSON structure.
            </p>

            <!-- Filter Controls -->
            <div class="filter-controls">
              <div class="control-row">
                <label for="filterType">Filter Type:</label>
                <select id="filterType" v-model="filterType" class="control-input">
                  <option value="">No Filter</option>
                  <option value="jsonpath">JSONPath</option>
                  <option value="js">JavaScript Expression</option>
                </select>
              </div>

              <div class="control-row">
                <label for="filterExpression">Filter Expression:</label>
                <input type="text" id="filterExpression" v-model="filterExpression"
                  :placeholder="getFilterPlaceholder()" class="control-input" @keyup.enter="applyFilter" />
              </div>

              <div class="control-actions">
                <button @click="applyFilter" class="custom-btn custom-btn--primary">
                  🔍 Apply Filter
                </button>
                <button @click="clearFilter" class="custom-btn">
                  🗑️ Clear Filter
                </button>
                <button @click="loadFilterSampleData" class="custom-btn custom-btn--secondary">
                  📝 Load Sample Data
                </button>
              </div>
            </div>

            <!-- Filter Examples -->
            <div class="filter-examples">
              <h4>📚 Example Expressions:</h4>
              <div class="examples-grid">
                <div class="example-item">
                  <strong>JSONPath Examples:</strong>
                  <ul>
                    <li><code>$.users[*].name</code> - All user names</li>
                    <li><code>$.users[?(@.age > 30)]</code> - Users older than 30</li>
                    <li><code>$.departments.Engineering</code> - Engineering department</li>
                    <li><code>$.users[0]</code> - First user</li>
                  </ul>
                </div>
                <div class="example-item">
                  <strong>JavaScript Examples:</strong>
                  <ul>
                    <li><code>data.users.filter(u => u.active)</code> - Active users</li>
                    <li><code>data.company.name</code> - Company name</li>
                    <li><code>data.users.map(u => u.name)</code> - User names array</li>
                    <li><code>data.users.length</code> - Number of users</li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- JSON Display -->
            <JsonFormat ref="filterTestRef" v-model="filterTestJson" />
          </div>

          <!-- Invalid JSON Tab -->
          <div v-show="activeTab === 'invalid'" class="component-item">
            <h3>Invalid JSON Example</h3>
            <p class="description">
              This example shows how the component handles invalid JSON with proper error display.
              The component gracefully handles syntax errors and provides helpful feedback.
            </p>
            <JsonFormat v-model="invalidJson" />

            <!-- 添加无效JSON的说明和示例 -->
            <div class="invalid-json-info">
              <h4>常见 JSON 语法错误示例：</h4>
              <div class="error-examples">
                <div class="error-example">
                  <strong>❌ 缺少引号：</strong>
                  <code>{ name: "value" }</code>
                  <span class="error-note">属性名必须用双引号包围</span>
                </div>
                <div class="error-example">
                  <strong>❌ 多余的逗号：</strong>
                  <code>{ "name": "value", }</code>
                  <span class="error-note">最后一个属性后不能有逗号</span>
                </div>
                <div class="error-example">
                  <strong>❌ 单引号：</strong>
                  <code>{ 'name': 'value' }</code>
                  <span class="error-note">JSON 只支持双引号</span>
                </div>
                <div class="error-example">
                  <strong>❌ 注释：</strong>
                  <code>{ /* comment */ "name": "value" }</code>
                  <span class="error-note">JSON 不支持注释</span>
                </div>
              </div>

              <div class="tips">
                <h4>💡 调试技巧：</h4>
                <ul>
                  <li>使用在线 JSON 验证工具检查语法</li>
                  <li>注意括号、引号的匹配</li>
                  <li>检查是否有多余的逗号</li>
                  <li>确保所有字符串都使用双引号</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Interactive Editor Tab -->
          <div v-show="activeTab === 'interactive'" class="component-item component-item--full">
            <h3>🚀 Interactive JSON Editor</h3>
            <p class="description">
              双向编辑器：左侧输入 JSON 字符串，右侧实时预览格式化结果。
              你可以在左侧编辑原始 JSON，也可以在右侧直接修改格式化后的键值，两边会实时同步。
            </p>

            <div class="interactive-editor">
              <div class="editor-panel">
                <div class="panel-header">
                  <h4>📝 JSON Input</h4>
                  <span class="panel-info">原始 JSON 字符串</span>
                </div>
                <textarea v-model="interactiveJson" class="json-textarea" placeholder="在这里输入 JSON 字符串..."
                  spellcheck="false"></textarea>
              </div>

              <div class="editor-panel">
                <div class="panel-header">
                  <h4>🎨 Formatted View</h4>
                  <span class="panel-info">格式化预览 (可编辑)</span>
                </div>
                <div class="json-format-wrapper">
                  <JsonFormat v-model="interactiveJson" />
                </div>
              </div>
            </div>
          </div>
        </div>
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

/* 互动式编辑器样式 */
.component-item--full {
  grid-column: 1 / -1;
  /* 占满整行 */
}

.interactive-editor {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  min-height: 500px;
}

.editor-panel {
  display: flex;
  flex-direction: column;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
  background: white;
}

.panel-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.panel-info {
  font-size: 0.875rem;
  opacity: 0.9;
}

.json-textarea {
  flex: 1;
  border: none;
  padding: 16px;
  font-family: Monaco, Consolas, "Lucida Console", "Courier New", ui-monospace, SFMono-Regular, "SF Mono", "Liberation Mono", Menlo, monospace;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  outline: none;
  background: #fafbfc;
  color: #24292f;
  tab-size: 2;
}

.json-textarea:focus {
  background: #ffffff;
  box-shadow: inset 0 0 0 2px #667eea;
}

.json-format-wrapper {
  flex: 1;
  overflow: hidden;
}

.json-format-wrapper .json-format {
  border: none;
  border-radius: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.json-format-wrapper .json-format__content {
  flex: 1;
  overflow: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .interactive-editor {
    grid-template-columns: 1fr;
    gap: 16px;
    min-height: auto;
  }

  .editor-panel {
    min-height: 300px;
  }
}

/* Tab 导航样式 */
.tab-navigation {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  border-bottom: 2px solid #e9ecef;
  overflow-x: auto;
  padding-bottom: 0;
}

.tab-btn {
  padding: 12px 20px;
  border: none;
  background: transparent;
  color: #6c757d;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 8px 8px 0 0;
  transition: all 0.2s ease;
  white-space: nowrap;
  position: relative;
  border-bottom: 3px solid transparent;
  outline: none;
  /* 移除默认焦点轮廓 */
}

.tab-btn:hover {
  background: #f8f9fa;
  color: #495057;
}

.tab-btn:focus {
  background: #f8f9fa;
  color: #495057;
}

.tab-btn--active {
  background: #ffffff;
  color: #667eea;
  border-bottom-color: #667eea;
  font-weight: 600;
}

.tab-btn--active:focus {
  background: #ffffff;
  color: #667eea;
}

.tab-content {
  min-height: 400px;
}

.tab-content .component-item {
  margin: 0;
  padding: 20px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-height: 500px;
  /* 确保所有 tab 内容有最小高度 */
  width: 100%;
  /* 确保所有 tab 内容宽度一致 */
  box-sizing: border-box;
  /* 包含padding和border在内的宽度计算 */
}

.tab-content .component-item--full {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%;
  box-sizing: border-box;
}

/* Invalid JSON tab 特殊样式 */
.invalid-json-info {
  margin-top: 24px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #dc3545;
}

.invalid-json-info h4 {
  margin: 0 0 16px 0;
  color: #dc3545;
  font-size: 1.1rem;
  font-weight: 600;
}

.error-examples {
  margin-bottom: 20px;
}

.error-example {
  margin-bottom: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #e9ecef;
}

.error-example:last-child {
  border-bottom: none;
}

.error-example strong {
  display: block;
  margin-bottom: 4px;
  color: #dc3545;
}

.error-example code {
  background: #f1f3f4;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: Monaco, Consolas, "Courier New", monospace;
  font-size: 0.9rem;
  color: #d73a49;
  display: block;
  margin: 4px 0;
}

.error-note {
  color: #6c757d;
  font-size: 0.85rem;
  font-style: italic;
}

.tips {
  background: white;
  padding: 16px;
  border-radius: 6px;
  border-left: 4px solid #17a2b8;
}

.tips h4 {
  margin: 0 0 12px 0;
  color: #17a2b8;
  font-size: 1rem;
}

.tips ul {
  margin: 0;
  padding-left: 20px;
}

.tips li {
  margin: 6px 0;
  color: #495057;
}

/* 移动端 Tab 响应式 */
@media (max-width: 768px) {
  .tab-navigation {
    flex-wrap: wrap;
    gap: 8px;
  }

  .tab-btn {
    padding: 10px 16px;
    font-size: 13px;
    flex: 1;
    min-width: auto;
  }
}

/* Filter Controls 样式 */
.filter-controls {
  margin-bottom: 24px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.control-row {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
}

.control-row label {
  font-weight: 600;
  color: #495057;
  min-width: 140px;
  text-align: right;
}

.control-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.15s ease;
}

.control-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.25);
}

.control-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.custom-btn--secondary {
  background: #6c757d;
  color: white;
}

.custom-btn--secondary:hover {
  background: #5a6268;
}

/* Filter Examples 样式 */
.filter-examples {
  margin-bottom: 24px;
  padding: 20px;
  background: #e3f2fd;
  border-radius: 8px;
  border-left: 4px solid #2196f3;
}

.filter-examples h4 {
  margin: 0 0 16px 0;
  color: #1976d2;
  font-size: 1.1rem;
  font-weight: 600;
}

.examples-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.example-item {
  background: white;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #bbdefb;
}

.example-item strong {
  display: block;
  margin-bottom: 12px;
  color: #1976d2;
  font-weight: 600;
}

.example-item ul {
  margin: 0;
  padding-left: 20px;
}

.example-item li {
  margin: 8px 0;
  color: #495057;
}

.example-item code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
  font-size: 13px;
  color: #d63384;
}

/* 移动端 Filter 响应式 */
@media (max-width: 768px) {
  .examples-grid {
    grid-template-columns: 1fr;
  }

  .control-row {
    flex-direction: column;
    align-items: stretch;
  }

  .control-row label {
    text-align: left;
    min-width: auto;
    margin-bottom: 8px;
  }

  .control-actions {
    justify-content: center;
  }
}
</style>
