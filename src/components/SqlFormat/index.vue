<template>
  <div class="sql-format" :class="`sql-format--${currentTheme.name}`">
    <div class="sql-format__content">
      <!-- 解析错误信息 -->
      <div v-if="!isValidSql" class="sql-format__error">
        <h4>SQL Parse Error:</h4>
        <pre>{{ parseError }}</pre>
      </div>

      <!-- SQL 子句结构展示 -->
      <div v-else class="sql-format__viewer">
        <div v-if="parsedClauses.length > 0" class="sql-format__clauses">
          <SqlClauseNode
            v-for="clause in parsedClauses"
            :key="clause.path"
            :clause="clause"
            :expanded-clauses="expandedClauses"
            :theme="currentTheme"
            @toggle="toggleClause"
          />
        </div>
        <pre v-else class="sql-format__code"><code v-html="highlightSql(props.modelValue)"></code></pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ThemeType, SqlDialect, SqlClause } from './types'
import { getTheme } from './themes'
import { validateSql, formatSql, compressSql, tokenizeSql, parseSqlClauses } from './parser'
import SqlClauseNode from './SqlClauseNode.vue'

// 递归收集所有（含嵌套）子句的 path
const collectAllPaths = (clauses: SqlClause[]): string[] => {
  const paths: string[] = []
  const walk = (list: SqlClause[]) => {
    for (const c of list) {
      if (c.path) paths.push(c.path)
      if (c.body) {
        for (const seg of c.body) {
          if (seg.kind === 'clause') walk([seg.clause])
        }
      }
    }
  }
  walk(clauses)
  return paths
}

interface Props {
  modelValue: string
  readonly?: boolean
  theme?: ThemeType
  dialect?: SqlDialect
  tabWidth?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  readonly: false,
  theme: 'github-light',
  dialect: 'sql',
  tabWidth: 2,
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
const parseError = ref<string>('')
const currentDialect = ref<SqlDialect>(props.dialect)
const parsedClauses = ref<SqlClause[]>([])
const expandedClauses = ref<Set<string>>(new Set())
const formattedSql = ref<string>('')

// 计算属性
const isValidSql = computed(() => parseError.value === '')

// 当前主题
const currentTheme = computed(() => getTheme(props.theme))

// 解析 SQL
const parseSqlString = (sqlString: string) => {
  if (!sqlString || !sqlString.trim()) {
    // 输入为空时，清空所有状态，不显示错误
    parseError.value = ''
    parsedClauses.value = []
    expandedClauses.value.clear()
    return
  }

  try {
    // 验证
    const validation = validateSql(sqlString)
    if (!validation.valid) {
      parseError.value = validation.error || 'Invalid SQL'
      parsedClauses.value = []
      formattedSql.value = ''
      return
    }

    // 解析子句
    const parsed = parseSqlClauses(sqlString)
    parsedClauses.value = parsed.clauses
    
    // 保存格式化后的 SQL（用于复制功能）
    formattedSql.value = formatSql(sqlString, {
      dialect: currentDialect.value,
      tabWidth: props.tabWidth,
    })
    
    // 默认展开所有子句（含嵌套子查询内部的子句）
    expandedClauses.value = new Set(collectAllPaths(parsed.clauses))
    
    parseError.value = ''
  } catch (error) {
    parseError.value = error instanceof Error ? error.message : 'Unknown parse error'
    parsedClauses.value = []
    formattedSql.value = ''
  }
}

// 高亮 SQL 语法
const highlightSql = (sqlString: string): string => {
  const tokens = tokenizeSql(sqlString)
  const theme = currentTheme.value.colors
  
  return tokens
    .map(token => {
      let color = theme.text
      
      switch (token.type) {
        case 'keyword':
          color = theme.sqlKeyword
          break
        case 'function':
          color = theme.sqlFunction
          break
        case 'string':
          color = theme.sqlString
          break
        case 'number':
          color = theme.sqlNumber
          break
        case 'comment':
          color = theme.sqlComment
          break
        case 'operator':
          color = theme.sqlOperator
          break
        case 'identifier':
          color = theme.sqlIdentifier
          break
        case 'punctuation':
          color = theme.sqlPunctuation
          break
        case 'whitespace':
          // 将空格转换为 HTML 实体以保留缩进
          return token.value.replace(/ /g, '&nbsp;').replace(/\n/g, '\n')
      }
      
      // HTML 转义
      const escaped = token.value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
      
      return `<span style="color: ${color}">${escaped}</span>`
    })
    .join('')
}

// 切换子句展开/折叠状态
const toggleClause = (path: string) => {
  if (expandedClauses.value.has(path)) {
    expandedClauses.value.delete(path)
  } else {
    expandedClauses.value.add(path)
  }
  // 触发响应式更新
  expandedClauses.value = new Set(expandedClauses.value)
}

// 展开所有子句（含嵌套）
const expandAll = () => {
  expandedClauses.value = new Set(collectAllPaths(parsedClauses.value))
  emit('expand-all')
}

// 折叠所有子句
const collapseAll = () => {
  expandedClauses.value = new Set()
  emit('collapse-all')
}

// 复制 SQL
const copySql = async () => {
  if (!isValidSql.value) return

  try {
    // 复制格式化后的 SQL，而不是原始输入
    const sqlToCopy = formattedSql.value || props.modelValue
    await navigator.clipboard.writeText(sqlToCopy)
    emit('copy-success', sqlToCopy)
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Failed to copy')
    emit('copy-error', err)
  }
}

// 格式化 SQL
const formatSource = () => {
  if (!isValidSql.value) return

  try {
    const formatted = formatSql(props.modelValue, {
      dialect: currentDialect.value,
      tabWidth: props.tabWidth,
    })
    emit('update:modelValue', formatted)
    emit('format', formatted)
  } catch (error) {
    console.error('Format error:', error)
  }
}

// 压缩 SQL
const compressSource = () => {
  if (!isValidSql.value) return

  try {
    const compressed = compressSql(props.modelValue)
    emit('update:modelValue', compressed)
    emit('compress', compressed)
  } catch (error) {
    console.error('Compress error:', error)
  }
}

// 获取解析后的 SQL (返回 null，因为不再解析子句)
const getParsedSql = () => {
  return null
}

// 获取解析错误
const getParseError = () => {
  return parseError.value
}

// 监听 modelValue 变化
watch(
  () => props.modelValue,
  (newValue) => {
    parseSqlString(newValue)
  },
  { immediate: true }
)

// 监听 dialect 变化
watch(
  () => props.dialect,
  (newValue) => {
    currentDialect.value = newValue
  }
)

// 暴露方法
defineExpose({
  copySql,
  formatSource,
  compressSource,
  expandAll,
  collapseAll,
  toggleExpand: toggleClause,
  isValidSql: () => isValidSql.value,
  getParsedSql,
  getParseError,
})
</script>

<style scoped>
.sql-format {
  font-family: Monaco, Consolas, "Lucida Console", "Courier New", ui-monospace, SFMono-Regular, "SF Mono", "Liberation Mono", Menlo, monospace;
  font-size: 14px;
  line-height: 1.6;
  background-color: v-bind('currentTheme.colors.background');
  color: v-bind('currentTheme.colors.text');
  /* border: 1px solid v-bind('currentTheme.colors.border'); */
  border-radius: 6px;
  overflow: hidden;
}

/* 内容区域 */
.sql-format__content {
  flex: 1;
  overflow: auto;
  padding: 8px 16px 8px 16px;
}

.sql-format__error {
  background-color: v-bind('currentTheme.colors.errorBackground');
  color: v-bind('currentTheme.colors.error');
  padding: 8px 16px 8px 16px;
  border-radius: 6px;
  border: 1px solid v-bind('currentTheme.colors.error') + '66';
}

.sql-format__error h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
}

.sql-format__error pre {
  margin: 0;
  font-family: inherit;
  font-size: 13px;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* SQL 查看器 */
.sql-format__viewer {
  display: flex;
  flex-direction: column;
}

.sql-format__code {
  margin: 0;
  background-color: v-bind('currentTheme.colors.background');
  border-radius: 4px;
  overflow-x: auto;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre;
  text-align: left;
}

.sql-format__code code {
  font-family: inherit;
  display: block;
  text-align: left;
}

/* 子句列表 */
.sql-format__clauses {
  display: flex;
  flex-direction: column;
  gap: 0;
  background-color: v-bind('currentTheme.colors.background');
  border-radius: 4px;
}

.sql-format__clause {
  display: flex;
  flex-direction: column;
  background-color: transparent;
  overflow: hidden;
}

.sql-format__clause-header {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 2px 0;
}

.sql-format__clause-header--collapsible {
  cursor: pointer;
}

.sql-format__clause-header--collapsible:hover {
  opacity: 0.8;
}

.sql-format__clause-keyword {
  flex: 1;
  min-width: 0;
}

.sql-format__clause-code {
  margin: 0;
  padding: 0;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre;
  text-align: left;
  flex: 1;
}

.sql-format__clause-code code {
  font-family: inherit;
  display: block;
  text-align: left;
}

.sql-format__clause-content {
  padding: 0;
  background-color: transparent;
}

.sql-format__clause-content--collapsible {
  cursor: default;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .sql-format__toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .sql-format__actions {
    justify-content: stretch;
  }

  .sql-format__btn {
    flex: 1;
  }

  .sql-format__info {
    justify-content: center;
  }
}
</style>
