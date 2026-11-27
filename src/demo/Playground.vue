<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import Icon from './Icon.vue'
import type { DemoFixture, ExposedApi, FormatAdapter, FixtureGroup, ThemeType } from './types'

const props = defineProps<{
  adapter: FormatAdapter
  theme: ThemeType
}>()

const emit = defineEmits<{ 'update:theme': [value: ThemeType] }>()

const THEMES: Array<{ label: string; value: ThemeType }> = [
  { label: 'GitHub Light', value: 'github-light' },
  { label: 'GitHub Dark', value: 'github-dark' },
  { label: 'Min Light', value: 'min-light' },
  { label: 'Min Dark', value: 'min-dark' },
  { label: 'Slack Ochin', value: 'slack-ochin' },
]

const CUSTOM = '__custom__'

const GROUP_LABELS: Record<FixtureGroup, string> = {
  basic: '基础',
  edge: '边界',
  error: '异常',
}

/* ---------------- 用例与源码 ---------------- */

const firstFixture = props.adapter.fixtures[0]
const activeFixtureId = ref(firstFixture.id)
const source = ref(firstFixture.source)

const groupedFixtures = computed(() => {
  const groups: FixtureGroup[] = ['basic', 'edge', 'error']
  return groups
    .map(group => ({
      group,
      label: GROUP_LABELS[group],
      items: props.adapter.fixtures.filter(f => f.group === group),
    }))
    .filter(g => g.items.length > 0)
})

const activeFixture = computed(() =>
  props.adapter.fixtures.find(f => f.id === activeFixtureId.value)
)

const isDirty = computed(() => source.value !== activeFixture.value?.source)

const loadFixture = (fixture: DemoFixture) => {
  activeFixtureId.value = fixture.id
  source.value = fixture.source
  if (fixture.props) {
    for (const [key, value] of Object.entries(fixture.props)) {
      propValues[key] = value
    }
  }
  resetFilter()
}

const resetSource = () => {
  if (activeFixture.value) source.value = activeFixture.value.source
}

const copySource = async () => {
  try {
    await navigator.clipboard.writeText(source.value)
    showToast('源码已复制到剪贴板')
    return
  } catch {
    // 页面未聚焦或无剪贴板权限时降级
  }

  const scratch = document.createElement('textarea')
  scratch.value = source.value
  scratch.style.position = 'fixed'
  scratch.style.opacity = '0'
  document.body.appendChild(scratch)
  scratch.select()
  const ok = document.execCommand('copy')
  document.body.removeChild(scratch)
  showToast(ok ? '源码已复制到剪贴板' : '复制失败，请手动选中复制', ok ? 'ok' : 'error')
}

// 压缩走组件的 compressSource()，它会 emit update:modelValue 回写到 source
const compressSource = () => {
  const api = componentRef.value
  if (!api?.compressSource) return
  try {
    api.compressSource()
  } catch (error) {
    showToast('压缩失败：' + (error as Error).message, 'error')
  }
  bump()
}

/* ---------------- Props 面板 ---------------- */

const propValues = reactive<Record<string, unknown>>({})
const customValues = reactive<Record<string, string>>({})

for (const control of props.adapter.props) {
  propValues[control.key] = control.default
  if (control.allowCustom) customValues[control.key] = 'not-a-real-dialect'
}
if (firstFixture.props) Object.assign(propValues, firstFixture.props)

const resolvedProps = computed(() => {
  const out: Record<string, unknown> = {}
  for (const control of props.adapter.props) {
    const value = propValues[control.key]
    out[control.key] =
      control.allowCustom && value === CUSTOM ? customValues[control.key] : value
  }
  out.theme = props.theme
  return out
})

const resetProps = () => {
  for (const control of props.adapter.props) {
    propValues[control.key] = control.default
  }
}

/* ---------------- 组件实例与状态探针 ---------------- */

const componentRef = ref<ExposedApi | null>(null)
const tick = ref(0)

const bump = async () => {
  await nextTick()
  tick.value++
}

onMounted(bump)
watch([source, resolvedProps], bump)

type StateRow = { key: string; label: string; value: string; tone: string }

const stateRows = computed<StateRow[]>(() => {
  void tick.value
  const api = componentRef.value
  if (!api) return []
  return props.adapter.state.map(probe => {
    try {
      return {
        key: probe.key,
        label: probe.label,
        value: probe.read(api),
        tone: probe.tone ? probe.tone(api) : 'plain',
      }
    } catch (error) {
      return {
        key: probe.key,
        label: probe.label,
        value: 'throw: ' + (error as Error).message,
        tone: 'error',
      }
    }
  })
})

const headlineValid = computed(() => stateRows.value[0]?.tone !== 'error')

/* ---------------- 动作与提示 ---------------- */

const toast = ref<{ text: string; tone: 'ok' | 'error' } | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | undefined

const showToast = (text: string, tone: 'ok' | 'error' = 'ok') => {
  toast.value = { text, tone }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = null), 2000)
}

const isDisabled = (disabled?: (api: ExposedApi) => boolean) => {
  void tick.value
  const api = componentRef.value
  if (!api || !disabled) return false
  try {
    return disabled(api)
  } catch {
    return false
  }
}

const runAction = async (action: FormatAdapter['actions'][number]) => {
  const api = componentRef.value
  if (!api) return
  try {
    await action.run(api)
    if (action.toast) showToast(action.toast)
  } catch (error) {
    showToast(action.label + ' 失败：' + (error as Error).message, 'error')
    pushEvent('action-error', action.id + ' → ' + (error as Error).message)
  }
  bump()
}

/* ---------------- Events 面板 ---------------- */

type EventEntry = { id: number; time: string; name: string; detail: string }

const events = ref<EventEntry[]>([])
let eventSeq = 0

const summarize = (value: unknown): string => {
  if (value === undefined) return ''
  if (value instanceof Error) return value.message
  if (typeof value === 'string') {
    const oneline = value.replace(/\s+/g, ' ').trim()
    return oneline.length > 60 ? oneline.slice(0, 60) + '… (' + value.length + ' 字符)' : oneline
  }
  if (Array.isArray(value)) return 'array[' + value.length + ']'
  if (value && typeof value === 'object') return 'object{' + Object.keys(value).length + '}'
  return String(value)
}

const pushEvent = (name: string, detail: string) => {
  eventSeq += 1
  events.value.unshift({
    id: eventSeq,
    time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
    name,
    detail,
  })
  if (events.value.length > 200) events.value.length = 200
}

const eventHandlers = computed(() => {
  const handlers: Record<string, (...args: unknown[]) => void> = {}
  for (const name of props.adapter.events) {
    handlers[name] = (...args: unknown[]) => {
      if (name === 'update:modelValue') source.value = args[0] as string
      pushEvent(name, summarize(args[0]))
      bump()
    }
  }
  if (!handlers['update:modelValue']) {
    handlers['update:modelValue'] = (...args: unknown[]) => {
      source.value = args[0] as string
    }
  }
  return handlers
})

/* ---------------- Filter 面板 ---------------- */

const filterSpec = computed(() => props.adapter.filter)
const filterKind = ref(filterSpec.value?.kinds[0]?.value ?? '')
const filterExpression = ref('')
const filterApplied = ref(false)
const filterLocalError = ref('')

const currentFilterKind = computed(() =>
  filterSpec.value?.kinds.find(k => k.value === filterKind.value)
)

const filterError = computed(() => {
  void tick.value
  if (filterLocalError.value) return filterLocalError.value
  const api = componentRef.value
  if (!api || !filterSpec.value) return ''
  try {
    return filterSpec.value.error(api)
  } catch {
    return ''
  }
})

const applyFilter = () => {
  const api = componentRef.value
  if (!api || !filterSpec.value || !filterExpression.value.trim()) return
  filterLocalError.value = ''
  try {
    filterSpec.value.apply(api, filterKind.value, filterExpression.value.trim())
    filterApplied.value = true
  } catch (error) {
    filterLocalError.value = (error as Error).message
  }
  bump()
}

const resetFilter = () => {
  const api = componentRef.value
  filterExpression.value = ''
  filterLocalError.value = ''
  if (filterApplied.value && api && filterSpec.value) {
    try {
      filterSpec.value.clear(api)
    } catch {
      /* 组件未挂载或已重建，忽略 */
    }
  }
  filterApplied.value = false
  bump()
}

/* ---------------- 面板开关 ---------------- */

const inspectorTab = ref<'props' | 'filter' | 'state' | 'events'>('props')
const sidebarOpen = ref(true)
const inspectorOpen = ref(true)

const testId = (suffix: string) => props.adapter.id + '-' + suffix
</script>

<template>
  <div class="pg" :class="{ 'pg--no-sidebar': !sidebarOpen, 'pg--no-inspector': !inspectorOpen }">
    <!-- 左：用例库 -->
    <aside v-show="sidebarOpen" class="sidebar">
      <div class="bar bar--plain">
        <span class="bar-title">用例库</span>
        <span class="count">{{ adapter.fixtures.length }}</span>
      </div>

      <div class="fixtures" :data-testid="testId('fixtures')">
        <div v-for="group in groupedFixtures" :key="group.group" class="fixture-group">
          <div class="group-label">{{ group.label }}</div>
          <button
            v-for="fixture in group.items"
            :key="fixture.id"
            class="fixture"
            :class="{ 'fixture--active': fixture.id === activeFixtureId }"
            :data-testid="testId('fixture-' + fixture.id)"
            :title="fixture.note"
            @click="loadFixture(fixture)"
          >
            <span class="fixture-label">{{ fixture.label }}</span>
            <span v-if="fixture.note" class="fixture-note">{{ fixture.note }}</span>
          </button>
        </div>
      </div>
    </aside>

    <!-- 中左：源码输入 -->
    <section class="editor">
      <div class="bar">
        <button
          class="btn btn--icon btn--ghost toggle"
          :title="sidebarOpen ? '收起用例库' : '展开用例库'"
          data-testid="sidebar-toggle"
          @click="sidebarOpen = !sidebarOpen"
        >
          <Icon name="panel" />
        </button>
        <div class="toolbar-actions">
          <button class="btn" title="复制源码" :data-testid="testId('source-copy')" @click="copySource">
            <Icon name="copy" />
            <span class="btn-label">复制</span>
          </button>
          <button class="btn" title="压缩源码" :data-testid="testId('source-compress')" @click="compressSource">
            <Icon name="compress" />
            <span class="btn-label">压缩</span>
          </button>
          <button
            class="btn"
            title="恢复用例原文"
            :disabled="!isDirty"
            :data-testid="testId('source-reset')"
            @click="resetSource"
          >
            <Icon name="sort-off" />
            <span class="btn-label">重置</span>
          </button>
        </div>

        <div class="toolbar-tail">
          <span class="chip" :class="isDirty ? 'chip--warn' : ''" :title="isDirty ? '已修改' : '与用例一致'">
            <span class="dot"></span>
            <span class="btn-label">{{ isDirty ? '已修改' : '用例原文' }}</span>
          </span>
        </div>
      </div>

      <textarea
        v-model="source"
        class="source"
        spellcheck="false"
        :placeholder="adapter.placeholder"
        :data-testid="testId('source')"
      ></textarea>
    </section>

    <!-- 中右：工具条 + 渲染区 -->
    <section class="stage">
      <div class="bar">
        <div class="toolbar-actions">
          <button
            v-for="action in adapter.actions"
            :key="action.id"
            class="btn"
            :class="{ 'btn--primary': action.variant === 'primary' }"
            :disabled="isDisabled(action.disabled)"
            :title="action.label"
            :data-testid="testId('action-' + action.id)"
            @click="runAction(action)"
          >
            <Icon :name="action.icon" />
            <span class="btn-label">{{ action.label }}</span>
          </button>
        </div>

        <div class="toolbar-tail">
          <transition name="fade">
            <span v-if="toast" class="toast" :class="'toast--' + toast.tone">
              <Icon :name="toast.tone === 'ok' ? 'check' : 'alert'" />
              {{ toast.text }}
            </span>
          </transition>
          <span
            class="chip validity"
            :class="headlineValid ? 'chip--ok' : 'chip--error'"
            :title="headlineValid ? '解析通过' : '解析失败'"
            :data-testid="testId('validity')"
          >
            <span class="dot"></span>
            <span class="btn-label">{{ headlineValid ? '解析通过' : '解析失败' }}</span>
          </span>
          <select
            class="field theme-select"
            :value="theme"
            title="组件主题"
            data-testid="theme-select"
            @change="emit('update:theme', ($event.target as HTMLSelectElement).value as ThemeType)"
          >
            <option v-for="option in THEMES" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
          <button
            class="btn btn--icon btn--ghost toggle"
            :title="inspectorOpen ? '收起检查器' : '展开检查器'"
            data-testid="inspector-toggle"
            @click="inspectorOpen = !inspectorOpen"
          >
            <Icon name="panel" />
          </button>
        </div>
      </div>

      <div class="render" :data-testid="testId('render')">
        <component
          :is="adapter.component"
          ref="componentRef"
          :model-value="source"
          v-bind="resolvedProps"
          v-on="eventHandlers"
        />
      </div>
    </section>

    <!-- 右：Inspector -->
    <aside v-show="inspectorOpen" class="inspector">
      <div class="tabs">
        <button
          v-for="tab in (['props', 'filter', 'state', 'events'] as const)"
          :key="tab"
          class="tab"
          :class="{ 'tab--active': inspectorTab === tab }"
          :data-testid="testId('tab-' + tab)"
          @click="inspectorTab = tab"
        >
          {{ { props: 'Props', filter: 'Filter', state: 'State', events: 'Events' }[tab] }}
          <span v-if="tab === 'events' && events.length" class="count">{{ events.length }}</span>
        </button>
      </div>

      <!-- Props -->
      <div v-show="inspectorTab === 'props'" class="pane">
        <div class="pane-head">
          <span class="pane-title">组件 props</span>
          <button class="btn btn--ghost btn--sm" @click="resetProps">恢复默认</button>
        </div>

        <div v-for="control in adapter.props" :key="control.key" class="control">
          <label class="control-row">
            <span class="control-label mono">{{ control.label }}</span>

            <input
              v-if="control.type === 'boolean'"
              type="checkbox"
              class="checkbox"
              :checked="propValues[control.key] as boolean"
              :data-testid="testId('prop-' + control.key)"
              @change="propValues[control.key] = ($event.target as HTMLInputElement).checked"
            />

            <input
              v-else-if="control.type === 'number'"
              type="number"
              class="field control-input"
              :min="control.min"
              :max="control.max"
              :value="propValues[control.key] as number"
              :data-testid="testId('prop-' + control.key)"
              @input="propValues[control.key] = Number(($event.target as HTMLInputElement).value)"
            />

            <select
              v-else-if="control.type === 'select'"
              class="field control-input"
              :value="propValues[control.key]"
              :data-testid="testId('prop-' + control.key)"
              @change="propValues[control.key] = ($event.target as HTMLSelectElement).value"
            >
              <option v-for="option in control.options" :key="String(option.value)" :value="option.value">
                {{ option.label }}
              </option>
              <option v-if="control.allowCustom" :value="CUSTOM">自定义 / 非法值…</option>
            </select>

            <input
              v-else
              class="field control-input"
              :value="propValues[control.key] as string"
              :data-testid="testId('prop-' + control.key)"
              @input="propValues[control.key] = ($event.target as HTMLInputElement).value"
            />
          </label>

          <input
            v-if="control.allowCustom && propValues[control.key] === CUSTOM"
            v-model="customValues[control.key]"
            class="field control-custom"
            placeholder="注入任意值"
            :data-testid="testId('prop-' + control.key + '-custom')"
          />

          <p v-if="control.note" class="control-note">{{ control.note }}</p>
        </div>

        <p class="hint">
          组件源码：<code>{{ adapter.sourcePath }}</code>
        </p>
      </div>

      <!-- Filter -->
      <div v-show="inspectorTab === 'filter'" class="pane">
        <template v-if="adapter.filter">
          <div class="pane-head">
            <span class="pane-title">过滤表达式</span>
            <span v-if="filterApplied" class="chip chip--accent">已应用</span>
          </div>

          <select
            v-if="adapter.filter.kinds.length > 1"
            v-model="filterKind"
            class="field block"
            :data-testid="testId('filter-kind')"
          >
            <option v-for="kind in adapter.filter.kinds" :key="kind.value" :value="kind.value">
              {{ kind.label }}
            </option>
          </select>

          <input
            v-model="filterExpression"
            class="field block mono"
            :placeholder="currentFilterKind?.placeholder"
            :data-testid="testId('filter-expression')"
            @keyup.enter="applyFilter"
          />

          <div class="row">
            <button
              class="btn btn--primary"
              :disabled="!filterExpression.trim()"
              :data-testid="testId('filter-apply')"
              @click="applyFilter"
            >
              <Icon name="filter" />
              应用
            </button>
            <button
              class="btn"
              :disabled="!filterApplied"
              :data-testid="testId('filter-clear')"
              @click="resetFilter"
            >
              <Icon name="close" />
              清除
            </button>
          </div>

          <p v-if="filterError" class="callout callout--error" :data-testid="testId('filter-error')">
            {{ filterError }}
          </p>

          <div class="samples">
            <div class="group-label">示例</div>
            <button
              v-for="sample in currentFilterKind?.samples || []"
              :key="sample"
              class="sample mono"
              @click="filterExpression = sample"
            >
              {{ sample }}
            </button>
          </div>
        </template>

        <p v-else class="callout">{{ adapter.filterUnavailable }}</p>
      </div>

      <!-- State -->
      <div v-show="inspectorTab === 'state'" class="pane">
        <div class="pane-head">
          <span class="pane-title">暴露方法返回值</span>
        </div>
        <dl class="state" :data-testid="testId('state')">
          <template v-for="row in stateRows" :key="row.key">
            <dt class="mono">{{ row.label }}</dt>
            <dd
              class="mono"
              :class="'tone-' + row.tone"
              :data-testid="testId('state-' + row.key)"
            >
              {{ row.value }}
            </dd>
          </template>
        </dl>
      </div>

      <!-- Events -->
      <div v-show="inspectorTab === 'events'" class="pane">
        <div class="pane-head">
          <span class="pane-title">emit 日志</span>
          <button class="btn btn--ghost btn--sm" :disabled="!events.length" @click="events = []">
            清空
          </button>
        </div>
        <ul class="events" :data-testid="testId('events')">
          <li v-for="entry in events" :key="entry.id" class="event">
            <span class="event-time mono">{{ entry.time }}</span>
            <span class="event-name mono">{{ entry.name }}</span>
            <span v-if="entry.detail" class="event-detail">{{ entry.detail }}</span>
          </li>
        </ul>
        <p v-if="!events.length" class="hint">
          监听中：<code>{{ adapter.events.join(', ') }}</code>
        </p>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.pg {
  display: grid;
  grid-template-columns:
    var(--w-sidebar)
    minmax(260px, var(--w-editor))
    minmax(0, 1fr)
    var(--w-inspector);
  height: 100%;
  min-height: 0;
}

.pg--no-sidebar {
  grid-template-columns: minmax(260px, var(--w-editor)) minmax(0, 1fr) var(--w-inspector);
}

.pg--no-inspector {
  grid-template-columns: var(--w-sidebar) minmax(260px, var(--w-editor)) minmax(0, 1fr);
}

.pg--no-sidebar.pg--no-inspector {
  grid-template-columns: minmax(260px, var(--w-editor)) minmax(0, 1fr);
}

/* ---- 通用栏头 ---- */

/* 四列共用的顶部栏：同高、同分割线、同内边距 */
.bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
  height: var(--h-bar-row);
  padding: 0 8px;
  border-bottom: 1px solid var(--c-border);
  background: var(--c-bg-sunken);
}

/* 渲染列的栏跟随渲染区底色 */
.stage > .bar {
  background: var(--c-bg);
}

.bar--plain {
  padding-left: 10px;
}

.bar-title {
  font-size: var(--fs-sm);
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--c-text-muted);
  white-space: nowrap;
  margin-right: auto;
}


/* ---- 左：用例库 ---- */

.sidebar {
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--c-bg-sunken);
  border-right: 1px solid var(--c-border);
}



.count {
  font-size: 11px;
  color: var(--c-text-faint);
  background: var(--c-bg-active);
  border-radius: 999px;
  padding: 0 6px;
  line-height: 16px;
}

.fixtures {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding-bottom: 8px;
}

.group-label {
  font-size: 11px;
  color: var(--c-text-faint);
  padding: 6px 10px 2px;
}

.fixture {
  display: block;
  width: 100%;
  text-align: left;
  padding: 5px 10px 5px 14px;
  border: none;
  border-left: 2px solid transparent;
  background: transparent;
  color: var(--c-text);
  font-family: inherit;
  font-size: var(--fs-base);
  cursor: pointer;
}

.fixture:hover {
  background: var(--c-bg-hover);
}

.fixture--active {
  background: var(--c-bg-active);
  border-left-color: var(--c-accent);
}

.fixture-label {
  display: block;
}

.fixture-note {
  display: block;
  font-size: 11px;
  color: var(--c-text-faint);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.source {
  flex: 1 1 auto;
  min-height: 0;
  resize: none;
  padding: 10px 12px;
  border: none;
  background: var(--c-bg-raised);
  color: var(--c-text);
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  line-height: 1.65;
  outline: none;
  tab-size: 2;
  white-space: pre;
  overflow: auto;
}

.source:focus {
  box-shadow: inset 2px 0 0 var(--c-accent);
}

/* ---- 中左：源码 ---- */

.editor {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background: var(--c-bg-raised);
  border-right: 1px solid var(--c-border);
  container-type: inline-size;
}

/* ---- 中右：渲染 ---- */

.stage {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background: var(--c-bg);
  container-type: inline-size;
}

/* 渲染列变窄时逐级收起文字，保证工具条不被裁切 */
.toolbar-actions .btn {
  padding: 0 8px;
}

/* 渲染列变窄时逐级收起文字（仅渲染列，源码列只有三个按钮不会挤） */
@container (max-width: 700px) {
  .stage .validity .btn-label {
    display: none;
  }

  .stage .validity {
    padding: 0 5px;
  }

  .stage .theme-select {
    max-width: 108px;
  }
}

@container (max-width: 470px) {
  .stage .toolbar-actions .btn-label {
    display: none;
  }

  .stage .toolbar-actions .btn {
    width: var(--h-control);
    padding: 0;
    justify-content: center;
  }
}

@container (max-width: 300px) {
  .editor .toolbar-actions .btn-label {
    display: none;
  }

  .editor .toolbar-actions .btn {
    width: var(--h-control);
    padding: 0;
    justify-content: center;
  }
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1 1 auto;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
  padding: 8px 0;
}

.toolbar-actions::-webkit-scrollbar {
  display: none;
}

.toolbar-tail {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
  margin-left: auto;
  padding-left: 8px;
  border-left: 1px solid var(--c-border);
}

.toggle {
  color: var(--c-text-muted);
}

.theme-select {
  height: var(--h-control);
  font-size: var(--fs-sm);
  max-width: 132px;
}

.toast {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--fs-sm);
  color: var(--c-ok);
  white-space: nowrap;
}

.toast--error {
  color: var(--c-error);
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  line-height: 18px;
  padding: 0 7px;
  border-radius: 999px;
  border: 1px solid var(--c-border);
  color: var(--c-text-muted);
  white-space: nowrap;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  flex: none;
}

.chip--ok {
  color: var(--c-ok);
  border-color: currentColor;
}

.chip--error {
  color: var(--c-error);
  border-color: currentColor;
}

.chip--warn {
  color: var(--c-warn);
  border-color: currentColor;
}

.chip--accent {
  color: var(--c-accent);
  border-color: currentColor;
}

.render {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding: 12px;
}

/* ---- 右侧 ---- */

.inspector {
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--c-bg-sunken);
  border-left: 1px solid var(--c-border);
}

.tabs {
  display: flex;
  flex: none;
  height: var(--h-bar-row);
  border-bottom: 1px solid var(--c-border);
}

.tab {
  flex: 1 1 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: var(--h-bar-row);
  padding: 0 4px;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--c-text-muted);
  font-family: inherit;
  font-size: var(--fs-sm);
  cursor: pointer;
}

.tab:hover {
  color: var(--c-text);
  background: var(--c-bg-hover);
}

.tab--active {
  color: var(--c-text);
  border-bottom-color: var(--c-accent);
}

.pane {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 10px;
}

.pane-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.pane-title {
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--c-text-muted);
  margin-right: auto;
}

.btn--sm {
  height: 22px;
  padding: 0 6px;
  font-size: var(--fs-sm);
  color: var(--c-text-muted);
}

.control {
  padding: 4px 0;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-label {
  flex: 1 1 auto;
  color: var(--c-text);
}

.control-input {
  flex: 0 0 132px;
  height: 24px;
  font-size: var(--fs-sm);
}

.control-custom {
  width: 100%;
  margin-top: 6px;
  height: 24px;
  font-size: var(--fs-sm);
  font-family: var(--font-mono);
}

.control-note {
  margin: 4px 0 0;
  font-size: 11px;
  color: var(--c-text-faint);
}

.checkbox {
  width: 14px;
  height: 14px;
  margin: 0;
  accent-color: var(--c-accent);
  cursor: pointer;
}

.block {
  display: block;
  width: 100%;
  margin-bottom: 8px;
  height: 26px;
  font-size: var(--fs-sm);
}

.row {
  display: flex;
  gap: 6px;
}

.callout {
  margin: 10px 0 0;
  padding: 8px;
  font-size: var(--fs-sm);
  line-height: 1.6;
  color: var(--c-text-muted);
  background: var(--c-bg-raised);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
}

.callout--error {
  color: var(--c-error);
  border-color: currentColor;
  word-break: break-word;
}

.samples {
  margin-top: 12px;
}

.sample {
  display: block;
  width: 100%;
  text-align: left;
  padding: 4px 6px;
  margin-bottom: 4px;
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  background: var(--c-bg-raised);
  color: var(--c-text-muted);
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sample:hover {
  color: var(--c-text);
  border-color: var(--c-border-strong);
}

.state {
  margin: 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
}

.state dt {
  color: var(--c-text-muted);
  font-size: 11px;
  padding-top: 8px;
}

.state dd {
  margin: 2px 0 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--c-border);
  word-break: break-word;
  color: var(--c-text);
}

.tone-ok {
  color: var(--c-ok);
}

.tone-error {
  color: var(--c-error);
}

.tone-muted {
  color: var(--c-text-faint);
}

.events {
  list-style: none;
  margin: 0;
  padding: 0;
}

.event {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px;
  padding: 5px 0;
  border-bottom: 1px solid var(--c-border);
}

.event-time {
  color: var(--c-text-faint);
  font-size: 11px;
}

.event-name {
  color: var(--c-accent);
}

.event-detail {
  flex: 1 1 100%;
  font-size: 11px;
  color: var(--c-text-muted);
  word-break: break-word;
}

.hint {
  margin: 12px 0 0;
  font-size: 11px;
  line-height: 1.7;
  color: var(--c-text-faint);
  word-break: break-all;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 中等宽度：先收掉源码列的下限，保证渲染区不被挤扁 */
@media (max-width: 1400px) {
  .pg {
    grid-template-columns:
      var(--w-sidebar)
      minmax(220px, 26%)
      minmax(0, 1fr)
      var(--w-inspector);
  }
}

@media (max-width: 1100px) {
  .pg,
  .pg--no-sidebar,
  .pg--no-inspector,
  .pg--no-sidebar.pg--no-inspector {
    grid-template-columns: minmax(0, 1fr);
    grid-auto-rows: minmax(0, auto);
    height: auto;
  }

  .sidebar,
  .editor,
  .inspector {
    border-right: none;
    border-bottom: 1px solid var(--c-border);
  }

  .sidebar {
    max-height: 240px;
  }

  .editor {
    height: 280px;
  }

  .render {
    min-height: 420px;
  }
}
</style>
