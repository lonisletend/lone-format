<template>
  <div class="json-format">
    <!-- 可选的工具栏 -->
    <div v-if="showToolbar" class="json-format__toolbar">
      <div class="json-format__actions">
        <button class="json-format__btn json-format__btn--primary" @click="copyJson" :disabled="!isValidJson"
          title="Copy JSON">
          📋 Copy
        </button>
        <button class="json-format__btn json-format__btn--secondary" @click="expandAll" :disabled="!isValidJson"
          title="Expand All">
          ⬇️ Expand All
        </button>
        <button class="json-format__btn json-format__btn--secondary" @click="collapseAll" :disabled="!isValidJson"
          title="Collapse All">
          ➡️ Collapse All
        </button>
        <button class="json-format__btn json-format__btn--secondary" @click="compressSource" :disabled="!isValidJson"
          title="Compress JSON">
          📦 Compress
        </button>
      </div>
      <div class="json-format__info">
        <span v-if="isValidJson" class="json-format__status json-format__status--success">
          ✅ Valid JSON
        </span>
        <span v-else class="json-format__status json-format__status--error">
          ❌ Invalid JSON
        </span>
      </div>
    </div>

    <div class="json-format__content">
      <div v-if="!isValidJson" class="json-format__error">
        <h4>JSON Parse Error:</h4>
        <pre>{{ parseError }}</pre>
      </div>

      <div v-else-if="filterError" class="json-format__error">
        <h4>Filter Error:</h4>
        <pre>{{ filterError }}</pre>
      </div>

      <div v-else class="json-format__viewer">
        <JsonNode :value="displayJson" :key-name="''" :level="0" :expanded="expandedNodes" :is-last="true"
          @update:value="updateValue" @toggle-expand="toggleExpand" @copy="copyValue" @update:key="updateKey" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { JSONPath } from 'jsonpath-plus'
import JsonNode from './JsonNode.vue'
import type { FilterConfig } from './types'

interface Props {
  modelValue: string
  readonly?: boolean
  maxDepth?: number
  showToolbar?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  readonly: false,
  maxDepth: 10,
  showToolbar: true
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'copy-success': [value: string]
  'copy-error': [error: Error]
  'expand-all': []
  'collapse-all': []
  'compress': [value: string]
}>()

// 响应式数据
const parsedJson = ref<any>(null)
const parseError = ref<string>('')
const expandedNodes = ref<Set<string>>(new Set())
const filteredJson = ref<any>(null)
const filterError = ref<string>('')

// 计算属性
const isValidJson = computed(() => parseError.value === '')

// 当前显示的 JSON 数据（可能是过滤后的）
const displayJson = computed(() => {
  if (filterError.value) {
    return null
  }
  return filteredJson.value !== null ? filteredJson.value : parsedJson.value
})

// 解析 JSON 字符串
const parseJson = (jsonString: string) => {
  if (!jsonString.trim()) {
    parsedJson.value = null
    parseError.value = ''
    filteredJson.value = null
    filterError.value = ''
    return
  }

  try {
    let processedString = jsonString

    // 处理大数字：将16位以上的数字转为字符串
    processedString = processedString.replace(/:\s*(\d{16,})\s*([,}])/g, ': "$1"$2')

    // 处理小数精度：将有尾随零的小数转为字符串以保持精度
    processedString = processedString.replace(/:\s*(\d+\.\d*?0+)\s*([,}])/g, ': "$1"$2')

    parsedJson.value = JSON.parse(processedString)
    parseError.value = ''

    // 清除之前的过滤结果和错误
    filteredJson.value = null
    filterError.value = ''

    // 自动展开所有层级
    nextTick(() => {
      if (displayJson.value !== null) {
        expandAll()
      }
    })
  } catch (error) {
    parseError.value = error instanceof Error ? error.message : 'Unknown parsing error'
    parsedJson.value = null
    filteredJson.value = null
    filterError.value = ''
  }
}

// 应用过滤器
const applyFilter = (config: FilterConfig) => {
  if (!config || !config.expression.trim()) {
    clearFilter()
    return
  }

  if (!parsedJson.value) {
    filterError.value = 'No valid JSON data to filter'
    return
  }

  try {
    let result: any

    if (config.type === 'jsonpath') {
      // 使用 JSONPath 过滤
      result = JSONPath({ path: config.expression, json: parsedJson.value })

      // 如果 JSONPath 返回单个值，保持数组格式，否则如果是多个值的数组，保持数组
      if (result.length === 1 && config.expression.includes('$[') === false && !config.expression.endsWith('[*]')) {
        // 单个值且不是数组查询，返回值本身
        filteredJson.value = result[0]
      } else {
        // 多个值或者明确的数组查询，返回数组
        filteredJson.value = result
      }
    } else if (config.type === 'js') {
      // 使用 JavaScript 表达式过滤
      // 创建一个安全的执行环境
      const func = new Function('data', `
        try {
          return ${config.expression};
        } catch (error) {
          throw new Error('JavaScript expression error: ' + error.message);
        }
      `)

      result = func(parsedJson.value)
      filteredJson.value = result
    } else {
      throw new Error(`Unsupported filter type: ${config.type}`)
    }

    filterError.value = ''

    // 重新展开所有节点
    nextTick(() => {
      expandAll()
    })
  } catch (error) {
    filterError.value = error instanceof Error ? error.message : 'Filter execution error'
    filteredJson.value = null
  }
}

// 清除过滤器
const clearFilter = () => {
  filteredJson.value = null
  filterError.value = ''
}

// 监听 props 变化
watch(() => props.modelValue, (newValue) => {
  parseJson(newValue)
}, { immediate: true })

// 判断字符串是否为大数字
const isBigNumberString = (value: string): boolean => {
  // 检查是否为纯数字字符串（可能包含负号和小数点）
  if (!/^-?\d+(\.\d+)?$/.test(value)) return false

  // 检查是否超出 JavaScript Number 的安全范围
  const num = Number(value)
  return !Number.isSafeInteger(num) || value.length > 15
}

// 自定义 stringify 函数，保持数字格式
const stringifyPreservingNumbers = (obj: any, replacer?: any, space?: number): string => {
  return JSON.stringify(obj, (key, value) => {
    // 如果是大数字字符串，标记它以便后续处理
    if (typeof value === 'string' && isBigNumberString(value)) {
      return `__BIG_NUMBER__${value}__BIG_NUMBER__`
    }

    // 如果是普通数字字符串（但看起来像数字），尝试转换为数字
    if (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value)) {
      const num = Number(value)
      // 如果是整数且没有精度损失，返回数字
      if (Number.isSafeInteger(num) && num.toString() === value) {
        return num
      }
      // 如果是浮点数，需要保持原始精度，特别是尾随零
      else if (!Number.isNaN(num) && isFinite(num) && value.includes('.')) {
        // 对于小数，检查数字的标准表示是否与原始字符串一致
        const standardForm = num.toString()
        if (standardForm === value) {
          // 只有完全一致时才转换为数字
          return num
        } else {
          // 否则保持原始字符串，以保留精度（如尾随零）
          return `__PRESERVE_STRING__${value}__PRESERVE_STRING__`
        }
      }
      // 如果是整数形式但超出安全范围，保持字符串
      else if (!Number.isNaN(num) && isFinite(num)) {
        return num
      }
    }

    // 应用用户提供的 replacer
    if (replacer && typeof replacer === 'function') {
      return replacer(key, value)
    }
    return value
  }, space)
    .replace(/"__BIG_NUMBER__(.+?)__BIG_NUMBER__"/g, '$1')
    .replace(/"__PRESERVE_STRING__(.+?)__PRESERVE_STRING__"/g, '$1')
}

// 更新值
const updateValue = (path: string, newValue: any) => {
  if (props.readonly) return

  try {
    // 始终更新原始数据，而不是过滤后的数据
    const updatedJson = updateJsonByPath(parsedJson.value, path, newValue)
    const jsonString = stringifyPreservingNumbers(updatedJson, null, 2)
    emit('update:modelValue', jsonString)
  } catch (error) {
    console.error('Failed to update JSON:', error)
  }
}

// 根据路径更新 JSON 对象（性能优化版本）
const updateJsonByPath = (obj: any, path: string, value: any): any => {
  if (!path || path === 'root') return value

  const keys = path.split('.')

  // 使用浅拷贝而不是深拷贝，只有修改路径上的对象才需要拷贝
  const result = shallowCopyToPath(obj, keys.slice(0, -1))

  let current = result
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (key === 'root') continue // 跳过 root

    if (Array.isArray(current)) {
      current = current[parseInt(key)]
    } else {
      current = current[key]
    }
  }

  const lastKey = keys[keys.length - 1]
  if (lastKey === 'root') return value // 如果最后一个是 root，直接返回新值

  if (Array.isArray(current)) {
    current[parseInt(lastKey)] = value
  } else {
    current[lastKey] = value
  }

  return result
}

// 切换节点展开状态
const toggleExpand = (path: string) => {
  if (expandedNodes.value.has(path)) {
    expandedNodes.value.delete(path)
  } else {
    expandedNodes.value.add(path)
  }
}

// 全部展开
const expandAll = () => {
  const allPaths = new Set<string>()
  const collectPaths = (obj: any, currentPath: string = '') => {
    if (obj !== null && typeof obj === 'object') {
      allPaths.add(currentPath || 'root')
      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          const path = currentPath ? `${currentPath}.${index}` : `${index}`
          collectPaths(item, path)
        })
      } else {
        Object.keys(obj).forEach(key => {
          const path = currentPath ? `${currentPath}.${key}` : key
          collectPaths(obj[key], path)
        })
      }
    }
  }

  collectPaths(displayJson.value)
  expandedNodes.value = allPaths
  emit('expand-all')
}

// 全部折叠
const collapseAll = () => {
  expandedNodes.value = new Set(['root'])
  emit('collapse-all')
}

// 复制 JSON
const copyJson = async () => {
  if (!isValidJson.value) return

  try {
    // 复制当前显示的数据（可能是过滤后的）
    const dataToCopy = displayJson.value

    // 使用 stringifyPreservingNumbers 保持数字格式和精度
    const formattedJson = stringifyPreservingNumbers(dataToCopy, null, 2)

    await navigator.clipboard.writeText(formattedJson)
    emit('copy-success', formattedJson)
  } catch (error) {
    console.error('Failed to copy JSON:', error)
    emit('copy-error', error instanceof Error ? error : new Error('Failed to copy JSON'))
  }
}

// 压缩 JSON
const compressSource = () => {
  if (!isValidJson.value) return

  try {
    // 使用当前显示的数据进行压缩
    const dataToCompress = displayJson.value

    // 使用 stringifyPreservingNumbers 保持数字格式，但不添加格式化空格
    const compressedJson = stringifyPreservingNumbers(dataToCompress)

    // 更新 modelValue，触发重新解析和显示
    emit('update:modelValue', compressedJson)
    emit('compress', compressedJson)
  } catch (error) {
    console.error('Failed to compress JSON:', error)
  }
}

// 复制值
const copyValue = async (value: any) => {
  try {
    let stringValue: string

    if (typeof value === 'string' && isBigNumberString(value)) {
      // 大数字字符串，复制时作为数字
      stringValue = value // 直接使用数字字符串，不加引号
    } else if (typeof value === 'string') {
      // 普通字符串，需要加引号
      stringValue = `"${value}"`
    } else {
      // 其他类型，使用 JSON.stringify
      stringValue = JSON.stringify(value)
    }

    await navigator.clipboard.writeText(stringValue)
  } catch (error) {
    console.error('Failed to copy value:', error)
  }
}

// 更新键名
const updateKey = (oldPath: string, newKey: string) => {
  if (props.readonly) return

  try {
    // 始终更新原始数据
    const updatedJson = renameJsonKey(parsedJson.value, oldPath, newKey)
    const jsonString = stringifyPreservingNumbers(updatedJson, null, 2)
    emit('update:modelValue', jsonString)

    // 更新展开状态中的路径
    updateExpandedPaths(oldPath, newKey)
  } catch (error) {
    console.error('Failed to rename key:', error)
  }
}

// 重命名 JSON 对象中的键（性能优化版本）
const renameJsonKey = (obj: any, path: string, newKey: string): any => {
  if (!path || path === 'root') return obj

  const keys = path.split('.')

  // 使用浅拷贝而不是深拷贝，只有修改的路径上的对象才需要拷贝
  const result = shallowCopyToPath(obj, keys.slice(0, -1))

  // 如果只有一个键，说明是根级别的操作
  if (keys.length === 1) {
    const oldKey = keys[0]
    if (result && typeof result === 'object' && !Array.isArray(result)) {
      return reorderObjectKeys(result, oldKey, newKey)
    }
    return result
  }

  // 找到父对象
  let parent = result
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]

    if (Array.isArray(parent)) {
      parent = parent[parseInt(key)]
    } else {
      parent = parent[key]
    }
  }

  const oldKey = keys[keys.length - 1]

  // 重命名键
  if (!Array.isArray(parent) && parent && typeof parent === 'object') {
    const newParent = reorderObjectKeys(parent, oldKey, newKey)

    // 只替换父对象，而不是重建整个结构
    const parentKeys = keys.slice(0, -1)
    if (parentKeys.length > 0) {
      replaceObjectAtPath(result, parentKeys, newParent)
    }
  }

  return result
}

// 浅拷贝到指定路径的对象
const shallowCopyToPath = (obj: any, pathKeys: string[]): any => {
  if (pathKeys.length === 0) return obj

  if (Array.isArray(obj)) {
    const newArray = [...obj]
    const key = pathKeys[0]
    const index = parseInt(key)
    if (pathKeys.length === 1) {
      return newArray
    }
    newArray[index] = shallowCopyToPath(obj[index], pathKeys.slice(1))
    return newArray
  } else if (obj && typeof obj === 'object') {
    const newObj = { ...obj }
    const key = pathKeys[0]
    if (pathKeys.length === 1) {
      return newObj
    }
    newObj[key] = shallowCopyToPath(obj[key], pathKeys.slice(1))
    return newObj
  }

  return obj
}

// 高效地重新排序对象键
const reorderObjectKeys = (obj: any, oldKey: string, newKey: string): any => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj
  }

  // 使用 Object.keys() 获取键的顺序，然后重新构建对象
  const keys = Object.keys(obj)
  const newObj: any = {}

  for (const key of keys) {
    if (key === oldKey) {
      newObj[newKey] = obj[key]
    } else {
      newObj[key] = obj[key]
    }
  }

  return newObj
}

// 在指定路径替换对象
const replaceObjectAtPath = (obj: any, pathKeys: string[], newValue: any): void => {
  let current = obj

  for (let i = 0; i < pathKeys.length - 1; i++) {
    const key = pathKeys[i]
    if (Array.isArray(current)) {
      current = current[parseInt(key)]
    } else {
      current = current[key]
    }
  }

  const lastKey = pathKeys[pathKeys.length - 1]
  if (Array.isArray(current)) {
    current[parseInt(lastKey)] = newValue
  } else {
    current[lastKey] = newValue
  }
}

// 更新展开状态中的路径
const updateExpandedPaths = (oldPath: string, newKey: string) => {
  const newExpandedNodes = new Set<string>()

  expandedNodes.value.forEach(path => {
    if (path === oldPath) {
      // 替换当前路径
      const pathParts = oldPath.split('.')
      pathParts[pathParts.length - 1] = newKey
      newExpandedNodes.add(pathParts.join('.'))
    } else if (path.startsWith(oldPath + '.')) {
      // 替换子路径
      const pathParts = oldPath.split('.')
      pathParts[pathParts.length - 1] = newKey
      const newBasePath = pathParts.join('.')
      const suffix = path.substring(oldPath.length)
      newExpandedNodes.add(newBasePath + suffix)
    } else {
      // 保持原路径
      newExpandedNodes.add(path)
    }
  })

  expandedNodes.value = newExpandedNodes
}

// 设置组件名称
defineOptions({
  name: 'JsonFormat'
})

// 暴露方法给父组件调用
defineExpose({
  // 核心操作方法
  copyJson,
  compressSource,
  expandAll,
  collapseAll,
  toggleExpand,
  updateValue,
  updateKey,

  // Filter 相关方法
  filter: applyFilter,
  clearFilter,

  // 状态访问方法
  isValidJson: () => isValidJson.value,
  getParsedJson: () => parsedJson.value,
  getFilteredJson: () => filteredJson.value,
  getExpandedNodes: () => expandedNodes.value,
  getParseError: () => parseError.value,
  getFilterError: () => filterError.value,

  // 工具方法
  parseJson: (jsonString: string) => parseJson(jsonString),
  copyValue: (value: any) => copyValue(value)
})
</script>

<style scoped>
.json-format {
  border: 1px solid #d0d7de;
  border-radius: 6px;
  background: #ffffff;
  font-family: Monaco, Consolas, "Lucida Console", "Courier New", ui-monospace, SFMono-Regular, "SF Mono", "Liberation Mono", Menlo, monospace;
  font-size: 14px;
  line-height: 1.45;
}

.json-format__toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f6f8fa;
  border-bottom: 1px solid #d0d7de;
  border-radius: 6px 6px 0 0;
}

.json-format__actions {
  display: flex;
  gap: 8px;
}

.json-format__btn {
  padding: 4px 8px;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  background: #f6f8fa;
  color: #24292f;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.json-format__btn:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #d0d7de;
}

.json-format__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.json-format__btn--primary {
  background: #2da44e;
  color: white;
  border-color: #2da44e;
}

.json-format__btn--primary:hover:not(:disabled) {
  background: #2c974b;
}

.json-format__btn--secondary {
  background: #ffffff;
  border-color: #d0d7de;
}

.json-format__info {
  display: flex;
  align-items: center;
}

.json-format__status {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.json-format__status--success {
  background: #dafbe1;
  color: #1a7f37;
}

.json-format__status--error {
  background: #ffebe9;
  color: #cf222e;
}

.json-format__content {
  padding: 8px 16px 8px 16px;
  /* max-height: 600px; */
  overflow: auto;
}

.json-format__error {
  color: #cf222e;
  background: #ffebe9;
  border: 1px solid #ff818266;
  border-radius: 6px;
  padding: 8px 16px 8px 16px;
}

.json-format__error h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
}

.json-format__error pre {
  margin: 0;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}

.json-format__viewer {
  color: #24292f;
}

/* 滚动条样式 */
.json-format__content::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

.json-format__content::-webkit-scrollbar-track {
  background: #f6f8fa;
}

.json-format__content::-webkit-scrollbar-thumb {
  background: #d0d7de;
  border-radius: px;
}

.json-format__content::-webkit-scrollbar-thumb:hover {
  background: #afb8c1;
}
</style>
