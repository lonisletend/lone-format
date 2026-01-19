<script setup lang="ts">
import { ref } from 'vue'
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
<library>
  <book id="1" category="programming">
    <title lang="en">Learning TypeScript</title>
    <author>Josh Goldberg</author>
    <year>2022</year>
    <price currency="USD">39.99</price>
  </book>
  <book id="2" category="web">
    <title lang="en">Vue.js 3 Cookbook</title>
    <author>Heitor Ramon Ribeiro</author>
    <year>2023</year>
    <price currency="USD">44.99</price>
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

      <!-- Tab 内容 -->
      <div class="tab-content">
        <!-- JSON Format Tab -->
        <div v-show="activeTab === 'json'" class="component-item">
          <h3>JSON Format Component</h3>
          <p class="description">
            JSON 格式化组件，支持树形展示、语法高亮、展开/折叠等功能。
            工具栏功能已移除，用户可以通过组件暴露的方法自行实现工具栏。
          </p>
          <JsonFormat v-model="jsonExample" theme="github-light" />
        </div>

        <!-- XML Format Tab -->
        <div v-show="activeTab === 'xml'" class="component-item">
          <h3>XML Format Component</h3>
          <p class="description">
            XML 格式化组件，支持 XML 解析、树形展示、语法高亮等功能。
            工具栏功能已移除，用户可以通过组件暴露的方法自行实现工具栏。
          </p>
          <XmlFormat v-model="xmlExample" theme="github-light" />
        </div>

        <!-- SQL Format Tab -->
        <div v-show="activeTab === 'sql'" class="component-item">
          <h3>SQL Format Component</h3>
          <p class="description">
            SQL 格式化组件，支持多种 SQL 方言、语法高亮、格式化等功能。
            工具栏功能已移除，用户可以通过组件暴露的方法自行实现工具栏。
          </p>
          <SqlFormat v-model="sqlExample" theme="github-light" dialect="mysql" />
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
