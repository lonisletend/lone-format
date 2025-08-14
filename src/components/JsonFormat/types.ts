/**
 * Filter 类型枚举
 */
export type FilterType = 'jsonpath' | 'js'

/**
 * Filter 配置接口
 */
export interface FilterConfig {
  type: FilterType
  expression: string
}

/**
 * JsonFormat 组件暴露的方法接口
 */
export interface JsonFormatExposed {
  // 核心操作方法
  copyJson: () => Promise<void>
  expandAll: () => void
  collapseAll: () => void
  toggleExpand: (path: string) => void
  updateValue: (path: string, newValue: any) => void
  updateKey: (oldPath: string, newKey: string) => void

  // Filter 相关方法
  filter: (config: FilterConfig) => void
  clearFilter: () => void

  // 状态访问方法
  isValidJson: () => boolean
  getParsedJson: () => any
  getFilteredJson: () => any
  getExpandedNodes: () => Set<string>
  getParseError: () => string
  getFilterError: () => string

  // 工具方法
  parseJson: (jsonString: string) => void
  copyValue: (value: any) => Promise<void>
}

/**
 * JsonFormat 组件的 Props 接口
 */
export interface JsonFormatProps {
  modelValue: string
  readonly?: boolean
  maxDepth?: number
  showToolbar?: boolean
}

/**
 * JsonFormat 组件的事件接口
 */
export interface JsonFormatEmits {
  'update:modelValue': [value: string]
  'copy-success': [value: string]
  'copy-error': [error: Error]
  'expand-all': []
  'collapse-all': []
  'filter-success': [filteredData: any]
  'filter-error': [error: Error]
}
