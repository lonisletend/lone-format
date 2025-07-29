// 组件相关类型定义
export interface Action {
  label: string
  type?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  handler?: () => void
}

export interface DemoFormatProps {
  title?: string
  content?: string
  badge?: string
  type?: 'info' | 'success' | 'warning' | 'error'
  actions?: Action[]
  showActions?: boolean
}

export interface JsonFormatProps {
  modelValue: string
  readonly?: boolean
  maxDepth?: number
}

// 导出组件类型
declare module 'vue' {
  interface GlobalComponents {
    DemoFormat: typeof import('../components/DemoFormat/index.vue')['default']
    JsonFormat: typeof import('../components/JsonFormat/index.vue')['default']
  }
}
