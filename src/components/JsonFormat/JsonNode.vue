<template>
  <div class="json-node">
    <!-- 对象或数组 -->
    <div v-if="isObjectOrArray" class="json-node__container">
      <div class="json-node__line">
        <span v-if="keyName" class="json-node__key" @click="editKey" :title="'Click to edit key'">
          "{{ displayKey }}"
        </span>
        <span v-if="keyName" class="json-node__colon">: </span>

        <span class="json-node__bracket json-node__bracket--clickable" @click="toggleCollapse"
          :title="isExpanded ? 'Click to collapse' : 'Click to expand'">
          {{ openBracket }}
        </span>

        <span v-if="!isExpanded" class="json-node__collapsed">
          {{ collapsedPreview }}
          <span class="json-node__bracket json-node__bracket--clickable" @click="toggleCollapse">
            {{ closeBracket }}
          </span>
        </span><span v-if="!isExpanded && !isLast" class="json-node__comma">,</span>
      </div>

      <!-- 展开的内容 -->
      <div v-if="isExpanded" class="json-node__children">
        <div v-for="(childValue, childKey) in value" :key="childKey" class="json-node__child">
          <JsonNode :value="childValue" :key-name="isArray ? '' : String(childKey)" :level="level + 1"
            :path="childPath(String(childKey))" :expanded="expanded"
            @update:value="(path, newValue) => $emit('update:value', path, newValue)"
            @toggle-expand="(path) => $emit('toggle-expand', path)" @copy="(value) => $emit('copy', value)"
            :is-last="isLastItem(String(childKey))" />
        </div>

        <div class="json-node__line">
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
        {{ formattedValue }}
      </span>
      <input v-if="isEditingValue" v-model="editingValueValue" @keyup.enter="saveValueEdit"
        @keyup.escape="cancelValueEdit" @blur="saveValueEdit" class="json-node__value-input" />
      <span v-if="!isLast" class="json-node__comma">,</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'

interface Props {
  value: any
  keyName: string
  level: number
  path?: string
  expanded: Set<string>
  isLast?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  path: '',
  isLast: false
})

const emit = defineEmits<{
  'update:value': [path: string, value: any]
  'toggle-expand': [path: string]
  'copy': [value: any]
}>()

// 编辑状态
const isEditingKey = ref(false)
const isEditingValue = ref(false)
const editingKeyValue = ref('')
const editingValueValue = ref('')

// 辅助函数：判断字符串是否为大数字
const isBigNumberString = (value: string): boolean => {
  // 检查是否为纯数字字符串（可能包含负号和小数点）
  if (!/^-?\d+(\.\d+)?$/.test(value)) return false

  // 检查是否超出 JavaScript Number 的安全范围
  const num = Number(value)
  return !Number.isSafeInteger(num) || value.length > 15
}

// 计算属性
const isObjectOrArray = computed(() => {
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
  return isEditingKey.value ? editingKeyValue.value : props.keyName
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
  if (type === 'string') {
    // 检查是否为数字字符串（来自 json-bigint）
    if (isBigNumberString(props.value)) {
      return 'json-node__value--number'
    }
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
  if (typeof props.value === 'string') {
    // 检查是否为大数字字符串
    if (isBigNumberString(props.value)) {
      return props.value // 直接返回数字字符串，不加引号
    }
    return `"${props.value}"` // 普通字符串加引号
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

  // 设置编辑初始值
  if (typeof props.value === 'string' && isBigNumberString(props.value)) {
    // 大数字字符串直接使用原值
    editingValueValue.value = props.value
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
  // 这里需要实现重命名 key 的逻辑
  // 暂时先取消编辑
  isEditingKey.value = false
}

const saveValueEdit = () => {
  try {
    let newValue: any
    const trimmed = editingValueValue.value.trim()

    // 尝试解析值
    if (trimmed === 'null') {
      newValue = null
    } else if (trimmed === 'true' || trimmed === 'false') {
      newValue = trimmed === 'true'
    } else if (!isNaN(Number(trimmed)) && trimmed !== '') {
      // 检查是否为大数字
      const num = Number(trimmed)
      if (!Number.isSafeInteger(num) || trimmed.length > 15) {
        // 大数字保持为字符串
        newValue = trimmed
      } else {
        // 普通数字
        newValue = num
      }
    } else {
      // 字符串值
      newValue = editingValueValue.value
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
  if (typeof props.value === 'string' && isBigNumberString(props.value)) {
    editingValueValue.value = props.value
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
  font-family: Monaco, Consolas, "Lucida Console", "Courier New", ui-monospace, SFMono-Regular, "SF Mono", "Liberation Mono", Menlo, monospace;
}

.json-node__container {
  display: block;
}

.json-node__line {
  display: flex;
  align-items: baseline;
  margin-left: calc(v-bind(level) * 20px);
}

.json-node__child {
  position: relative;
  display: inline-block;
  width: 100%;
}

.json-node__comma {
  color: #24292f;
  margin-left: 0;
  display: inline;
}

.json-node__primitive {
  display: flex;
  align-items: baseline;
  margin-left: calc(v-bind(level) * 20px);
}

.json-node__key {
  color: #0969da;
  cursor: pointer;
  user-select: none;
}

.json-node__key:hover {
  background-color: #f6f8fa;
  border-radius: 3px;
}

.json-node__colon {
  color: #24292f;
  margin: 0 4px 0 0;
}

.json-node__bracket {
  color: #6f42c1;
  font-weight: 600;
  user-select: none;
}

.json-node__bracket--clickable {
  cursor: pointer;
  padding: 2px;
  border-radius: 3px;
}

.json-node__bracket--clickable:hover {
  background-color: #f6f8fa;
}

.json-node__collapsed {
  color: #656d76;
  font-style: italic;
  margin: 0 4px;
}

.json-node__value {
  cursor: pointer;
  padding: 1px 3px;
  border-radius: 3px;
  user-select: text;
}

.json-node__value:hover {
  background-color: #f6f8fa;
}

.json-node__value--string {
  color: #0a3069;
}

.json-node__value--number {
  color: #0969da;
}

.json-node__value--boolean {
  color: #8250df;
  font-weight: 600;
}

.json-node__value--null {
  color: #656d76;
  font-style: italic;
}

/* 编辑状态样式 */
.json-node__key-input,
.json-node__value-input {
  border: 1px solid #0969da;
  border-radius: 3px;
  padding: 1px 3px;
  font-family: inherit;
  font-size: inherit;
  color: inherit;
  background: #ffffff;
  outline: none;
}

.json-node__key-input {
  color: #0969da;
}

/* 缩进指示线 */
.json-node__children::before {
  content: '';
  position: absolute;
  left: calc(v-bind(level) * 20px);
  top: 0;
  bottom: 0;
  width: 1px;
  background: #d0d7de;
  opacity: 0.5;
  pointer-events: none;
}

.json-node__children {
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
