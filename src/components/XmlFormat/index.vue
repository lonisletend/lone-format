<template>
  <div class="xml-format" :class="`xml-format--${currentTheme.name}`">
    <div class="xml-format__content">
      <!-- 解析错误信息 -->
      <div v-if="!isValidXml" class="xml-format__error">
        <h4>XML Parse Error:</h4>
        <pre>{{ parseError }}</pre>
      </div>

      <!-- 过滤错误信息 -->
      <div v-else-if="filterError" class="xml-format__error">
        <h4>Filter Error:</h4>
        <pre>{{ filterError }}</pre>
      </div>

      <!-- XML 树形展示 -->
      <div v-else class="xml-format__viewer">
        <!-- XML 声明 -->
        <div v-if="xmlDeclaration" class="xml-declaration" :style="{ color: currentTheme.colors.xmlDeclaration }">
          {{ xmlDeclaration }}
        </div>
        
        <!-- XML 节点（遍历数组） -->
        <XmlNode
          v-for="(item, idx) in renderNodes"
          :key="idx"
          :node="item.node"
          :index="item.originalIndex"
          :level="0"
          :expanded="expandedNodes"
          :theme="currentTheme"
          :selfClosingTags="selfClosingTags"
          @toggle-expand="toggleExpand"
          @copy="copyValue"
          @update:tagName="handleTagNameUpdate"
          @update:attributeName="handleAttributeNameUpdate"
          @update:attributeValue="handleAttributeValueUpdate"
          @update:textContent="handleTextContentUpdate"
          @update:cdataContent="handleCdataContentUpdate"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import xpath from 'xpath'
// @ts-ignore
import { DOMParser, XMLSerializer } from '@xmldom/xmldom'
import XmlNode from './XmlNode.vue'
import type { ThemeType, ParsedXml, FilterConfig } from './types'
import { getTheme } from './themes'
import { validateXml, parseXml, buildXml, compressXml, formatXml, buildXmlFromArray, extractSelfClosingTags, annotateSelfClosingInfo } from './parser'

interface Props {
  modelValue: string
  readonly?: boolean
  maxDepth?: number
  theme?: ThemeType
  showComments?: boolean
  showCdata?: boolean
  preserveWhitespace?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  readonly: false,
  maxDepth: 10,
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
const filteredXml = ref<ParsedXml | null>(null)
const filterError = ref<string>('')
const originalXmlString = ref<string>('') // 保存原始 XML 字符串用于 XPath 查询
const selfClosingTags = ref<Set<string>>(new Set()) // 保存自闭合标签信息
const isSorted = ref<boolean>(false) // 属性排序状态

// 计算属性
const isValidXml = computed(() => parseError.value === '')

// 深度排序函数：递归地对所有元素的属性和子元素标签进行排序
const sortXmlAttributes = (data: any): any => {
  if (!data || typeof data !== 'object') {
    return data
  }

  // 如果是数组（preserveOrder: true 的结构）
  if (Array.isArray(data)) {
    // 处理数组中的每个元素
    const processedArray = data.map(item => sortXmlAttributes(item))
    
    // 将数组分为两部分：可排序的元素节点 和 不可排序的内容节点（注释、文本等）
    const sortableElements: Array<{ item: any; originalIndex: number }> = []
    const contentNodes: Array<{ item: any; originalIndex: number }> = []
    
    processedArray.forEach((item, index) => {
      if (!item || typeof item !== 'object') {
        contentNodes.push({ item, originalIndex: index })
        return
      }
      
      const keys = Object.keys(item)
      const tagName = keys.find(key => !key.startsWith('?') && !key.startsWith(':') && !key.startsWith('#') && !key.startsWith('__')) || keys[0] || ''
      
      // 注释、文本、CDATA 等内容节点不参与排序
      if (tagName.startsWith('#') || tagName.startsWith('__')) {
        contentNodes.push({ item, originalIndex: index })
      } else if (tagName.startsWith('?')) {
        // XML 声明等也不参与排序
        contentNodes.push({ item, originalIndex: index })
      } else {
        // 普通元素节点参与排序
        sortableElements.push({ item, originalIndex: index })
      }
    })
    
    // 对普通元素节点按标签名排序
    sortableElements.sort((a, b) => {
      const getTagName = (obj: any): string => {
        const keys = Object.keys(obj)
        for (const key of keys) {
          if (!key.startsWith('?') && !key.startsWith(':') && !key.startsWith('#') && !key.startsWith('__')) {
            return key
          }
        }
        return keys[0] || ''
      }
      
      const tagA = getTagName(a.item)
      const tagB = getTagName(b.item)
      return tagA.localeCompare(tagB)
    })
    
    // 重新组合：按原始索引位置插入内容节点，中间插入排序后的元素节点
    const result: any[] = []
    let sortedIndex = 0
    
    for (let i = 0; i < processedArray.length; i++) {
      const contentNode = contentNodes.find(n => n.originalIndex === i)
      if (contentNode) {
        // 这个位置是内容节点，直接插入
        result.push(contentNode.item)
      } else {
        // 这个位置原本是元素节点，插入排序后的元素
        if (sortedIndex < sortableElements.length) {
          result.push(sortableElements[sortedIndex].item)
          sortedIndex++
        }
      }
    }
    
    return result
  }

  // 处理对象
  const sorted: any = {}
  
  // 对所有 key 进行排序
  const keys = Object.keys(data).sort((a, b) => {
    // 保持特殊 key 的顺序：
    // 1. XML 声明 (?xml) 始终在前
    // 2. 属性对象 (:@) 始终在标签名之后
    // 3. 文本内容 (#text) 在属性之后
    // 4. CDATA (#cdata 或 __cdata) 在文本之后
    // 5. 注释 (#comment) 在最后
    
    const aIsSpecial = a.startsWith('?') || a.startsWith(':') || a.startsWith('#') || a.startsWith('__')
    const bIsSpecial = b.startsWith('?') || b.startsWith(':') || b.startsWith('#') || b.startsWith('__')
    
    // 特殊 key 优先级顺序
    const specialOrder: Record<string, number> = {
      '?xml': 0,
      ':@': 1,
      '#text': 2,
      '__cdata': 3,
      '#cdata': 3,
      '#comment': 4
    }
    
    if (aIsSpecial && bIsSpecial) {
      // 两个都是特殊 key，按预定义顺序排序
      const aOrder = specialOrder[a] ?? 99
      const bOrder = specialOrder[b] ?? 99
      return aOrder - bOrder
    } else if (aIsSpecial) {
      // a 是特殊 key，b 不是，a 排在前面
      return -1
    } else if (bIsSpecial) {
      // b 是特殊 key，a 不是，b 排在前面
      return 1
    } else {
      // 两个都不是特殊 key，按字母顺序排序
      return a.localeCompare(b)
    }
  })
  
  for (const key of keys) {
    const value = data[key]
    
    // 对于属性对象 (:@)，也对其内部的属性名进行排序
    if (key === ':@' && value && typeof value === 'object' && !Array.isArray(value)) {
      const sortedAttrs: any = {}
      const attrKeys = Object.keys(value).sort()
      for (const attrKey of attrKeys) {
        sortedAttrs[attrKey] = value[attrKey]
      }
      sorted[key] = sortedAttrs
    } else {
      // 递归处理其他值
      sorted[key] = sortXmlAttributes(value)
    }
  }
  
  return sorted
}

// 排序后的 XML 数据（不修改原始数据）
const sortedXml = computed(() => {
  const baseData = filteredXml.value !== null ? filteredXml.value : parsedXml.value
  if (!baseData || !isSorted.value) {
    return baseData
  }
  return sortXmlAttributes(baseData)
})

// 当前显示的 XML 数据（可能是过滤后的或排序后的）
const displayXml = computed(() => {
  if (filterError.value) {
    return null
  }
  return sortedXml.value
})

// 当前主题
const currentTheme = computed(() => getTheme(props.theme))

// 根节点（preserveOrder: true 返回数组）
const rootNodes = computed(() => {
  const data = displayXml.value
  if (!data || !Array.isArray(data)) return []
  
  // 过滤掉 XML 声明，但保留原始索引信息
  return data
    .map((node, index) => ({ node, originalIndex: index }))
    .filter(item => !item.node['?xml'])
})

// XML 声明
const xmlDeclaration = computed(() => {
  const data = displayXml.value
  if (!data || !Array.isArray(data)) return null
  
  // 查找 XML 声明节点
  const declarationNode = data.find(node => node['?xml'])
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
    originalXmlString.value = ''
    filteredXml.value = null
    filterError.value = ''
    return
  }

  try {
    // 验证
    const validation = validateXml(xmlString)
    if (!validation.valid) {
      parseError.value = validation.error || 'Invalid XML'
      parsedXml.value = null
      originalXmlString.value = ''
      selfClosingTags.value = new Set()
      return
    }

    // 保存原始 XML 字符串用于 XPath 查询
    originalXmlString.value = xmlString
    
    // 提取自闭合标签信息
    selfClosingTags.value = extractSelfClosingTags(xmlString)

    // 解析
    parsedXml.value = parseXml(xmlString)
    // 为每个元素注解精确的自闭合状态，供 XmlNode 渲染使用
    if (Array.isArray(parsedXml.value)) {
      annotateSelfClosingInfo(parsedXml.value, xmlString)
    }
    parseError.value = ''

    // 清除之前的过滤结果
    filteredXml.value = null
    filterError.value = ''

    // 默认展开所有节点
    nextTick(() => {
      expandAll()
    })
  } catch (error) {
    parseError.value = error instanceof Error ? error.message : 'Unknown parse error'
    parsedXml.value = null
    originalXmlString.value = ''
    filteredXml.value = null
    filterError.value = ''
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
      
      // 路径格式: tagName[index] 或 parentPath.tagName[index]
      const nodePath = currentPath ? `${currentPath}.${tagName}[${index}]` : `${tagName}[${index}]`
      allPaths.add(nodePath)
      
      // 递归处理子节点数组
      const children = item[tagName]
      if (Array.isArray(children)) {
        collectPaths(children, nodePath + '.' + tagName)
      }
    })
  }
  
  // 从根节点开始收集 - 适配新的 { node, originalIndex } 结构
  rootNodes.value.forEach(({ node, originalIndex }) => {
    const tagName = Object.keys(node).find(key => !key.startsWith(':') && !key.startsWith('#'))
    if (tagName) {
      // 使用 originalIndex 而不是循环索引
      const path = `${tagName}[${originalIndex}]`
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
  if (!isValidXml.value) return

  try {
    // 使用 displayXml 以确保复制的是当前显示的数据（可能是过滤后的）
    const dataToUse = displayXml.value || parsedXml.value
    if (!dataToUse) return

    // 使用新的 buildXmlFromArray 处理 preserveOrder: true 的数组结构
    const xmlString = Array.isArray(dataToUse)
      ? buildXmlFromArray(dataToUse, { indent: '  ', originalXml: originalXmlString.value || undefined })
      : buildXml(dataToUse, { format: true, indentBy: '  ' })

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
    const compressed = compressXml(parsedXml.value, props.modelValue)
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

// 应用过滤器（仅支持 XPath）
const applyFilter = (config: FilterConfig) => {
  if (!config || !config.expression.trim()) {
    clearFilter()
    return
  }

  if (!parsedXml.value || !originalXmlString.value) {
    filterError.value = 'No valid XML data to filter'
    return
  }

  try {
    // 使用 XPath 过滤
    // 解析 XML 为 DOM
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(originalXmlString.value, 'text/xml')

    // 执行 XPath 查询
    const nodes = xpath.select(config.expression, xmlDoc)

    if (!nodes || (Array.isArray(nodes) && nodes.length === 0)) {
      filteredXml.value = []
      filterError.value = ''
      return
    }

    // 将 XPath 结果转换为 XML 字符串
    const serializer = new XMLSerializer()
    let resultXml = ''

    if (Array.isArray(nodes)) {
      // 多个节点，包装在根节点中
      resultXml = '<result>\n'
      nodes.forEach((node: any) => {
        if (node.nodeType === 1) { // Element node
          resultXml += '  ' + serializer.serializeToString(node) + '\n'
        } else if (node.nodeType === 2) { // Attribute node
          resultXml += `  <attribute name="${node.name}" value="${node.value}"/>\n`
        } else if (node.nodeType === 3) { // Text node
          resultXml += `  <text>${node.nodeValue}</text>\n`
        }
      })
      resultXml += '</result>'
    } else {
      // 单个节点
      resultXml = serializer.serializeToString(nodes)
    }

    // 重新解析为内部格式
    filteredXml.value = parseXml(resultXml)
    filterError.value = ''

    // 重新展开所有节点
    nextTick(() => {
      expandAll()
    })
  } catch (error) {
    filterError.value = error instanceof Error ? error.message : 'Filter execution error'
    filteredXml.value = null
  }
}

// 清除过滤器
const clearFilter = () => {
  filteredXml.value = null
  filterError.value = ''
  
  // 清除过滤后，恢复展开状态
  nextTick(() => {
    expandAll()
  })
}

// 启用排序
const sort = () => {
  isSorted.value = true
  // 排序后重新展开所有节点，因为数组顺序改变会导致路径索引不匹配
  nextTick(() => {
    expandAll()
  })
}

// 清除排序
const clearSort = () => {
  isSorted.value = false
  // 取消排序后重新展开所有节点，恢复原始顺序的路径
  nextTick(() => {
    expandAll()
  })
}

// 获取值字符串（与 copyValue 的加工逻辑保持一致）
const getValue = (value: any): string => {
  return typeof value === 'string' ? value : (JSON.stringify(value, null, 2) ?? 'undefined')
}

// 复制值
const copyValue = async (value: any) => {
  try {
    const textToCopy = getValue(value)
    await navigator.clipboard.writeText(textToCopy)
    emit('copy-success', textToCopy)
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Copy failed')
    emit('copy-error', err)
    console.error('Failed to copy value:', error)
  }
}

// 更新标签名（同时更新开始和结束标签）
const handleTagNameUpdate = (path: string, oldTag: string, newTag: string) => {
  if (!parsedXml.value || !Array.isArray(parsedXml.value)) return
  
  try {
    // 路径格式: "library[0].library.book[0].book.title[0]"
    // 需要导航到 parsedXml.value -> [0] (library节点) -> library -> [0] (book节点) -> book -> [0] (title节点)
    const pathParts = path.split(/\./).filter(Boolean)
    let current: any = parsedXml.value
    
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i]
      const match = part.match(/^(.+?)\[(\d+)\]$/)
      
      if (match) {
        const tag = match[1]
        const index = parseInt(match[2])
        
        if (i === pathParts.length - 1) {
          // 最后一部分，进行更新
          if (Array.isArray(current) && current[index]) {
            const node = current[index]
            // 如果节点有旧标签，重命名它
            if (node[oldTag]) {
              const content = node[oldTag]
              delete node[oldTag]
              node[newTag] = content
              
              // 如果旧标签是自闭合的，更新 selfClosingTags 集合
              if (selfClosingTags.value.has(oldTag)) {
                selfClosingTags.value.delete(oldTag)
                selfClosingTags.value.add(newTag)
              }
            }
          }
        } else {
          // 继续向下导航
          if (Array.isArray(current) && current[index]) {
            current = current[index]
          }
        }
      } else {
        // 普通标签名，继续深入
        if (current[part]) {
          current = current[part]
        }
      }
    }
    
    // 重新生成 XML 字符串并触发更新
    const xmlString = buildXmlFromArray(parsedXml.value, {
      indent: '  ',
      originalXml: originalXmlString.value || undefined
    })
    emit('update:modelValue', xmlString)
  } catch (error) {
    console.error('Failed to update tag name:', error)
  }
}

// 更新属性名
const handleAttributeNameUpdate = (path: string, oldAttrName: string, newAttrName: string) => {
  if (!parsedXml.value || !Array.isArray(parsedXml.value)) return
  
  try {
    const pathParts = path.split(/\./).filter(Boolean)
    let current: any = parsedXml.value
    
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i]
      const match = part.match(/^(.+?)\[(\d+)\]$/)
      
      if (match) {
        const tag = match[1]
        const index = parseInt(match[2])
        
        if (i === pathParts.length - 1) {
          // 最后一部分，更新属性
          if (Array.isArray(current) && current[index]) {
            const node = current[index]
            const attrs = node[':@']
            
            if (attrs && attrs[`@_${oldAttrName}`] !== undefined) {
              const value = attrs[`@_${oldAttrName}`]
              delete attrs[`@_${oldAttrName}`]
              attrs[`@_${newAttrName}`] = value
            }
          }
        } else {
          // 继续向下导航
          if (Array.isArray(current) && current[index]) {
            current = current[index]
          }
        }
      } else {
        // 普通标签名，继续深入
        if (current[part]) {
          current = current[part]
        }
      }
    }
    
    // 重新生成 XML 字符串并触发更新
    const xmlString = buildXmlFromArray(parsedXml.value, { indent: '  ', originalXml: originalXmlString.value || undefined })
    emit('update:modelValue', xmlString)
  } catch (error) {
    console.error('Failed to update attribute name:', error)
  }
}

// 更新属性值
const handleAttributeValueUpdate = (path: string, attrName: string, newValue: string) => {
  if (!parsedXml.value || !Array.isArray(parsedXml.value)) return
  
  try {
    const pathParts = path.split(/\./).filter(Boolean)
    let current: any = parsedXml.value
    
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i]
      const match = part.match(/^(.+?)\[(\d+)\]$/)
      
      if (match) {
        const tag = match[1]
        const index = parseInt(match[2])
        
        if (i === pathParts.length - 1) {
          // 最后一部分，更新属性值
          // 直接使用索引访问，不需要过滤
          if (Array.isArray(current) && current[index]) {
            const node = current[index]
            const attrs = node[':@']
            
            if (attrs && attrs[`@_${attrName}`] !== undefined) {
              attrs[`@_${attrName}`] = newValue
            }
          }
        } else {
          // 继续向下导航 - 直接使用索引
          if (Array.isArray(current) && current[index]) {
            current = current[index]
          }
        }
      } else {
        // 普通标签名，继续深入
        if (current[part]) {
          current = current[part]
        }
      }
    }
    
    // 重新生成 XML 字符串并触发更新
    const xmlString = buildXmlFromArray(parsedXml.value, { indent: '  ', originalXml: originalXmlString.value || undefined })
    emit('update:modelValue', xmlString)
  } catch (error) {
    console.error('Failed to update attribute value:', error)
  }
}

// 更新文本内容
const handleTextContentUpdate = (path: string, newContent: string) => {
  if (!parsedXml.value || !Array.isArray(parsedXml.value)) return
  
  try {
    const pathParts = path.split(/\./).filter(Boolean)
    let current: any = parsedXml.value
    let tagName = ''
    
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i]
      const match = part.match(/^(.+?)\[(\d+)\]$/)
      
      if (match) {
        const tag = match[1]
        const index = parseInt(match[2])
        
        if (i === pathParts.length - 1) {
          // 最后一部分，更新文本内容
          if (Array.isArray(current) && current[index]) {
            const node = current[index]
            // 找到标签名
            tagName = Object.keys(node).find(key => !key.startsWith(':') && !key.startsWith('#')) || ''
            
            if (tagName && Array.isArray(node[tagName])) {
              const children = node[tagName]
              // 查找或创建文本节点
              const textNodeIndex = children.findIndex((child: any) => child['#text'] !== undefined)
              
              if (textNodeIndex !== -1) {
                children[textNodeIndex]['#text'] = newContent
              } else {
                // 如果没有文本节点，创建一个
                children.push({ '#text': newContent })
              }
            }
          }
        } else {
          // 继续向下导航
          if (Array.isArray(current) && current[index]) {
            current = current[index]
          }
        }
      } else {
        // 普通标签名，继续深入
        if (current[part]) {
          current = current[part]
        }
      }
    }
    
    // 重新生成 XML 字符串并触发更新
    const xmlString = buildXmlFromArray(parsedXml.value, { indent: '  ', originalXml: originalXmlString.value || undefined })
    emit('update:modelValue', xmlString)
  } catch (error) {
    console.error('Failed to update text content:', error)
  }
}

// 更新 CDATA 内容
const handleCdataContentUpdate = (path: string, newContent: string) => {
  if (!parsedXml.value || !Array.isArray(parsedXml.value)) return
  
  try {
    const pathParts = path.split(/\./).filter(Boolean)
    let current: any = parsedXml.value
    
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i]
      const match = part.match(/^(.+?)\[(\d+)\]$/)
      
      if (match) {
        const tag = match[1]
        const index = parseInt(match[2])
        
        if (i === pathParts.length - 1) {
          // 最后一部分，更新 CDATA 内容
          if (Array.isArray(current) && current[index]) {
            const node = current[index]
            // 找到标签名
            const tagName = Object.keys(node).find(key => !key.startsWith(':') && !key.startsWith('#'))
            
            if (tagName && Array.isArray(node[tagName])) {
              const children = node[tagName]
              // 查找 CDATA 节点
              const cdataNodeIndex = children.findIndex((child: any) => child['__cdata'] !== undefined)
              
              if (cdataNodeIndex !== -1) {
                // 更新现有的 CDATA 节点
                const cdataNode = children[cdataNodeIndex]
                if (Array.isArray(cdataNode['__cdata']) && cdataNode['__cdata'][0]) {
                  cdataNode['__cdata'][0]['#text'] = newContent
                }
              } else {
                // 如果没有 CDATA 节点，创建一个
                children.push({
                  '__cdata': [{ '#text': newContent }]
                })
              }
            }
          }
        } else {
          // 继续向下导航
          if (Array.isArray(current) && current[index]) {
            current = current[index]
          }
        }
      } else {
        // 普通标签名，继续深入
        if (current[part]) {
          current = current[part]
        }
      }
    }
    
    // 重新生成 XML 字符串并触发更新
    const xmlString = buildXmlFromArray(parsedXml.value, { indent: '  ', originalXml: originalXmlString.value || undefined })
    emit('update:modelValue', xmlString)
  } catch (error) {
    console.error('Failed to update CDATA content:', error)
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

  // 过滤相关方法
  filter: applyFilter,
  clearFilter,

  // 排序相关方法
  sort,
  clearSort,
  isSorted: () => isSorted.value,

  // 状态访问方法
  isValidXml: () => isValidXml.value,
  getParsedXml: () => parsedXml.value,
  getFilteredXml: () => filteredXml.value,
  getExpandedNodes: () => expandedNodes.value,
  getParseError: () => parseError.value,
  getFilterError: () => filterError.value,

  // 工具方法
  parseXmlString: (xmlString: string) => parseXmlString(xmlString),
  copyValue: (value: any) => copyValue(value),
  getValue: (value: any) => getValue(value)
})
</script>

<style scoped>
.xml-format {
  /* border: 1px solid v-bind('currentTheme.colors.border'); */
  border-radius: 6px;
  background: v-bind('currentTheme.colors.background');
  overflow: hidden;
  /* 统一设置字体，避免子元素字体不一致 */
  font-family: Monaco, Consolas, "Lucida Console", "Courier New", ui-monospace, SFMono-Regular, "SF Mono", "Liberation Mono", Menlo, monospace;
  font-size: 14px;
  line-height: 1.5;
  color: v-bind('currentTheme.colors.text');
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
