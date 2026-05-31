/**
 * Filter 类型枚举
 */
export type FilterType = 'jsonpath' | 'js'

/**
 * 主题类型枚举
 */
export type ThemeType = 'github-light' | 'github-dark' | 'min-light' | 'slack-ochin'

/**
 * Filter 配置接口
 */
export interface FilterConfig {
  type: FilterType
  expression: string
}

/**
 * 主题配置接口
 */
export interface ThemeConfig {
  name: ThemeType
  colors: {
    // 背景色
    background: string
    surfaceBackground: string

    // 边框色
    border: string

    // 文本色
    text: string
    textSecondary: string

    // 按钮样式
    buttonBackground: string
    buttonBackgroundHover: string
    buttonBorder: string
    buttonText: string
    buttonPrimary: string
    buttonPrimaryHover: string

    // 状态指示
    success: string
    successBackground: string
    error: string
    errorBackground: string

    // JSON 语法高亮
    syntaxString: string
    syntaxNumber: string
    syntaxBoolean: string
    syntaxNull: string
    syntaxKey: string
    syntaxBracket: string

    // 悬停效果
    hoverBackground: string
    
    // 选中背景色
    selectionBackground: string

    // 折叠信息样式
    collapsedBackground: string
    collapsedBackgroundHover: string
    collapsedText: string

    // 缩进线
    indentLine: string
  }
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

  // Key 排序相关方法
  sortKeys: () => void
  clearSortKeys: () => void
  isSorted: () => boolean

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
  getValue: (value: any) => string
}

/**
 * JsonFormat 组件的 Props 接口
 */
export interface JsonFormatProps {
  modelValue: string
  readonly?: boolean
  maxDepth?: number
  showToolbar?: boolean
  theme?: ThemeType
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
