<template>
  <div class="sql-format" :class="`sql-format--${currentTheme.name}`">
    <!-- 工具栏 -->
    <div v-if="showToolbar" class="sql-format__toolbar">
      <div class="sql-format__actions">
        <button
          class="sql-format__btn sql-format__btn--primary"
          @click="copySql"
          :disabled="!isValidSql"
          title="Copy SQL"
        >
          📋 Copy
        </button>
        <button
          class="sql-format__btn sql-format__btn--secondary"
          @click="formatSource"
          :disabled="!isValidSql"
          title="Format SQL"
        >
          ✨ Format
        </button>
        <button
          class="sql-format__btn sql-format__btn--secondary"
          @click="compressSource"
          :disabled="!isValidSql"
          title="Compress SQL"
        >
          📦 Compress
        </button>
        <button
          class="sql-format__btn sql-format__btn--secondary"
          @click="expandAll"
          :disabled="!isValidSql || parsedClauses.length === 0"
          title="Expand All Clauses"
        >
          ⬇️ Expand All
        </button>
        <button
          class="sql-format__btn sql-format__btn--secondary"
          @click="collapseAll"
          :disabled="!isValidSql || parsedClauses.length === 0"
          title="Collapse All Clauses"
        >
          ⬆️ Collapse All
        </button>
        
        <!-- Dialect 选择器 -->
        <select
          v-model="currentDialect"
          class="sql-format__dialect-select"
          title="SQL Dialect"
        >
          <option value="sql">SQL</option>
          <option value="mysql">MySQL</option>
          <option value="postgresql">PostgreSQL</option>
          <option value="sqlite">SQLite</option>
          <option value="plsql">PL/SQL</option>
          <option value="tsql">T-SQL</option>
        </select>
      </div>
      <div class="sql-format__info">
        <span
          v-if="isValidSql"
          class="sql-format__status sql-format__status--success"
        >
          ✅ Valid SQL
        </span>
        <span v-else class="sql-format__status sql-format__status--error">
          ❌ Invalid SQL
        </span>
      </div>
    </div>

    <div class="sql-format__content">
      <!-- 解析错误信息 -->
      <div v-if="!isValidSql" class="sql-format__error">
        <h4>SQL Parse Error:</h4>
        <pre>{{ parseError }}</pre>
      </div>

      <!-- SQL 子句结构展示 -->
      <div v-else class="sql-format__viewer">
        <div v-if="parsedClauses.length > 0" class="sql-format__clauses">
          <div
            v-for="clause in parsedClauses"
            :key="clause.path"
            class="sql-format__clause"
          >
            <div class="sql-format__clause-header" @click="clause.collapsible && toggleClause(clause.path || '')">
              <button
                v-if="clause.collapsible"
                class="sql-format__toggle-btn"
                @click.stop="toggleClause(clause.path || '')"
                :title="isClauseExpanded(clause.path || '') ? 'Collapse' : 'Expand'"
              >
                <span class="sql-format__toggle-icon" :class="{
                  'sql-format__toggle-icon--expanded': isClauseExpanded(clause.path || '')
                }">▶</span>
              </button>
              <span v-else class="sql-format__toggle-spacer"></span>
              <div class="sql-format__clause-keyword">
                <pre class="sql-format__clause-code"><code v-html="getClauseDisplayContent(clause)"></code></pre>
              </div>
            </div>
            <div
              v-if="isClauseExpanded(clause.path || '') && getClauseRestContent(clause)"
              class="sql-format__clause-content"
            >
              <pre class="sql-format__clause-code"><code v-html="highlightSql(getClauseRestContent(clause))"></code></pre>
            </div>
          </div>
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

interface Props {
  modelValue: string
  readonly?: boolean
  showToolbar?: boolean
  theme?: ThemeType
  dialect?: SqlDialect
  tabWidth?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  readonly: false,
  showToolbar: true,
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
      return
    }

    // 解析子句
    const parsed = parseSqlClauses(sqlString)
    parsedClauses.value = parsed.clauses
    
    // 默认展开所有子句
    expandedClauses.value = new Set(parsed.clauses.map(c => c.path || ''))
    
    parseError.value = ''
  } catch (error) {
    parseError.value = error instanceof Error ? error.message : 'Unknown parse error'
    parsedClauses.value = []
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
          return token.value
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

// 检查子句是否展开
const isClauseExpanded = (path: string): boolean => {
  return expandedClauses.value.has(path)
}

// 获取子句的第一行（用于显示在折叠按钮旁边）
const getClauseFirstLine = (clause: SqlClause): string => {
  const lines = clause.content.split('\n')
  if (lines.length === 0) return ''
  
  // 返回第一个非空行（包括注释）
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed) {
      return line
    }
  }
  
  return ''
}

// 获取子句显示内容（包括折叠时的省略号）
const getClauseDisplayContent = (clause: SqlClause): string => {
  const firstLine = getClauseFirstLine(clause)
  const isExpanded = isClauseExpanded(clause.path || '')
  const hasMoreContent = !!getClauseRestContent(clause)
  
  // 如果折叠且有更多内容，在高亮后的内容末尾添加省略号
  if (clause.collapsible && !isExpanded && hasMoreContent) {
    const highlighted = highlightSql(firstLine)
    return `${highlighted}<span style="color: ${currentTheme.value.colors.textSecondary}; opacity: 0.6; font-style: italic; margin-left: 4px;"> ...</span>`
  }
  
  return highlightSql(firstLine)
}

// 获取子句的剩余内容（除第一行外的所有内容）
const getClauseRestContent = (clause: SqlClause): string => {
  const lines = clause.content.split('\n')
  if (lines.length <= 1) return ''
  
  // 找到第一个非空行的索引（包括注释）
  let firstLineIndex = 0
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    if (trimmed) {
      firstLineIndex = i
      break
    }
  }
  
  // 返回第一行之后的所有内容
  const restLines = lines.slice(firstLineIndex + 1)
  return restLines.join('\n')
}

// 展开所有子句
const expandAll = () => {
  expandedClauses.value = new Set(parsedClauses.value.map(c => c.path || ''))
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
    await navigator.clipboard.writeText(props.modelValue)
    emit('copy-success', props.modelValue)
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
  border: 1px solid v-bind('currentTheme.colors.border');
  border-radius: 6px;
  overflow: hidden;
}

/* 工具栏 */
.sql-format__toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: v-bind('currentTheme.colors.surfaceBackground');
  border-bottom: 1px solid v-bind('currentTheme.colors.border');
  gap: 8px;
  flex-wrap: wrap;
}

.sql-format__actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.sql-format__btn {
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid v-bind('currentTheme.colors.buttonBorder');
  background-color: v-bind('currentTheme.colors.buttonBackground');
  color: v-bind('currentTheme.colors.buttonText');
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  white-space: nowrap;
}

.sql-format__btn:hover:not(:disabled) {
  background-color: v-bind('currentTheme.colors.buttonBackgroundHover');
}

.sql-format__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sql-format__btn--primary {
  background-color: v-bind('currentTheme.colors.buttonPrimary');
  color: white;
  border-color: v-bind('currentTheme.colors.buttonPrimary');
}

.sql-format__btn--primary:hover:not(:disabled) {
  background-color: v-bind('currentTheme.colors.buttonPrimaryHover');
  border-color: v-bind('currentTheme.colors.buttonPrimaryHover');
}

.sql-format__dialect-select {
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid v-bind('currentTheme.colors.buttonBorder');
  background-color: v-bind('currentTheme.colors.buttonBackground');
  color: v-bind('currentTheme.colors.buttonText');
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.sql-format__dialect-select:hover {
  background-color: v-bind('currentTheme.colors.buttonBackgroundHover');
}

.sql-format__info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sql-format__status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}

.sql-format__status--success {
  background-color: v-bind('currentTheme.colors.successBackground');
  color: v-bind('currentTheme.colors.success');
}

.sql-format__status--error {
  background-color: v-bind('currentTheme.colors.errorBackground');
  color: v-bind('currentTheme.colors.error');
}

/* 内容区域 */
.sql-format__content {
  padding: 16px;
  max-height: 600px;
  overflow: auto;
}

.sql-format__error {
  background-color: v-bind('currentTheme.colors.errorBackground');
  color: v-bind('currentTheme.colors.error');
  padding: 16px;
  border-radius: 4px;
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
  padding: 12px 16px;
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
  padding: 12px 16px;
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
  cursor: pointer;
}

.sql-format__clause-header:hover .sql-format__toggle-btn {
  opacity: 0.8;
}

.sql-format__clause-keyword {
  flex: 1;
  min-width: 0;
}

.sql-format__toggle-btn {
  flex-shrink: 0;
  width: 16px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  color: v-bind('currentTheme.colors.textSecondary');
  opacity: 0.5;
  transition: all 0.15s ease;
  font-size: 9px;
}

.sql-format__toggle-btn:hover {
  opacity: 1;
}

.sql-format__toggle-icon {
  display: inline-block;
  transition: transform 0.15s ease;
  transform: rotate(0deg);
  user-select: none;
}

.sql-format__toggle-icon--expanded {
  transform: rotate(90deg);
}

.sql-format__toggle-spacer {
  flex-shrink: 0;
  width: 16px;
  height: 20px;
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
  padding: 0 0 0 22px;
  background-color: transparent;
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
