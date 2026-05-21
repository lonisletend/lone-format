<script setup lang="ts">
import { ref, computed } from 'vue'
import JsonFormat from './components/JsonFormat/index.vue'
import XmlFormat from './components/XmlFormat/index.vue'
import SqlFormat from './components/SqlFormat/index.vue'

// JSON 示例数据
const jsonExample = ref(`{
  "name": "Lone Format Library",
  "version": "0.1.0",
  "description": "A Vue 3 component library for formatting JSON, XML, and SQL",
  "features": [
    "Tree-shaking support",
    "TypeScript support",
    "Vue 3 Composition API",
    "Multiple themes"
  ],
  "config": {
    "build": {
      "target": "es2015",
      "minify": true
    },
    "dev": {
      "port": 3000,
      "hot": true
    }
  }
}`)

// XML 示例数据
const xmlExample = ref(`<?xml version="1.0" encoding="UTF-8"?>
<!-- 这是图书馆的 XML 数据 -->
<library>
  <!-- 第一本书：TypeScript -->
  <book id="1" category="programming">
    <title lang="en">Learning TypeScript</title>
    <author>Josh Goldberg</author>
  </book>
  <!-- 第二本书：Vue.js -->
  <book id="2" category="web">
    <title lang="en">Vue.js 3 Cookbook</title>
    <author>Heitor Ramon Ribeiro</author>
    <Field source="o.test"></Field>
    <Field source="o.test1"/>
  </book>
</library>`)

// SQL 示例数据
const sqlExample = ref(`SELECT 
  u.id,
  u.username,
  u.email,
  COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.status = 'active'
GROUP BY u.id, u.username, u.email
ORDER BY order_count DESC
LIMIT 10;`)

// Tab 管理
const activeTab = ref('json')
const showTestcaseInput = ref(false)

const currentTestcase = computed({
  get: () => {
    if (activeTab.value === 'json') return jsonExample.value
    if (activeTab.value === 'xml') return xmlExample.value
    return sqlExample.value
  },
  set: (value: string) => {
    if (activeTab.value === 'json') {
      jsonExample.value = value
      return
    }

    if (activeTab.value === 'xml') {
      xmlExample.value = value
      return
    }

    sqlExample.value = value
  }
})

const currentInputPlaceholder = computed(() => {
  if (activeTab.value === 'json') return '请输入 JSON 测试用例...'
  if (activeTab.value === 'xml') return '请输入 XML 测试用例...'
  return '请输入 SQL 测试用例...'
})

// 主题管理
const jsonTheme = ref<'github-light' | 'github-dark' | 'min-light' | 'slack-ochin'>('github-light')
const xmlTheme = ref<'github-light' | 'github-dark' | 'min-light' | 'slack-ochin'>('github-light')
const sqlTheme = ref<'github-light' | 'github-dark' | 'min-light' | 'slack-ochin'>('github-light')

// 主题选项
const themeOptions = [
  { label: 'GitHub Light', value: 'github-light' },
  { label: 'GitHub Dark', value: 'github-dark' },
  { label: 'Min Light', value: 'min-light' },
  { label: 'Slack Ochin', value: 'slack-ochin' }
]

// JSON 组件引用
const jsonFormatRef = ref()

// XML 组件引用
const xmlFormatRef = ref()

// XML 排序状态
const xmlSorted = ref(false)

// XML 排序操作
// JSON 操作
const handleJsonExpandAll = () => {
  if (jsonFormatRef.value) {
    jsonFormatRef.value.expandAll()
  }
}

const handleJsonCollapseAll = () => {
  if (jsonFormatRef.value) {
    jsonFormatRef.value.collapseAll()
  }
}

const handleXmlSort = () => {
  if (xmlFormatRef.value) {
    xmlFormatRef.value.sort()
    xmlSorted.value = true
  }
}

const handleXmlClearSort = () => {
  if (xmlFormatRef.value) {
    xmlFormatRef.value.clearSort()
    xmlSorted.value = false
  }
}

const handleXmlExpandAll = () => {
  if (xmlFormatRef.value) {
    xmlFormatRef.value.expandAll()
  }
}

const handleXmlCollapseAll = () => {
  if (xmlFormatRef.value) {
    xmlFormatRef.value.collapseAll()
  }
}

const handleXmlCopy = async () => {
  if (xmlFormatRef.value) {
    await xmlFormatRef.value.copyXml()
    alert('XML 已复制到剪贴板！')
  }
}
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>🎨 Lone Format Component Library</h1>
      <p>A Vue 3 component library for formatting JSON, XML, and SQL</p>
    </header>

    <main class="app-main">
      <!-- Tab 导航 -->
      <div class="tab-navigation">
        <button :class="['tab-btn', { 'tab-btn--active': activeTab === 'json' }]" @click="activeTab = 'json'">
          📄 JSON Format
        </button>
        <button :class="['tab-btn', { 'tab-btn--active': activeTab === 'xml' }]" @click="activeTab = 'xml'">
          📝 XML Format
        </button>
        <button :class="['tab-btn', { 'tab-btn--active': activeTab === 'sql' }]" @click="activeTab = 'sql'">
          💾 SQL Format
        </button>
      </div>

      <div class="testcase-input-toggle">
        <button class="toolbar-btn toolbar-btn--secondary" @click="showTestcaseInput = !showTestcaseInput">
          {{ showTestcaseInput ? '✖ 关闭输入' : '✏️ 输入测试用例' }}
        </button>
      </div>

      <div v-if="showTestcaseInput" class="testcase-input-panel">
        <label class="testcase-input-label">当前测试用例（{{ activeTab.toUpperCase() }}，实时应用）</label>
        <textarea
          v-model="currentTestcase"
          class="testcase-input"
          :placeholder="currentInputPlaceholder"
          spellcheck="false"
        ></textarea>
      </div>

      <!-- Tab 内容 -->
      <div class="tab-content">
        <!-- JSON Format Tab -->
        <div v-show="activeTab === 'json'" class="component-item">
          <h3>JSON Format Component</h3>
          <p class="description">
            JSON 格式化组件，支持树形展示、语法高亮、展开/折叠等功能。
            工具栏功能已移除，用户可以通过组件暴露的方法自行实现工具栏。
          </p>
          
          <!-- JSON 工具栏 -->
          <div class="toolbar">
            <div class="toolbar-group">
              <button class="toolbar-btn toolbar-btn--secondary" @click="handleJsonExpandAll">
                📂 展开所有
              </button>
              <button class="toolbar-btn toolbar-btn--secondary" @click="handleJsonCollapseAll">
                📁 折叠所有
              </button>
            </div>
            <div class="toolbar-group">
              <label class="theme-label">主题：</label>
              <select v-model="jsonTheme" class="theme-select">
                <option v-for="option in themeOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>
          </div>
          
          <JsonFormat ref="jsonFormatRef" v-model="jsonExample" :theme="jsonTheme" />
        </div>

        <!-- XML Format Tab -->
        <div v-show="activeTab === 'xml'" class="component-item">
          <h3>XML Format Component</h3>
          <p class="description">
            XML 格式化组件，支持 XML 解析、树形展示、语法高亮等功能。
            <strong>新增：</strong>排序功能支持同时对元素属性和子元素标签进行排序。
          </p>
          
          <!-- XML 工具栏 -->
          <div class="toolbar">
            <div class="toolbar-group">
              <button class="toolbar-btn" @click="handleXmlSort" :disabled="xmlSorted" data-testid="xml-sort-btn">
                📊 排序 (属性 + 子元素)
              </button>
              <button class="toolbar-btn toolbar-btn--secondary" @click="handleXmlClearSort" :disabled="!xmlSorted" data-testid="xml-clear-sort-btn">
                🔄 取消排序
              </button>
            </div>
            <div class="toolbar-group">
              <button class="toolbar-btn toolbar-btn--secondary" @click="handleXmlExpandAll" data-testid="xml-expand-btn">
                📂 展开所有
              </button>
              <button class="toolbar-btn toolbar-btn--secondary" @click="handleXmlCollapseAll" data-testid="xml-collapse-btn">
                📁 折叠所有
              </button>
              <button class="toolbar-btn toolbar-btn--secondary" @click="handleXmlCopy" data-testid="xml-copy-btn">
                📋 复制 XML
              </button>
            </div>
            <div class="toolbar-group">
              <label class="theme-label">主题：</label>
              <select v-model="xmlTheme" class="theme-select">
                <option v-for="option in themeOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>
            <div class="toolbar-status" v-if="xmlSorted" data-testid="xml-sort-status">
              ✅ 已排序
            </div>
          </div>
          
          <XmlFormat ref="xmlFormatRef" v-model="xmlExample" :theme="xmlTheme" />
        </div>

        <!-- SQL Format Tab -->
        <div v-show="activeTab === 'sql'" class="component-item">
          <h3>SQL Format Component</h3>
          <p class="description">
            SQL 格式化组件，支持多种 SQL 方言、语法高亮、格式化等功能。
            工具栏功能已移除，用户可以通过组件暴露的方法自行实现工具栏。
          </p>
          
          <!-- SQL 工具栏 -->
          <div class="toolbar">
            <div class="toolbar-group">
              <label class="theme-label">主题：</label>
              <select v-model="sqlTheme" class="theme-select">
                <option v-for="option in themeOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>
          </div>
          
          <SqlFormat v-model="sqlExample" :theme="sqlTheme" dialect="mysql" />
        </div>
      </div>
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
  gap: 20px;
}

.tab-navigation {
  display: flex;
  gap: 4px;
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
}

.tab-btn:hover {
  background: #f8f9fa;
  color: #495057;
}

.tab-btn--active {
  background: #ffffff;
  color: #667eea;
  border-bottom-color: #667eea;
  font-weight: 600;
}

.tab-content {
  min-height: 500px;
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
  font-size: 1.4rem;
  font-weight: 600;
}

.description {
  margin: 0 0 16px 0;
  color: #6c757d;
  font-size: 0.9rem;
  line-height: 1.6;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #667eea;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid #e9ecef;
}

.toolbar-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.toolbar-btn {
  padding: 8px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
}

.toolbar-btn:hover:not(:disabled) {
  background: #5568d3;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
}

.toolbar-btn:active:not(:disabled) {
  transform: translateY(0);
}

.toolbar-btn:disabled {
  background: #e9ecef;
  color: #adb5bd;
  cursor: not-allowed;
}

.toolbar-btn--secondary {
  background: #6c757d;
}

.toolbar-btn--secondary:hover:not(:disabled) {
  background: #5a6268;
}

.toolbar-status {
  padding: 8px 16px;
  background: #d4edda;
  color: #155724;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid #c3e6cb;
}

.testcase-input-toggle {
  display: flex;
  justify-content: flex-end;
}

.testcase-input-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.testcase-input-label {
  font-size: 14px;
  font-weight: 600;
  color: #495057;
}

.testcase-input {
  width: 100%;
  min-height: 180px;
  resize: vertical;
  padding: 12px;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  background: white;
  color: #24292f;
  font-family: Monaco, Consolas, 'Lucida Console', 'Courier New', ui-monospace, SFMono-Regular, 'SF Mono', 'Liberation Mono', Menlo, monospace;
  font-size: 13px;
  line-height: 1.5;
  outline: none;
}

.testcase-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.theme-label {
  font-size: 14px;
  font-weight: 500;
  color: #495057;
}

.theme-select {
  padding: 8px 12px;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  background: white;
  color: #24292f;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  outline: none;
}

.theme-select:hover {
  border-color: #667eea;
}

.theme-select:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
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

  .tab-btn {
    padding: 10px 16px;
    font-size: 13px;
  }
}
</style>
