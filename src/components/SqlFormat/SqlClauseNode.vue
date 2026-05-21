<template>
  <div class="sql-clause-node">
    <div
      class="sql-clause-node__header"
      :class="{ 'sql-clause-node__header--collapsible': clause.collapsible }"
      :title="clause.collapsible ? (isExpanded ? 'Click to collapse' : 'Click to expand') : ''"
      @click="onHeaderClick"
    >
      <pre class="sql-clause-node__code"><code v-html="headerHtml"></code></pre>
    </div>

    <div v-if="isExpanded && hasBody" class="sql-clause-node__body">
      <!-- 含嵌套子查询：按片段渲染 -->
      <template v-if="clause.body && clause.body.length > 0">
        <template v-for="(segment, idx) in clause.body" :key="idx">
          <pre
            v-if="segment.kind === 'text'"
            class="sql-clause-node__code sql-clause-node__text-segment"
            :class="{ 'sql-clause-node__text-segment--clickable': clause.collapsible }"
            :title="clause.collapsible ? 'Click ( or ) to collapse' : ''"
            @click="onParenClick($event)"
          ><code v-html="highlight(segment.text)"></code></pre>
          <SqlClauseNode
            v-else
            :clause="segment.clause"
            :expanded-clauses="expandedClauses"
            :theme="theme"
            @toggle="$emit('toggle', $event)"
          />
        </template>
      </template>

      <!-- 没有嵌套子查询：原有的整段渲染 -->
      <pre
        v-else
        class="sql-clause-node__code sql-clause-node__rest"
        :class="{ 'sql-clause-node__rest--clickable': clause.collapsible }"
        :title="clause.collapsible ? 'Click ( or ) to collapse' : ''"
        @click="onParenClick($event)"
      ><code v-html="highlight(restText)"></code></pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SqlClause, ThemeConfig } from './types'
import { tokenizeSql } from './parser'

interface Props {
  clause: SqlClause
  expandedClauses: Set<string>
  theme: ThemeConfig
}

const props = defineProps<Props>()

const emit = defineEmits<{
  toggle: [path: string]
}>()

const path = computed(() => props.clause.path || '')
const isExpanded = computed(() => props.expandedClauses.has(path.value))

const headerLine = computed(() => {
  const lines = props.clause.content.split('\n')
  for (const line of lines) {
    if (line.trim()) return line
  }
  return ''
})

const restText = computed(() => {
  const lines = props.clause.content.split('\n')
  if (lines.length <= 1) return ''
  let firstIdx = 0
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim()) {
      firstIdx = i
      break
    }
  }
  return lines.slice(firstIdx + 1).join('\n')
})

const hasBody = computed(() => {
  if (props.clause.body && props.clause.body.length > 0) return true
  return !!restText.value
})

const highlight = (text: string): string => {
  const tokens = tokenizeSql(text)
  const colors = props.theme.colors
  return tokens
    .map(token => {
      let color = colors.text
      switch (token.type) {
        case 'keyword':
          color = colors.sqlKeyword
          break
        case 'function':
          color = colors.sqlFunction
          break
        case 'string':
          color = colors.sqlString
          break
        case 'number':
          color = colors.sqlNumber
          break
        case 'comment':
          color = colors.sqlComment
          break
        case 'operator':
          color = colors.sqlOperator
          break
        case 'identifier':
          color = colors.sqlIdentifier
          break
        case 'punctuation':
          color = colors.sqlPunctuation
          break
        case 'whitespace':
          return token.value.replace(/ /g, '&nbsp;').replace(/\n/g, '\n')
      }
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

// 折叠时的子查询预览：用 (...) 折叠内部嵌套子句，保留 `(` 之前与 `)` 之后的修饰（别名、IN 等）
const collapsedSubqueryPreview = computed<string | null>(() => {
  const body = props.clause.body
  if (!body || body.length === 0) return null

  // 从前往后扫描，收集 `(` 之前的修饰文本（一旦遇到嵌套子句还没见到 `(`，则放弃预览）
  let prefix = ''
  let foundOpen = false
  for (const seg of body) {
    if (seg.kind === 'text') {
      const openIdx = seg.text.indexOf('(')
      if (openIdx >= 0) {
        prefix += seg.text.slice(0, openIdx)
        foundOpen = true
        break
      }
      prefix += seg.text
    } else {
      return null
    }
  }
  if (!foundOpen) return null

  // 从后往前扫描，收集 `)` 之后的修饰文本（别名等）
  let suffix = ''
  for (let i = body.length - 1; i >= 0; i--) {
    const seg = body[i]
    if (seg.kind === 'text') {
      const closeIdx = seg.text.lastIndexOf(')')
      if (closeIdx >= 0) {
        suffix = seg.text.slice(closeIdx + 1) + suffix
        break
      }
      suffix = seg.text + suffix
    } else {
      break
    }
  }

  const prefixTrimmed = prefix.replace(/\s+/g, ' ').trim()
  const suffixTrimmed = suffix.replace(/\s+/g, ' ').trim()

  const header = headerLine.value
  const leading = (header.match(/^\s*/) || [''])[0]
  const headerBody = header.trimStart()

  const parts: string[] = [headerBody]
  if (prefixTrimmed) parts.push(prefixTrimmed)
  parts.push('(...)')
  if (suffixTrimmed) parts.push(suffixTrimmed)

  return `${leading}${parts.join(' ')}`
})

const headerHtml = computed(() => {
  if (props.clause.collapsible && !isExpanded.value && hasBody.value) {
    const preview = collapsedSubqueryPreview.value
    if (preview) {
      return highlight(preview)
    }
    const base = highlight(headerLine.value)
    const ellipsisColor = props.theme.colors.textSecondary
    return `${base}<span style="color: ${ellipsisColor}; opacity: 0.6; font-style: italic; margin-left: 4px;"> ...</span>`
  }
  return highlight(headerLine.value)
})

const onHeaderClick = () => {
  if (!props.clause.collapsible) return
  emit('toggle', path.value)
}

const onParenClick = (event: MouseEvent) => {
  if (!props.clause.collapsible) return
  const target = event.target as HTMLElement | null
  if (!target) return
  const text = (target.textContent || '').trim()
  if (text === '(' || text === ')') {
    emit('toggle', path.value)
  }
}
</script>

<style scoped>
.sql-clause-node {
  display: flex;
  flex-direction: column;
}

.sql-clause-node__header {
  display: flex;
  align-items: flex-start;
  padding: 2px 0;
}

.sql-clause-node__header--collapsible {
  cursor: pointer;
}

.sql-clause-node__header--collapsible:hover {
  opacity: 0.8;
}

.sql-clause-node__body {
  display: flex;
  flex-direction: column;
}

.sql-clause-node__code {
  margin: 0;
  padding: 0;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre;
  text-align: left;
  flex: 1;
}

.sql-clause-node__code code {
  font-family: inherit;
  display: block;
  text-align: left;
}

.sql-clause-node__text-segment--clickable,
.sql-clause-node__rest--clickable {
  cursor: default;
}
</style>
