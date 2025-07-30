<template>
  <div class="json-format">
    <div class="json-format__toolbar">
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

      <div v-else class="json-format__viewer">
        <JsonNode :value="parsedJson" :key-name="''" :level="0" :expanded="expandedNodes" :is-last="true"
          @update:value="updateValue" @toggle-expand="toggleExpand" @copy="copyValue" @update:key="updateKey" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import JSONbig from 'json-bigint'
import JsonNode from './JsonNode.vue'

// 配置 json-bigint 以处理大数
const JSONBig = JSONbig({
  storeAsString: true, // 将大数存储为字符串
  useNativeBigInt: false
})

interface Props {
  modelValue: string
  readonly?: boolean
  maxDepth?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  readonly: false,
  maxDepth: 10
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// 响应式数据
const parsedJson = ref<any>(null)
const parseError = ref<string>('')
const expandedNodes = ref<Set<string>>(new Set())

// 计算属性
const isValidJson = computed(() => parseError.value === '')

// 解析 JSON 字符串
const parseJson = (jsonString: string) => {
  if (!jsonString.trim()) {
    parsedJson.value = null
    parseError.value = ''
    return
  }

  try {
    parsedJson.value = JSONBig.parse(jsonString)
    parseError.value = ''

    // 自动展开第一层
    nextTick(() => {
      if (parsedJson.value !== null) {
        expandedNodes.value.add('root')
      }
    })
  } catch (error) {
    parseError.value = error instanceof Error ? error.message : 'Unknown parsing error'
    parsedJson.value = null
  }
}

// 监听 props 变化
watch(() => props.modelValue, (newValue) => {
  parseJson(newValue)
}, { immediate: true })

// 更新值
const updateValue = (path: string, newValue: any) => {
  if (props.readonly) return

  try {
    const updatedJson = updateJsonByPath(parsedJson.value, path, newValue)
    const jsonString = JSONBig.stringify(updatedJson, null, 2)
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

  collectPaths(parsedJson.value)
  expandedNodes.value = allPaths
}

// 全部折叠
const collapseAll = () => {
  expandedNodes.value = new Set(['root'])
}

// 复制 JSON
const copyJson = async () => {
  if (!isValidJson.value) return

  try {
    // 先正常序列化 JSON
    const formattedJson = JSON.stringify(parsedJson.value, null, 2)

    // 然后使用正则表达式替换大数字字符串的引号
    const fixedJson = formattedJson.replace(/"(\d{16,})"/g, '$1')

    await navigator.clipboard.writeText(fixedJson)
    // 这里可以添加一个成功提示
  } catch (error) {
    console.error('Failed to copy JSON:', error)
  }
}

// 判断字符串是否为大数字（与JsonNode中的函数保持一致）
const isBigNumberString = (value: string): boolean => {
  // 检查是否为纯数字字符串（可能包含负号和小数点）
  if (!/^-?\d+(\.\d+)?$/.test(value)) return false

  // 检查是否超出 JavaScript Number 的安全范围
  const num = Number(value)
  return !Number.isSafeInteger(num) || value.length > 15
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
    const updatedJson = renameJsonKey(parsedJson.value, oldPath, newKey)
    const jsonString = JSONBig.stringify(updatedJson, null, 2)
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
  padding: 16px;
  max-height: 600px;
  overflow: auto;
}

.json-format__error {
  color: #cf222e;
  background: #ffebe9;
  border: 1px solid #ff818266;
  border-radius: 6px;
  padding: 16px;
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
  width: 8px;
  height: 8px;
}

.json-format__content::-webkit-scrollbar-track {
  background: #f6f8fa;
}

.json-format__content::-webkit-scrollbar-thumb {
  background: #d0d7de;
  border-radius: 4px;
}

.json-format__content::-webkit-scrollbar-thumb:hover {
  background: #afb8c1;
}
</style>
