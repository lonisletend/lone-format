/**
 * Demo playground 的格式适配层类型定义。
 *
 * Playground 本身不认识 JSON / XML / SQL，只消费这里定义的 FormatAdapter。
 * 新增一种格式 = 新增一个 src/demo/formats/<name>.ts，不需要改 Playground。
 */
import type { Component } from 'vue'

export type FormatId = 'json' | 'xml' | 'sql'

export type ThemeType =
  | 'github-light'
  | 'github-dark'
  | 'min-light'
  | 'min-dark'
  | 'slack-ochin'

/** 组件 defineExpose 出来的 API，各格式形状不同，这里统一按 any 处理 */
export type ExposedApi = Record<string, any>

export type FixtureGroup = 'basic' | 'edge' | 'error'

export interface DemoFixture {
  id: string
  label: string
  group: FixtureGroup
  /** 一句话说明这个用例在测什么 */
  note?: string
  source: string
  /** 加载用例时一并写入的 props（例如 SQL 的 dialect） */
  props?: Record<string, unknown>
}

export type IconName =
  | 'expand'
  | 'collapse'
  | 'sort'
  | 'sort-off'
  | 'format'
  | 'compress'
  | 'copy'
  | 'filter'
  | 'close'
  | 'check'
  | 'alert'
  | 'sun'
  | 'moon'
  | 'panel'

export interface DemoAction {
  id: string
  label: string
  icon: IconName
  /** primary 只给该格式最核心的一个动作 */
  variant?: 'primary' | 'default'
  run: (api: ExposedApi) => void | Promise<void>
  /** 成功后的瞬时提示文案；不写则不提示 */
  toast?: string
  /** 返回 true 时按钮置灰 */
  disabled?: (api: ExposedApi) => boolean
}

export interface DemoPropControl {
  key: string
  label: string
  type: 'boolean' | 'number' | 'select' | 'text'
  default: unknown
  options?: Array<{ label: string; value: unknown }>
  min?: number
  max?: number
  /** select 专用：选中 __custom__ 时额外显示一个自由输入框（用于注入非法值） */
  allowCustom?: boolean
  note?: string
}

export interface DemoStateProbe {
  key: string
  label: string
  /** 返回展示字符串；抛错由 Playground 捕获并展示 */
  read: (api: ExposedApi) => string
  /** 返回 'ok' | 'error' | 'muted'，用于着色 */
  tone?: (api: ExposedApi) => 'ok' | 'error' | 'muted'
}

export interface DemoFilterKind {
  value: string
  label: string
  placeholder: string
  samples: string[]
}

export interface DemoFilterSpec {
  kinds: DemoFilterKind[]
  apply: (api: ExposedApi, kind: string, expression: string) => void
  clear: (api: ExposedApi) => void
  /** 返回过滤错误文案，空串表示无错误 */
  error: (api: ExposedApi) => string
}

export interface FormatAdapter {
  id: FormatId
  label: string
  /** 组件在仓库中的路径，展示在侧栏，方便对照源码 */
  sourcePath: string
  component: Component
  /** source textarea 的占位文案 */
  placeholder: string
  fixtures: DemoFixture[]
  actions: DemoAction[]
  props: DemoPropControl[]
  state: DemoStateProbe[]
  /** 组件 emit 的事件名，Playground 自动挂监听并记录到 Events 面板 */
  events: string[]
  filter?: DemoFilterSpec
  /** 无 filter API 时在 Filter 面板展示的说明 */
  filterUnavailable?: string
}
