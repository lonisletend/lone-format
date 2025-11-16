<template>
  <div class="xml-format" :class="`xml-format--${currentTheme.name}`">
    <!-- 工具栏 -->
    <div v-if="showToolbar" class="xml-format__toolbar">
      <div class="xml-format__actions">
        <button
          class="xml-format__btn xml-format__btn--primary"
          @click="copyXml"
          :disabled="!isValidXml"
          title="Copy XML"
        >
          📋 Copy
        </button>
        <button
          class="xml-format__btn xml-format__btn--secondary"
          @click="expandAll"
          :disabled="!isValidXml"
          title="Expand All"
        >
          ⬇️ Expand All
        </button>
        <button
          class="xml-format__btn xml-format__btn--secondary"
          @click="collapseAll"
          :disabled="!isValidXml"
          title="Collapse All"
        >
          ➡️ Collapse All
        </button>
        <button
          class="xml-format__btn xml-format__btn--secondary"
          @click="compressSource"
          :disabled="!isValidXml"
          title="Compress XML"
        >
          📦 Compress
        </button>
        <button
          class="xml-format__btn xml-format__btn--secondary"
          @click="formatSource"
          :disabled="!isValidXml"
          title="Format XML"
        >
          ✨ Format
        </button>
      </div>
      <div class="xml-format__info">
        <span
          v-if="isValidXml"
          class="xml-format__status xml-format__status--success"
        >
          ✅ Valid XML
        </span>
        <span v-else class="xml-format__status xml-format__status--error">
          ❌ Invalid XML
        </span>
      </div>
    </div>

    <div class="xml-format__content">
      <!-- 错误信息 -->
      <div v-if="!isValidXml" class="xml-format__error">
        <h4>XML Parse Error:</h4>
        <pre>{{ parseError }}</pre>
      </div>

      <!-- XML 树形展示 -->
      <div v-else class="xml-format__viewer">
        <!-- XML 声明 -->
        <div v-if="xmlDeclaration" class="xml-declaration" :style="{ color: currentTheme.colors.xmlDeclaration }">
          {{ xmlDeclaration }}
        </div>
        
        <!-- XML 节点（遍历数组） -->
        <XmlNode
          v-for="(node, index) in renderNodes"
          :key="index"
          :node="node"
          :index="index"
          :level="0"
          :expanded="expandedNodes"
          :theme="currentTheme"
          @toggle-expand="toggleExpand"
          @copy="copyValue"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import XmlNode from './XmlNode.vue'
import type { ThemeType, ParsedXml } from './types'
import { getTheme } from './themes'
import { validateXml, parseXml, buildXml, compressXml, formatXml, buildXmlFromArray } from './parser'

interface Props {
  modelValue: string
  readonly?: boolean
  maxDepth?: number
  showToolbar?: boolean
  theme?: ThemeType
  showComments?: boolean
  showCdata?: boolean
  preserveWhitespace?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  readonly: false,
  maxDepth: 10,
  showToolbar: true,
  theme: 'github-light',
  showComments: true,
  showCdata: true,
  preserveWhitespace: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'copy-success': [value: string]
  'copy-error': [error: Error]
  'expand-all': []
  'collapse-all': []
  'compress': [value: string]
  'format': [value: string]
}>()

// 响应式数据
const parsedXml = ref<ParsedXml | null>(null)
const parseError = ref<string>('')
const expandedNodes = ref<Set<string>>(new Set())

// 计算属性
const isValidXml = computed(() => parseError.value === '')

// 当前主题
const currentTheme = computed(() => getTheme(props.theme))

// 根节点（preserveOrder: true 返回数组）
const rootNodes = computed(() => {
  if (!parsedXml.value || !Array.isArray(parsedXml.value)) return []
  
  // 过滤掉 XML 声明，返回其余节点
  return parsedXml.value.filter(node => !node['?xml'])
})

// XML 声明
const xmlDeclaration = computed(() => {
  if (!parsedXml.value || !Array.isArray(parsedXml.value)) return null
  
  // 查找 XML 声明节点
  const declarationNode = parsedXml.value.find(node => node['?xml'])
  if (!declarationNode || !declarationNode[':@']) return null
  
  const attrs = declarationNode[':@']
  const parts = []
  if (attrs['@_version']) parts.push(`version="${attrs['@_version']}"`)
  if (attrs['@_encoding']) parts.push(`encoding="${attrs['@_encoding']}"`)
  if (attrs['@_standalone']) parts.push(`standalone="${attrs['@_standalone']}"`)
  
  return parts.length > 0 ? `<?xml ${parts.join(' ')}?>` : null
})

// 实际渲染的根节点（不包括声明）
const renderNodes = computed(() => {
  return rootNodes.value
})

// 解析 XML
const parseXmlString = (xmlString: string) => {
  if (!xmlString || !xmlString.trim()) {
    // 输入为空时，清空所有状态，不显示错误
    parseError.value = ''
    parsedXml.value = null
    return
  }

  try {
    // 验证
    const validation = validateXml(xmlString)
    if (!validation.valid) {
      parseError.value = validation.error || 'Invalid XML'
      parsedXml.value = null
      return
    }

    // 解析
    parsedXml.value = parseXml(xmlString)
    parseError.value = ''

    // 默认展开所有节点
    nextTick(() => {
      expandAll()
    })
  } catch (error) {
    parseError.value = error instanceof Error ? error.message : 'Unknown parse error'
    parsedXml.value = null
  }
}

// 切换节点展开状态
const toggleExpand = (path: string) => {
  if (expandedNodes.value.has(path)) {
    expandedNodes.value.delete(path)
  } else {
    expandedNodes.value.add(path)
  }
}

// 全部展开（适配 preserveOrder: true 的数组结构）
const expandAll = () => {
  const allPaths = new Set<string>()
  
  // 递归收集路径
  const collectPaths = (nodeArray: any[], currentPath: string = '') => {
    if (!Array.isArray(nodeArray)) return
    
    nodeArray.forEach((item, index) => {
      // 获取节点的标签名
      const tagName = Object.keys(item).find(key => !key.startsWith(':') && !key.startsWith('#'))
      if (!tagName) return
      
      const nodePath = currentPath ? `${currentPath}[${index}]` : `${tagName}[${index}]`
      allPaths.add(nodePath)
      
      // 递归处理子节点数组
      const children = item[tagName]
      if (Array.isArray(children)) {
        collectPaths(children, nodePath + '.' + tagName)
      }
    })
  }
  
  // 从根节点开始收集
  rootNodes.value.forEach((node, index) => {
    const tagName = Object.keys(node).find(key => !key.startsWith(':') && !key.startsWith('#'))
    if (tagName) {
      const path = `${tagName}[${index}]`
      allPaths.add(path)
      
      const children = node[tagName]
      if (Array.isArray(children)) {
        collectPaths(children, path + '.' + tagName)
      }
    }
  })
  
  expandedNodes.value = allPaths
  emit('expand-all')
}

// 全部折叠
const collapseAll = () => {
  expandedNodes.value.clear()
  emit('collapse-all')
}

// 复制 XML
const copyXml = async () => {
  if (!isValidXml.value || !parsedXml.value) return

  try {
    // 使用新的 buildXmlFromArray 处理 preserveOrder: true 的数组结构
    const xmlString = Array.isArray(parsedXml.value)
      ? buildXmlFromArray(parsedXml.value, { indent: '  ' })
      : buildXml(parsedXml.value, { format: true, indentBy: '  ' })

    await navigator.clipboard.writeText(xmlString)
    emit('copy-success', xmlString)
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Copy failed')
    emit('copy-error', err)
    console.error('Failed to copy XML:', error)
  }
}

// 压缩 XML
const compressSource = () => {
  if (!isValidXml.value || !parsedXml.value) return

  try {
    const compressed = compressXml(parsedXml.value)
    emit('update:modelValue', compressed)
    emit('compress', compressed)
  } catch (error) {
    console.error('Failed to compress XML:', error)
  }
}

// 格式化 XML
const formatSource = () => {
  if (!isValidXml.value) return

  try {
    const formatted = formatXml(props.modelValue, {
      format: true,
      indentBy: '  ',
    })
    emit('update:modelValue', formatted)
    emit('format', formatted)
  } catch (error) {
    console.error('Failed to format XML:', error)
  }
}

// 复制值
const copyValue = async (value: any) => {
  try {
    const textToCopy = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
    await navigator.clipboard.writeText(textToCopy)
    emit('copy-success', textToCopy)
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Copy failed')
    emit('copy-error', err)
    console.error('Failed to copy value:', error)
  }
}

// 监听 props 变化
watch(() => props.modelValue, (newValue) => {
  parseXmlString(newValue)
}, { immediate: true })

// 暴露方法给父组件调用
defineExpose({
  // 核心操作方法
  copyXml,
  compressSource,
  formatSource,
  expandAll,
  collapseAll,
  toggleExpand,

  // 状态访问方法
  isValidXml: () => isValidXml.value,
  getParsedXml: () => parsedXml.value,
  getExpandedNodes: () => expandedNodes.value,
  getParseError: () => parseError.value,

  // 工具方法
  parseXmlString: (xmlString: string) => parseXmlString(xmlString),
  copyValue: (value: any) => copyValue(value)
})
</script>

<style scoped>
.xml-format {
  border: 1px solid v-bind('currentTheme.colors.border');
  border-radius: 6px;
  background: v-bind('currentTheme.colors.background');
  overflow: hidden;
  /* 统一设置字体，避免子元素字体不一致 */
  font-family: Monaco, Consolas, "Lucida Console", "Courier New", ui-monospace, SFMono-Regular, "SF Mono", "Liberation Mono", Menlo, monospace;
  font-size: 14px;
  line-height: 1.6;
  color: v-bind('currentTheme.colors.text');
}

.xml-format__toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: v-bind('currentTheme.colors.surfaceBackground');
  border-bottom: 1px solid v-bind('currentTheme.colors.border');
  gap: 8px;
  flex-wrap: wrap;
}

.xml-format__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.xml-format__btn {
  padding: 6px 12px;
  border: 1px solid v-bind('currentTheme.colors.buttonBorder');
  border-radius: 6px;
  background: v-bind('currentTheme.colors.buttonBackground');
  color: v-bind('currentTheme.colors.buttonText');
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  white-space: nowrap;
}

.xml-format__btn:hover:not(:disabled) {
  background: v-bind('currentTheme.colors.buttonBackgroundHover');
}

.xml-format__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.xml-format__btn--primary {
  background: v-bind('currentTheme.colors.buttonPrimary');
  color: white;
  border-color: v-bind('currentTheme.colors.buttonPrimary');
}

.xml-format__btn--primary:hover:not(:disabled) {
  background: v-bind('currentTheme.colors.buttonPrimaryHover');
  border-color: v-bind('currentTheme.colors.buttonPrimaryHover');
}

.xml-format__info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.xml-format__status {
  font-size: 14px;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 12px;
  white-space: nowrap;
}

.xml-format__status--success {
  color: v-bind('currentTheme.colors.success');
  background: v-bind('currentTheme.colors.successBackground');
}

.xml-format__status--error {
  color: v-bind('currentTheme.colors.error');
  background: v-bind('currentTheme.colors.errorBackground');
}

.xml-format__content {
  padding: 8px 16px 8px 16px;
  overflow: auto;
  height: 100%;
  text-align: left;
}

.xml-format__error {
  color: v-bind('currentTheme.colors.error');
  background: v-bind('currentTheme.colors.errorBackground');
  padding: 16px;
  border-radius: 6px;
}

.xml-format__error h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
}

.xml-format__error pre {
  margin: 0;
  font-size: 13px;
  white-space: pre-wrap;
  word-break: break-word;
}

.xml-format__viewer {
  min-height: 100%;
  width: 100%;
}

.xml-declaration {
  opacity: 0.9;
  font-style: italic;
}
</style>
