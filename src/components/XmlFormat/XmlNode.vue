<template>
  <div class="xml-node" :style="{ marginLeft: `${level * 20}px` }">
    <!-- 元素节点 -->
    <div v-if="isElement" class="xml-node__element">
      <!-- 只有文本内容的简单元素，使用内联格式 -->
      <div v-if="isSimpleTextElement" class="xml-node__line">
        <span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&lt;</span>
        <span class="xml-node__tag" :style="{ color: theme.colors.xmlTag }">{{ tagName }}</span>
        
        <!-- 属性列表 -->
        <span v-for="(attrValue, attrName) in attributes" :key="attrName" class="xml-node__attribute">
          <span class="xml-node__attr-name" :style="{ color: theme.colors.xmlAttribute }">{{ attrName }}</span>
          <span class="xml-node__equals" :style="{ color: theme.colors.xmlEquals }">=</span>
          <span class="xml-node__quote" :style="{ color: theme.colors.xmlQuote }">"</span>
          <span class="xml-node__attr-value" :style="{ color: theme.colors.xmlAttributeValue }">{{ attrValue }}</span>
          <span class="xml-node__quote" :style="{ color: theme.colors.xmlQuote }">"</span>
        </span>
        
        <span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&gt;</span>
        <span class="xml-node__text-content" :style="{ color: theme.colors.xmlText }">{{ textContent }}</span>
        <span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&lt;/</span>
        <span class="xml-node__tag" :style="{ color: theme.colors.xmlTag }">{{ tagName }}</span>
        <span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&gt;</span>
      </div>
      
      <!-- 有子元素或可折叠的复杂元素 -->
      <div v-else>
        <!-- 开始标签 -->
        <div class="xml-node__line">
          <span
            class="xml-node__bracket"
            :style="{ color: theme.colors.xmlBracket }"
            @click="toggleCollapse"
            :class="{ 'xml-node__bracket--clickable': hasChildren }"
            :title="hasChildren ? (isExpanded ? 'Click to collapse' : 'Click to expand') : ''"
          >
            &lt;
          </span>
          <span class="xml-node__tag" :style="{ color: theme.colors.xmlTag }">
            {{ tagName }}
          </span>

          <!-- 属性列表 -->
          <span v-for="(attrValue, attrName) in attributes" :key="attrName" class="xml-node__attribute">
            <span class="xml-node__attr-name" :style="{ color: theme.colors.xmlAttribute }">
              {{ attrName }}
            </span>
            <span class="xml-node__equals" :style="{ color: theme.colors.xmlEquals }">=</span>
            <span class="xml-node__quote" :style="{ color: theme.colors.xmlQuote }">"</span>
            <span class="xml-node__attr-value" :style="{ color: theme.colors.xmlAttributeValue }">
              {{ attrValue }}
            </span>
            <span class="xml-node__quote" :style="{ color: theme.colors.xmlQuote }">"</span>
          </span>

          <!-- 自闭合或开始标签结束 -->
          <span v-if="!hasChildren" class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">
            /&gt;
          </span>
          <span v-else class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">
            &gt;
          </span>

          <!-- 折叠状态提示 -->
          <span v-if="!isExpanded && hasChildren" class="xml-node__collapsed" :style="{ color: theme.colors.textSecondary }">
            ...
          </span>
        </div>

        <!-- 子节点 -->
        <div v-if="isExpanded && hasChildren" class="xml-node__children">
          <!-- 文本内容（如果只有文本，无子元素） -->
          <div v-if="children.length === 0 && textContent.trim()" class="xml-node__text">
            <span class="xml-node__text-content" :style="{ color: theme.colors.xmlText }">
              {{ textContent }}
            </span>
          </div>
          
          <!-- 子元素节点 -->
          <XmlNode
            v-for="(child, index) in children"
            :key="getChildKey(child, index)"
            :value="child.value"
            :tag-name="child.tagName"
            :level="level + 1"
            :path="childPath(child.tagName, index)"
            :expanded="expanded"
            :theme="theme"
            @toggle-expand="(path) => $emit('toggle-expand', path)"
            @copy="(value) => $emit('copy', value)"
          />
        </div>

        <!-- 结束标签 -->
        <div v-if="isExpanded && hasChildren" class="xml-node__line">
          <span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&lt;/</span>
          <span class="xml-node__tag" :style="{ color: theme.colors.xmlTag }">{{ tagName }}</span>
          <span class="xml-node__bracket" :style="{ color: theme.colors.xmlBracket }">&gt;</span>
        </div>
      </div>
    </div>

    <!-- 文本内容节点 -->
    <div v-else-if="isTextNode" class="xml-node__text">
      <span class="xml-node__text-content" :style="{ color: theme.colors.xmlText }">
        {{ textContent }}
      </span>
    </div>

    <!-- 注释节点 -->
    <div v-else-if="isComment" class="xml-node__comment">
      <span :style="{ color: theme.colors.xmlComment }">
        &lt;!-- {{ commentContent }} --&gt;
      </span>
    </div>

    <!-- CDATA 节点 -->
    <div v-else-if="isCdata" class="xml-node__cdata">
      <span :style="{ color: theme.colors.xmlCdata }">
        &lt;![CDATA[{{ cdataContent }}]]&gt;
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ThemeConfig } from './types'
import { extractAttributes, getTextContent } from './parser'

interface Props {
  value: any
  tagName: string
  level: number
  path?: string
  expanded: Set<string>
  theme: ThemeConfig
}

const props = withDefaults(defineProps<Props>(), {
  path: '',
  level: 0
})

const emit = defineEmits<{
  'toggle-expand': [path: string]
  'copy': [value: any]
}>()

// 当前路径
const currentPath = computed(() => props.path || props.tagName)

// 是否展开
const isExpanded = computed(() => props.expanded.has(currentPath.value))

// 节点类型判断
const isElement = computed(() => {
  // 如果有明确的标签名（不是特殊节点），就当作元素节点
  if (props.tagName && !props.tagName.startsWith('#') && props.tagName !== '__cdata') {
    return true
  }
  // 否则检查值是否为对象
  return props.value !== null && typeof props.value === 'object'
})

const isTextNode = computed(() => {
  // 只有当没有标签名，且值为字符串时，才是纯文本节点
  return !props.tagName && typeof props.value === 'string'
})

const isComment = computed(() => {
  return props.tagName === '#comment'
})

const isCdata = computed(() => {
  return props.tagName === '__cdata'
})

// 提取属性
const attributes = computed(() => {
  if (!isElement.value) return {}
  return extractAttributes(props.value)
})

// 获取文本内容
const textContent = computed(() => {
  // 如果值本身就是字符串，直接返回
  if (typeof props.value === 'string') {
    return props.value
  }
  // 如果值是对象，提取 #text
  if (isElement.value) {
    return getTextContent(props.value) || ''
  }
  return props.value || ''
})

const commentContent = computed(() => {
  return props.value || ''
})

const cdataContent = computed(() => {
  return props.value || ''
})

// 子节点
const children = computed(() => {
  // 只有对象类型才可能有子节点
  if (typeof props.value !== 'object' || props.value === null) {
    return []
  }
  
  const childNodes: Array<{ tagName: string; value: any }> = []
  
  Object.keys(props.value).forEach(key => {
    // 跳过属性节点
    if (key.startsWith('@_')) return
    
    // 跳过 #text 节点（文本内容通过 textContent 处理）
    if (key === '#text') return
    
    const childValue = props.value[key]
    
    // 如果是数组，展开每个元素
    if (Array.isArray(childValue)) {
      childValue.forEach(item => {
        childNodes.push({ tagName: key, value: item })
      })
    } else {
      childNodes.push({ tagName: key, value: childValue })
    }
  })
  
  return childNodes
})

const hasChildren = computed(() => {
  // 有子元素节点
  if (children.value.length > 0) return true
  
  // 或者有文本内容（非空白）
  const text = textContent.value.trim()
  return text !== ''
})

// 是否是简单文本元素（只有文本内容，没有子元素）
const isSimpleTextElement = computed(() => {
  return isElement.value && children.value.length === 0 && textContent.value.trim() !== ''
})

// 切换展开/折叠
const toggleCollapse = () => {
  if (hasChildren.value) {
    emit('toggle-expand', currentPath.value)
  }
}

// 生成子节点路径
const childPath = (childTag: string, index: number): string => {
  return `${currentPath.value}.${childTag}[${index}]`
}

// 生成子节点 key
const getChildKey = (child: { tagName: string; value: any }, index: number): string => {
  return `${child.tagName}-${index}`
}
</script>

<style scoped>
.xml-node {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
}

.xml-node__line {
  display: inline-block;
  user-select: text;
}

.xml-node__bracket--clickable {
  cursor: pointer;
  user-select: none;
}

.xml-node__bracket--clickable:hover {
  opacity: 0.7;
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

.xml-node__collapsed {
  margin-left: 4px;
  font-style: italic;
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
  font-family: monospace;
  opacity: 0.9;
}
</style>
