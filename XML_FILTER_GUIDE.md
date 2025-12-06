# XML 格式化组件 - XPath 过滤功能

## 功能说明

XmlFormat 组件现在支持两种过滤方式：

1. **XPath 过滤**：使用标准 XPath 表达式查询 XML 节点
2. **JavaScript 过滤**：使用 JavaScript 表达式对解析后的 XML 数据进行过滤

## API 使用

### 1. 过滤方法

```typescript
// 应用过滤器
xmlFormatRef.value?.filter({
  type: 'xpath',  // 'xpath' | 'js'
  expression: '//book[@category="programming"]'
})

// 清除过滤器
xmlFormatRef.value?.clearFilter()
```

### 2. 暴露的 API

```typescript
interface XmlFormatExposed {
  // 核心操作方法
  copyXml: () => Promise<void>
  compressSource: () => void
  formatSource: () => void
  expandAll: () => void
  collapseAll: () => void
  toggleExpand: (path: string) => void

  // 过滤相关方法
  filter: (config: FilterConfig) => void
  clearFilter: () => void

  // 状态访问方法
  isValidXml: () => boolean
  getParsedXml: () => ParsedXml | null
  getFilteredXml: () => ParsedXml | null
  getExpandedNodes: () => Set<string>
  getParseError: () => string
  getFilterError: () => string

  // 工具方法
  parseXmlString: (xmlString: string) => void
  copyValue: (value: any) => Promise<void>
}
```

## XPath 过滤示例

### 基础示例

```xml
<!-- 示例 XML -->
<library name="City Library">
  <book id="1" category="programming">
    <title>Learning TypeScript</title>
    <author>Josh Goldberg</author>
    <year>2022</year>
  </book>
  <book id="2" category="web">
    <title>Vue.js 3 Cookbook</title>
    <author>Heitor Ramon Ribeiro</author>
    <year>2023</year>
  </book>
</library>
```

### XPath 表达式示例

```javascript
// 1. 选择所有 book 节点
xmlRef.value?.filter({
  type: 'xpath',
  expression: '//book'
})

// 2. 选择 category 为 programming 的书
xmlRef.value?.filter({
  type: 'xpath',
  expression: '//book[@category="programming"]'
})

// 3. 选择所有书的标题
xmlRef.value?.filter({
  type: 'xpath',
  expression: '//book/title'
})

// 4. 选择 year 大于 2022 的书
xmlRef.value?.filter({
  type: 'xpath',
  expression: '//book[year>2022]'
})

// 5. 选择第一本书
xmlRef.value?.filter({
  type: 'xpath',
  expression: '//book[1]'
})

// 6. 选择所有作者
xmlRef.value?.filter({
  type: 'xpath',
  expression: '//author'
})

// 7. 选择具有 lang 属性的 title
xmlRef.value?.filter({
  type: 'xpath',
  expression: '//title[@lang]'
})

// 8. 选择 library 根节点的 name 属性
xmlRef.value?.filter({
  type: 'xpath',
  expression: '/library/@name'
})
```

### 复杂 XPath 查询

```javascript
// 选择价格大于 40 美元的书
xmlRef.value?.filter({
  type: 'xpath',
  expression: '//book[price > 40]'
})

// 选择包含特定文本的标题
xmlRef.value?.filter({
  type: 'xpath',
  expression: '//title[contains(text(), "Vue")]'
})

// 选择第一个 programming 类别的书
xmlRef.value?.filter({
  type: 'xpath',
  expression: '//book[@category="programming"][1]'
})

// 组合条件
xmlRef.value?.filter({
  type: 'xpath',
  expression: '//book[@category="programming" and year>2020]'
})
```

## JavaScript 过滤示例

JavaScript 过滤使用 `$` 指代解析后的 XML 数据（fast-xml-parser 格式）。

```javascript
// 过滤 category 为 programming 的书
xmlRef.value?.filter({
  type: 'js',
  expression: '$[0].library[0].book.filter(b => b[":@"]["@_category"] === "programming")'
})

// 获取所有书的标题
xmlRef.value?.filter({
  type: 'js',
  expression: '$[0].library[0].book.map(b => ({ title: b.title }))'
})
```

## 完整使用示例

```vue
<template>
  <div>
    <div class="controls">
      <select v-model="filterType">
        <option value="">不过滤</option>
        <option value="xpath">XPath</option>
        <option value="js">JavaScript</option>
      </select>
      
      <input v-model="filterExpression" placeholder="输入过滤表达式" />
      
      <button @click="applyFilter">应用过滤</button>
      <button @click="clearFilter">清除过滤</button>
    </div>
    
    <XmlFormat ref="xmlRef" v-model="xmlData" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import XmlFormat from 'lone-format/xml-format'
import type { XmlFormatExposed, FilterType } from 'lone-format/xml-format'

const xmlData = ref(`<?xml version="1.0" encoding="UTF-8"?>
<library>
  <book id="1" category="programming">
    <title>TypeScript</title>
    <year>2022</year>
  </book>
  <book id="2" category="web">
    <title>Vue.js</title>
    <year>2023</year>
  </book>
</library>`)

const xmlRef = ref<XmlFormatExposed>()
const filterType = ref<FilterType | ''>('')
const filterExpression = ref('')

const applyFilter = () => {
  if (!filterType.value || !filterExpression.value) {
    alert('请选择过滤类型并输入表达式')
    return
  }
  
  xmlRef.value?.filter({
    type: filterType.value as FilterType,
    expression: filterExpression.value
  })
}

const clearFilter = () => {
  filterType.value = ''
  filterExpression.value = ''
  xmlRef.value?.clearFilter()
}
</script>
```

## XPath 语法参考

### 常用路径表达式

| 表达式 | 描述 |
|--------|------|
| `nodename` | 选取此节点的所有子节点 |
| `/` | 从根节点选取 |
| `//` | 从匹配选择的当前节点选择文档中的节点，而不考虑它们的位置 |
| `.` | 选取当前节点 |
| `..` | 选取当前节点的父节点 |
| `@` | 选取属性 |

### 谓词（Predicates）

| 表达式 | 描述 |
|--------|------|
| `[1]` | 选取第一个元素 |
| `[last()]` | 选取最后一个元素 |
| `[position()<3]` | 选取前两个元素 |
| `[@attr]` | 选取有 attr 属性的元素 |
| `[@attr='value']` | 选取 attr 属性值为 value 的元素 |
| `[node>value]` | 选取 node 值大于 value 的元素 |

### 常用函数

| 函数 | 描述 |
|------|------|
| `text()` | 选取文本内容 |
| `contains()` | 包含某文本 |
| `starts-with()` | 以某文本开始 |
| `count()` | 计数 |
| `sum()` | 求和 |

## 注意事项

1. **XPath 查询性能**：复杂的 XPath 表达式可能影响性能，建议使用简单直接的路径
2. **结果格式**：XPath 过滤后的结果会被包装在 `<result>` 根节点中（多个结果时）
3. **JavaScript 过滤**：需要了解 fast-xml-parser 的数据结构，属性以 `@_` 为前缀存储在 `:@` 对象中
4. **错误处理**：无效的表达式会在 UI 中显示错误信息，可通过 `getFilterError()` 方法获取

## 类型定义

```typescript
export type FilterType = 'xpath' | 'css-selector' | 'js'

export interface FilterConfig {
  type: FilterType
  expression: string
}
```
