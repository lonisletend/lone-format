<template>
  <div class="xml-node" :style="{ paddingLeft: level > 0 ? '16px' : '0' }">
    <!-- 注释节点 -->
    <div v-if="nodeType === 'comment'" class="xml-node__comment">
      <span :style="{ color: theme.colors.xmlComment }">
        &lt;!-- {{ commentContent }} --&gt;
      </span>
    </div>

    <!-- CDATA 节点 -->
    <div v-else-if="nodeType === 'cdata'" class="xml-node__cdata">
      <span :style="{ color: theme.colors.xmlCdata }">
        &lt;![CDATA[{{ node['__cdata'] }}]]&gt;
      </span>
    </div>

    <!-- 元素节点 -->
    <div v-else-if="nodeType === 'element'" class="xml-node__element">
      <!-- 包含 CDATA 的元素，使用内联格式 -->
      <div v-if="hasCdata" class="xml-node__line"
        ><span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&lt;</span
        ><span class="xml-node__tag" :style="{ color: theme.colors.xmlTag }">{{ tagName }}</span
        ><span v-for="(attrValue, attrName) in attributes" :key="attrName" class="xml-node__attribute"
          ><span class="xml-node__attr-name" :style="{ color: theme.colors.xmlAttribute }">{{ attrName }}</span
          ><span class="xml-node__equals" :style="{ color: theme.colors.xmlEquals }">=</span
          ><span class="xml-node__quote" :style="{ color: theme.colors.xmlQuote }">"</span
          ><span class="xml-node__attr-value" :style="{ color: theme.colors.xmlAttributeValue }">{{ attrValue }}</span
          ><span class="xml-node__quote" :style="{ color: theme.colors.xmlQuote }">"</span></span
        ><span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&gt;</span
        ><span class="xml-node__cdata" :style="{ color: theme.colors.xmlCdata }">&lt;![CDATA[{{ cdataContent }}]]&gt;</span
        ><span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&lt;/</span
        ><span class="xml-node__tag" :style="{ color: theme.colors.xmlTag }">{{ tagName }}</span
        ><span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&gt;</span>
      </div>
      
      <!-- 只有文本内容的简单元素，使用内联格式 -->
      <div v-else-if="isSimpleTextElement" class="xml-node__line"
        ><span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&lt;</span
        ><span class="xml-node__tag" :style="{ color: theme.colors.xmlTag }">{{ tagName }}</span
        ><span v-for="(attrValue, attrName) in attributes" :key="attrName" class="xml-node__attribute"
          ><span class="xml-node__attr-name" :style="{ color: theme.colors.xmlAttribute }">{{ attrName }}</span
          ><span class="xml-node__equals" :style="{ color: theme.colors.xmlEquals }">=</span
          ><span class="xml-node__quote" :style="{ color: theme.colors.xmlQuote }">"</span
          ><span class="xml-node__attr-value" :style="{ color: theme.colors.xmlAttributeValue }">{{ attrValue }}</span
          ><span class="xml-node__quote" :style="{ color: theme.colors.xmlQuote }">"</span></span
        ><span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&gt;</span
        ><span class="xml-node__text-content" :style="{ color: theme.colors.xmlText }">{{ textContent }}</span
        ><span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&lt;/</span
        ><span class="xml-node__tag" :style="{ color: theme.colors.xmlTag }">{{ tagName }}</span
        ><span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&gt;</span>
      </div>
      
      <!-- 有子元素或可折叠的复杂元素 -->
      <div v-else>
        <!-- 折叠状态：显示完整的开始和结束标签 -->
        <div v-if="!isExpanded && hasChildren" class="xml-node__line">
          <!-- 开始标签 - 可点击展开 -->
          <span
            class="xml-node__clickable-part"
            @click="toggleCollapse()"
            :title="'Click to expand'"
            ><span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&lt;</span
            ><span class="xml-node__tag" :style="{ color: theme.colors.xmlTag }">{{ tagName }}</span
          ></span>
          <!-- 属性列表 -->
          <span v-for="(attrValue, attrName) in attributes" :key="attrName" class="xml-node__attribute"
            ><span class="xml-node__attr-name" :style="{ color: theme.colors.xmlAttribute }">{{ attrName }}</span
            ><span class="xml-node__equals" :style="{ color: theme.colors.xmlEquals }">=</span
            ><span class="xml-node__quote" :style="{ color: theme.colors.xmlQuote }">"</span
            ><span class="xml-node__attr-value" :style="{ color: theme.colors.xmlAttributeValue }">{{ attrValue }}</span
            ><span class="xml-node__quote" :style="{ color: theme.colors.xmlQuote }">"</span
          ></span>
          <!-- 右括号 - 可点击展开 -->
          <span
            class="xml-node__clickable-part"
            @click="toggleCollapse()"
            :title="'Click to expand'"
            ><span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&gt;</span
          ></span>
          <!-- 折叠信息：显示子标签数量 -->
          <span 
            class="xml-node__collapsed-badge" 
            :style="{ 
              backgroundColor: theme.colors.collapsedBackground,
              color: theme.colors.collapsedText
            }"
            @click="toggleCollapse()"
            :title="`Click to expand ${collapsedChildrenCount} child element${collapsedChildrenCount > 1 ? 's' : ''}`"
          >{{ collapsedChildrenCount }} child{{ collapsedChildrenCount > 1 ? 'ren' : '' }}</span>
          <!-- 结束标签 - 可点击展开 -->
          <span
            class="xml-node__clickable-part"
            @click="toggleCollapse()"
            :title="'Click to expand'"
          >
            <span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&lt;/</span>
            <span class="xml-node__tag" :style="{ color: theme.colors.xmlTag }">{{ tagName }}</span>
            <span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&gt;</span>
          </span>
        </div>

        <!-- 展开状态：原有的结构 -->
        <template v-else>
        <!-- 开始标签 -->
        <div class="xml-node__line">
          <!-- 可点击的部分：左括号和标签名 -->
          <span
            v-if="hasChildren"
            class="xml-node__clickable-part"
            @click="toggleCollapse()"
            :title="isExpanded ? 'Click to collapse' : 'Click to expand'"
            ><span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&lt;</span
            ><span class="xml-node__tag" :style="{ color: theme.colors.xmlTag }">{{ tagName }}</span
          ></span>
          <!-- 无子节点时，不可点击 -->
          <span v-else
            ><span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&lt;</span
            ><span class="xml-node__tag" :style="{ color: theme.colors.xmlTag }">{{ tagName }}</span
          ></span>
          <!-- 属性列表：不可点击 -->
          <span v-for="(attrValue, attrName) in attributes" :key="attrName" class="xml-node__attribute"
            ><span class="xml-node__attr-name" :style="{ color: theme.colors.xmlAttribute }">{{ attrName }}</span
            ><span class="xml-node__equals" :style="{ color: theme.colors.xmlEquals }">=</span
            ><span class="xml-node__quote" :style="{ color: theme.colors.xmlQuote }">"</span
            ><span class="xml-node__attr-value" :style="{ color: theme.colors.xmlAttributeValue }">{{ attrValue }}</span
            ><span class="xml-node__quote" :style="{ color: theme.colors.xmlQuote }">"</span
          ></span>
          <!-- 可点击的部分：右括号 -->
          <span
            v-if="hasChildren"
            class="xml-node__clickable-part"
            @click="toggleCollapse()"
            :title="isExpanded ? 'Click to collapse' : 'Click to expand'"
            ><span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&gt;</span
          ></span>
          <!-- 无子节点时的自闭合标签 -->
          <span v-else class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">{{ hasChildren ? '&gt;' : '/&gt;' }}</span>
        </div>

        <!-- 子节点 -->
        <div v-if="isExpanded && hasChildren" class="xml-node__children">
          <!-- 文本内容（如果只有文本，无子元素） -->
          <div v-if="children.length === 0 && textContent.trim()" class="xml-node__text">
            <span class="xml-node__text-content" :style="{ color: theme.colors.xmlText }">
              {{ textContent }}
            </span>
          </div>
          
          <!-- 子元素节点（递归） -->
          <XmlNode
            v-for="(child, childIndex) in children"
            :key="getChildKey(child, childIndex)"
            :node="child"
            :index="childIndex"
            :level="level + 1"
            :parent-path="childPath()"
            :expanded="expanded"
            :theme="theme"
            @toggle-expand="(path) => $emit('toggle-expand', path)"
            @copy="(value) => $emit('copy', value)"
          />
        </div>

        <!-- 结束标签 -->
        <div v-if="isExpanded && hasChildren" class="xml-node__line">
          <span
            class="xml-node__clickable-part"
            @click="toggleCollapse()"
            title="Click to collapse"
          >
            <span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&lt;/</span>
            <span class="xml-node__tag" :style="{ color: theme.colors.xmlTag }">{{ tagName }}</span>
            <span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&gt;</span>
          </span>
        </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ThemeConfig } from './types'

interface Props {
  node: any              // preserveOrder: true 的节点对象
  index: number          // 当前节点在父数组中的索引
  level: number
  parentPath?: string    // 父节点路径
  expanded: Set<string>
  theme: ThemeConfig
}

const props = withDefaults(defineProps<Props>(), {
  parentPath: '',
  level: 0
})

const emit = defineEmits<{
  'toggle-expand': [path: string]
  'copy': [value: any]
}>()

// 获取节点的标签名
const tagName = computed(() => {
  // 查找非特殊属性的键名作为标签名
  const keys = Object.keys(props.node)
  return keys.find(key => !key.startsWith(':') && !key.startsWith('#')) || ''
})

// 当前节点路径
const currentPath = computed(() => {
  if (!tagName.value) return ''
  return props.parentPath 
    ? `${props.parentPath}[${props.index}]` 
    : `${tagName.value}[${props.index}]`
})

// 是否展开
const isExpanded = computed(() => props.expanded.has(currentPath.value))

// 节点类型判断
const nodeType = computed(() => {
  if (props.node['#comment']) return 'comment'
  if (props.node['__cdata']) return 'cdata'
  if (tagName.value) return 'element'
  return 'unknown'
})

// 属性对象（:@ 格式）
const attributes = computed(() => {
  const attrs = props.node[':@'] || {}
  const result: Record<string, string> = {}
  Object.keys(attrs).forEach(key => {
    if (key.startsWith('@_')) {
      result[key.substring(2)] = attrs[key]
    }
  })
  return result
})

// 子节点数组
const children = computed(() => {
  if (nodeType.value !== 'element' || !tagName.value) return []
  const childArray = props.node[tagName.value]
  return Array.isArray(childArray) ? childArray : []
})

// 检查是否包含 CDATA
const hasCdata = computed(() => {
  return children.value.some((child: any) => child['__cdata'])
})

// CDATA 内容
const cdataContent = computed(() => {
  if (!hasCdata.value) return ''
  const cdataNode = children.value.find((child: any) => child['__cdata'])
  if (cdataNode && Array.isArray(cdataNode['__cdata'])) {
    const cdataArray = cdataNode['__cdata']
    if (cdataArray.length > 0 && cdataArray[0]['#text']) {
      return cdataArray[0]['#text']
    }
  }
  return ''
})

// 文本内容
const textContent = computed(() => {
  if (nodeType.value !== 'element' || !tagName.value) return ''
  
  // 如果有 CDATA，不显示文本内容
  if (hasCdata.value) return ''
  
  const childArray = props.node[tagName.value]
  if (!Array.isArray(childArray)) return ''
  
  // 查找文本节点
  const textNode = childArray.find((child: any) => child['#text'])
  return textNode ? textNode['#text'] : ''
})

// 注释内容
const commentContent = computed(() => {
  if (nodeType.value !== 'comment') return ''
  const commentArray = props.node['#comment']
  if (Array.isArray(commentArray) && commentArray.length > 0) {
    return commentArray[0]['#text'] || ''
  }
  return ''
})

// 是否有子元素（不包括纯文本）
const hasChildren = computed(() => {
  return children.value.some((child: any) => {
    const keys = Object.keys(child)
    return keys.some(key => !key.startsWith('#') && !key.startsWith(':'))
  })
})

// 计算折叠的子标签数量
const collapsedChildrenCount = computed(() => {
  if (!hasChildren.value) return 0
  return children.value.filter((child: any) => {
    const keys = Object.keys(child)
    return keys.some(key => !key.startsWith('#') && !key.startsWith(':'))
  }).length
})

// 是否是简单文本元素
const isSimpleTextElement = computed(() => {
  return nodeType.value === 'element' && 
         !hasChildren.value && 
         textContent.value.trim() !== ''
})

// 切换展开/折叠
const toggleCollapse = () => {
  if (hasChildren.value) {
    emit('toggle-expand', currentPath.value)
  }
}

// 获取子节点的唯一 key
const getChildKey = (_child: any, index: number) => {
  return `${currentPath.value}-child-${index}`
}

// 生成子节点路径（用于递归传递给子组件）
const childPath = (): string => {
  // 返回的路径是父路径 + 当前标签名
  // 例如：library[0] → library[0].library
  return `${currentPath.value}.${tagName.value}`
}

</script>

<style scoped>
/* 字体由父组件 .xml-format 统一控制 */

.xml-node__line {
  display: inline-block;
  user-select: text;
}

.xml-node__clickable-part {
  cursor: pointer;
  /* user-select: none; */
  display: inline-block;
  border-radius: 3px;
  transition: background-color 0.15s ease;
}

.xml-node__clickable-part:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.xml-node__tag {
  font-weight: 600;
}

.xml-node__attribute {
  margin-left: 6px;
}

.xml-node__attr-name {
  font-weight: 500;
}

.xml-node__attr-value {
  font-style: normal;
}

.xml-node__collapsed-badge {
  margin: 0 6px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
  display: inline-block;
  vertical-align: middle;
}

.xml-node__collapsed-badge:hover {
  opacity: 0.85;
  transform: scale(1.05);
}

.xml-node__collapsed {
  margin-left: 4px;
  font-style: italic;
}

.xml-node__collapsed--clickable {
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
  transition: background-color 0.15s ease;
  user-select: none;
}

.xml-node__collapsed--clickable:hover {
  background-color: rgba(0, 0, 0, 0.08);
  font-weight: 500;
}

.xml-node__children {
  margin-left: 0;
}

.xml-node__text-content {
  white-space: pre-wrap;
  word-break: break-word;
}

.xml-node__comment {
  font-style: italic;
  opacity: 0.8;
}

.xml-node__cdata {
  opacity: 0.9;
}
</style>
