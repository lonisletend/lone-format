/**
 * XML 节点类型枚举
 */
export type XmlNodeType = 'element' | 'text' | 'comment' | 'cdata' | 'declaration'

/**
 * 主题类型枚举（复用 JSON 的主题）
 */
export type ThemeType = 'github-light' | 'github-dark' | 'min-light' | 'min-dark' | 'slack-ochin'

/**
 * 过滤器类型枚举（仅支持 XPath）
 */
export type FilterType = 'xpath'

/**
 * XML 节点接口
 */
export interface XmlNode {
  // 节点类型
  type: XmlNodeType
  
  // 元素节点属性
  tagName?: string
  attributes?: Record<string, string>
  children?: XmlNode[]
  
  // 文本/注释/CDATA 内容
  content?: string
  
  // 命名空间
  namespace?: string
  prefix?: string
  
  // 内部使用：用于树形展示的路径
  path?: string
}

/**
 * 过滤器配置接口
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

    // XML 语法高亮
    xmlTag: string              // 标签名
    xmlAttribute: string        // 属性名
    xmlAttributeValue: string   // 属性值
    xmlText: string            // 文本内容
    xmlComment: string         // 注释
    xmlCdata: string           // CDATA
    xmlDeclaration: string     // 声明
    xmlBracket: string         // < > 括号
    xmlEquals: string          // = 号
    xmlQuote: string           // 引号

    // 折叠效果
    collapsedBackground: string // 折叠信息背景色
    collapsedBackgroundHover: string // 折叠信息悬停背景色
    collapsedText: string       // 折叠信息文本色

    // 缩进指示线
    indentLine: string          // 对齐线颜色
  }
}

/**
 * XML 格式化选项
 */
export interface XmlFormatOptions {
  // 缩进
  indentBy?: string
  
  // 是否格式化
  format?: boolean
  
  // 是否显示注释
  showComments?: boolean
  
  // 是否显示 CDATA
  showCdata?: boolean
  
  // 是否显示声明
  showDeclaration?: boolean
  
  // 是否保留空白
  preserveWhitespace?: boolean
  
  // 属性是否排序
  sortAttributes?: boolean
  
  // 自闭合标签
  selfClosingTags?: boolean
}

/**
 * 解析后的 XML 数据结构（fast-xml-parser 格式）
 * 使用 preserveOrder: true 时返回数组结构
 */
export type ParsedXml = any[] | { [key: string]: any }

/**
 * XmlFormat 组件暴露的方法接口
 */
export interface XmlFormatExposed {
  // 核心操作方法
  copyXml: () => Promise<void>
  compressSource: () => void
  formatSource: () => void
  expandAll: () => void
  collapseAll: () => void
  toggleExpand: (path: string) => void

  // 过滤相关方法
  filter: (config: FilterConfig) => void
  clearFilter: () => void

  // 排序相关方法
  sort: () => void
  clearSort: () => void
  isSorted: () => boolean

  // 状态访问方法
  isValidXml: () => boolean
  getParsedXml: () => ParsedXml | null
  getFilteredXml: () => ParsedXml | null
  getExpandedNodes: () => Set<string>
  getParseError: () => string
  getFilterError: () => string

  // 工具方法
  parseXmlString: (xmlString: string) => void
  copyValue: (value: any) => Promise<void>
  getValue: (value: any) => string
}
