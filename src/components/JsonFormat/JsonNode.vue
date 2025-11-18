<template>
  <div class="json-node">
    <!-- 对象或数组 -->
    <div v-if="isObjectOrArray" class="json-node__container">
      <div class="json-node__line">
        <span v-if="keyName && !isEditingKey" class="json-node__key" @click="editKey" :title="'Click to edit key'">
          "{{ displayKey }}"
        </span>
        <input v-if="keyName && isEditingKey" v-model="editingKeyValue" @keyup.enter="saveKeyEdit"
          @keyup.escape="cancelKeyEdit" @blur="saveKeyEdit" class="json-node__key-input" />
        <span v-if="keyName" class="json-node__colon">: </span>

        <span class="json-node__bracket json-node__bracket--clickable" @click="toggleCollapse"
          :title="isExpanded ? 'Click to collapse' : 'Click to expand'">
          {{ openBracket }}
        </span>

        <span v-if="!isExpanded" class="json-node__collapsed-info" @click="toggleCollapse" 
          :title="`Click to expand ${collapsedPreview.trim()}`">
          {{ collapsedPreview }}
        </span>

        <span v-if="!isExpanded" class="json-node__bracket json-node__bracket--clickable" @click="toggleCollapse"
          :title="'Click to expand'">
          {{ closeBracket }}
        </span><span v-if="!isExpanded && !isLast" class="json-node__comma">,</span>
      </div>

      <!-- 展开的内容 -->
      <div v-if="isExpanded" class="json-node__children">
        <div class="json-node__children-content">
          <div v-for="(childValue, childKey) in value" :key="childKey" class="json-node__child">
            <JsonNode :value="childValue" :key-name="isArray ? '' : String(childKey)" :level="level + 1"
              :path="childPath(String(childKey))" :expanded="expanded" :theme="theme"
              @update:value="(path, newValue) => $emit('update:value', path, newValue)"
              @toggle-expand="(path) => $emit('toggle-expand', path)" @copy="(value) => $emit('copy', value)"
              @update:key="(oldPath, newKey) => $emit('update:key', oldPath, newKey)"
              :is-last="isLastItem(String(childKey))" />
          </div>
        </div>

        <div class="json-node__line json-node__closing-bracket">
          <span class="json-node__bracket">{{ closeBracket }}</span><span v-if="!isLast"
            class="json-node__comma">,</span>
        </div>
      </div>
    </div>

    <!-- 基本类型值 -->
    <div v-else class="json-node__primitive">
      <span v-if="keyName && !isEditingKey" class="json-node__key" @click="editKey" :title="'Click to edit key'">
        "{{ displayKey }}"
      </span>
      <input v-if="keyName && isEditingKey" v-model="editingKeyValue" @keyup.enter="saveKeyEdit"
        @keyup.escape="cancelKeyEdit" @blur="saveKeyEdit" class="json-node__key-input" />
      <span v-if="keyName" class="json-node__colon">: </span>

      <span v-if="!isEditingValue" class="json-node__value" :class="valueClass" @click="editValue"
        @dblclick="$emit('copy', value)" :title="valueTitle">
        {{ formattedValue }}<span v-if="!isLast" class="json-node__comma">,</span>
      </span>
      <input v-if="isEditingValue" v-model="editingValueValue" @keyup.enter="saveValueEdit"
        @keyup.escape="cancelValueEdit" @blur="saveValueEdit" class="json-node__value-input" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import type { ThemeConfig } from './types'

interface Props {
  value: any
  keyName: string
  level: number
  path?: string
  expanded: Set<string>
  isLast?: boolean
  theme: ThemeConfig
}

const props = withDefaults(defineProps<Props>(), {
  path: '',
  isLast: false
})

const emit = defineEmits<{
  'update:value': [path: string, value: any]
  'toggle-expand': [path: string]
  'copy': [value: any]
  'update:key': [oldPath: string, newKey: string]
}>()

// 编辑状态
const isEditingKey = ref(false)
const isEditingValue = ref(false)
const editingKeyValue = ref('')
const editingValueValue = ref('')
const originalValueType = ref<'string' | 'number' | 'boolean' | 'null' | 'protected-number'>('string') // 记录原始值类型

// 辅助函数：检查是否为被保护的数字对象
const isProtectedNumberObject = (value: any): boolean => {
  return value !== null && 
         typeof value === 'object' && 
         !Array.isArray(value) &&
         '__protected_number__' in value &&
         Object.keys(value).length === 1
}

// 辅助函数：获取被保护数字的值
const getProtectedNumberValue = (value: any): string => {
  if (isProtectedNumberObject(value)) {
    return value.__protected_number__
  }
  return ''
}

// 计算属性
const isObjectOrArray = computed(() => {
  // 如果是被保护的数字对象，不视为普通对象
  if (isProtectedNumberObject(props.value)) {
    return false
  }
  return props.value !== null && typeof props.value === 'object'
})

const isArray = computed(() => Array.isArray(props.value))

const currentPath = computed(() => {
  if (props.path) {
    return props.path
  }
  if (props.keyName) {
    return props.keyName
  }
  return 'root'
})

const isExpanded = computed(() => {
  return props.expanded.has(currentPath.value)
})

const displayKey = computed(() => {
  return props.keyName
})

const openBracket = computed(() => isArray.value ? '[' : '{')
const closeBracket = computed(() => isArray.value ? ']' : '}')

const collapsedPreview = computed(() => {
  if (!props.value) return ''

  const keys = Object.keys(props.value)
  const count = keys.length

  if (isArray.value) {
    return count > 0 ? ` ${count} items ` : ' '
  } else {
    return count > 0 ? ` ${count} keys ` : ' '
  }
})

const valueClass = computed(() => {
  const type = typeof props.value
  if (props.value === null) return 'json-node__value--null'
  if (type === 'boolean') return 'json-node__value--boolean'
  if (type === 'number') return 'json-node__value--number'
  
  // 检查是否为被保护的数字对象
  if (isProtectedNumberObject(props.value)) {
    return 'json-node__value--number'
  }
  
  if (type === 'string') {
    // 对于普通字符串，不再特殊处理数字样式的字符串
    return 'json-node__value--string'
  }
  return ''
})

const formattedValue = computed(() => {
  if (isEditingValue.value) {
    return editingValueValue.value
  }

  if (props.value === null) return 'null'
  if (typeof props.value === 'boolean') return String(props.value)
  if (typeof props.value === 'number') return String(props.value)
  
  // 检查是否为被保护的数字对象
  if (isProtectedNumberObject(props.value)) {
    return getProtectedNumberValue(props.value) // 直接返回数字字符串，不加引号
  }
  
  if (typeof props.value === 'string') {
    // 对于普通字符串，始终加引号显示
    return `"${props.value}"`
  }
  return String(props.value)
})

const valueTitle = computed(() => {
  return 'Click to edit, double-click to copy'
})

// 方法
const childPath = (childKey: string) => {
  if (props.level === 0) {
    // 根节点的子元素路径直接使用 key
    return childKey
  }
  return currentPath.value ? `${currentPath.value}.${childKey}` : childKey
}

const isLastItem = (childKey: string) => {
  const keys = Object.keys(props.value)
  return keys.indexOf(childKey) === keys.length - 1
}

const toggleCollapse = () => {
  emit('toggle-expand', currentPath.value)
}

const editKey = () => {
  if (props.level === 0) return // 根节点不允许编辑 key

  isEditingKey.value = true
  editingKeyValue.value = props.keyName

  // 使用 nextTick 确保 DOM 更新后再聚焦
  nextTick(() => {
    const inputs = document.querySelectorAll('.json-node__key-input')
    const input = inputs[inputs.length - 1] as HTMLInputElement // 使用最后一个，即刚创建的
    if (input) {
      input.focus()
      input.select()
    }
  })
}

const editValue = () => {
  if (isObjectOrArray.value) return

  isEditingValue.value = true

  // 记录原始值的类型
  if (props.value === null) {
    originalValueType.value = 'null'
  } else if (isProtectedNumberObject(props.value)) {
    originalValueType.value = 'protected-number'
  } else if (typeof props.value === 'string') {
    originalValueType.value = 'string'
  } else if (typeof props.value === 'number') {
    originalValueType.value = 'number'
  } else if (typeof props.value === 'boolean') {
    originalValueType.value = 'boolean'
  }

  // 设置编辑初始值
  if (isProtectedNumberObject(props.value)) {
    // 被保护的数字对象，使用其数字值
    editingValueValue.value = getProtectedNumberValue(props.value)
  } else if (typeof props.value === 'string') {
    // 普通字符串不包含引号
    editingValueValue.value = props.value
  } else {
    // 其他类型转换为字符串
    editingValueValue.value = String(props.value)
  }

  nextTick(() => {
    // 找到当前组件内的值输入框
    const inputs = document.querySelectorAll('.json-node__value-input')
    const input = inputs[inputs.length - 1] as HTMLInputElement // 使用最后一个，即刚创建的
    if (input) {
      input.focus()
      input.select()
    }
  })
}

const saveKeyEdit = () => {
  if (props.level === 0) return // 根节点不允许编辑 key
  if (!isEditingKey.value) return // 如果不在编辑状态，直接返回

  const newKey = editingKeyValue.value.trim()

  // 检查新 key 是否有效
  if (!newKey) {
    // 如果新 key 为空，取消编辑
    cancelKeyEdit()
    return
  }

  // 检查新 key 是否与原 key 相同
  if (newKey === props.keyName) {
    // 如果没有变化，直接取消编辑
    isEditingKey.value = false
    return
  }

  // 先设置编辑状态为 false，防止重复触发
  isEditingKey.value = false

  // 发送更新 key 的事件
  emit('update:key', currentPath.value, newKey)
}

const saveValueEdit = () => {
  try {
    let newValue: any
    const trimmed = editingValueValue.value.trim()

    // 如果原始值是字符串类型，保持为字符串（除非用户明确修改）
    if (originalValueType.value === 'string') {
      // 检查用户是否想要转换类型
      if (trimmed === 'null') {
        newValue = null
      } else if (trimmed === 'true' || trimmed === 'false') {
        newValue = trimmed === 'true'
      } else {
        // 保持为字符串，即使内容看起来像数字
        newValue = editingValueValue.value
      }
    } else if (originalValueType.value === 'protected-number') {
      // 原本是受保护的大数字，继续保持这个格式
      newValue = { __protected_number__: trimmed }
    } else {
      // 原本是其他类型（number, boolean, null），按照常规逻辑解析
      if (trimmed === 'null') {
        newValue = null
      } else if (trimmed === 'true' || trimmed === 'false') {
        newValue = trimmed === 'true'
      } else if (!isNaN(Number(trimmed)) && trimmed !== '') {
        // 检查是否为大数字
        const num = Number(trimmed)
        if (!Number.isSafeInteger(num) || trimmed.length > 15) {
          // 大数字使用保护对象格式，保持数字类型
          newValue = { __protected_number__: trimmed }
        } else {
          // 普通数字
          newValue = num
        }
      } else {
        // 字符串值
        newValue = editingValueValue.value
      }
    }

    emit('update:value', currentPath.value, newValue)
    isEditingValue.value = false
  } catch (error) {
    console.error('Failed to parse value:', error)
    isEditingValue.value = false
  }
}

const cancelKeyEdit = () => {
  isEditingKey.value = false
  editingKeyValue.value = props.keyName
}

const cancelValueEdit = () => {
  isEditingValue.value = false
  // 重置为原始值，而不是空字符串
  if (isProtectedNumberObject(props.value)) {
    editingValueValue.value = getProtectedNumberValue(props.value)
  } else if (typeof props.value === 'string') {
    editingValueValue.value = props.value
  } else {
    editingValueValue.value = String(props.value)
  }
}

// 设置组件名称
defineOptions({
  name: 'JsonNode'
})
</script>

<style scoped>
.json-node {
  position: relative;
}

.json-node__line {
  display: flex;
  align-items: flex-start;
  margin-left: calc(v-bind(level) * 20px);
  line-height: 1.5;
  min-height: 20px;
}

.json-node__primitive {
  display: flex;
  align-items: flex-start;
  margin-left: calc(v-bind(level) * 20px);
  line-height: 1.5;
  min-height: 20px;
}

.json-node__key {
  color: v-bind('theme.colors.syntaxKey');
  cursor: pointer;
  font-weight: 500;
  padding: 1px 3px;
  border-radius: 3px;
  user-select: text;
}

.json-node__key:hover {
  background-color: v-bind('theme.colors.hoverBackground');
}

.json-node__colon {
  color: v-bind('theme.colors.syntaxBracket');
  margin: 0 4px;
}

.json-node__bracket {
  color: v-bind('theme.colors.syntaxBracket');
  font-weight: 500;
  margin: 0 2px;
}

.json-node__bracket--clickable {
  cursor: pointer;
  padding: 1px 3px;
  border-radius: 3px;
}

.json-node__bracket--clickable:hover {
  background-color: v-bind('theme.colors.hoverBackground');
}

.json-node__comma {
  color: v-bind('theme.colors.syntaxBracket');
  margin-left: 2px;
}

.json-node__collapsed-info {
  color: v-bind('theme.colors.collapsedText');
  background-color: v-bind('theme.colors.collapsedBackground');
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  margin: 0 6px;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
  display: inline-block;
  vertical-align: middle;
}

.json-node__collapsed-info:hover {
  opacity: 0.85;
  transform: scale(1.05);
  background-color: v-bind('theme.colors.collapsedBackgroundHover');
}

.json-node__value {
  cursor: pointer;
  padding: 1px 3px;
  border-radius: 3px;
  user-select: text;
  word-break: normal;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  max-width: 100%;
  display: inline-block;
  text-align: left;
}

.json-node__value:hover {
  background-color: v-bind('theme.colors.hoverBackground');
}

.json-node__value--string {
  color: v-bind('theme.colors.syntaxString');
}

.json-node__value--number {
  color: v-bind('theme.colors.syntaxNumber');
}

.json-node__value--boolean {
  color: v-bind('theme.colors.syntaxBoolean');
  font-weight: 600;
}

.json-node__value--null {
  color: v-bind('theme.colors.syntaxNull');
  font-style: italic;
}

/* 编辑状态样式 */
.json-node__key-input,
.json-node__value-input {
  border: 1px solid v-bind('theme.colors.syntaxNumber');
  border-radius: 3px;
  padding: 1px 3px;
  font-family: inherit;
  font-size: inherit;
  color: inherit;
  background: v-bind('theme.colors.background');
  outline: none;
}

.json-node__key-input {
  color: v-bind('theme.colors.syntaxKey');
}

/* 缩进指示线 */
.json-node__children-content::before {
  content: '';
  position: absolute;
  left: calc(v-bind(level) * 20px);
  top: 0;
  bottom: 0;
  width: 1px;
  background: v-bind('theme.colors.indentLine');
  opacity: 0.5;
  pointer-events: none;
}

.json-node__children {
  position: relative;
}

.json-node__children-content {
  position: relative;
}

/* 响应式 */
@media (max-width: 768px) {
  .json-node__line {
    margin-left: calc(v-bind(level) * 12px);
  }

  .json-node__primitive {
    margin-left: calc(v-bind(level) * 12px);
  }
}
</style>
