/**
 * SQL 方言类型枚举
 */
export type SqlDialect = 'mysql' | 'postgresql' | 'sqlite' | 'sql' | 'plsql' | 'tsql'

/**
 * 主题类型枚举（复用现有主题）
 */
export type ThemeType = 'github-light' | 'github-dark' | 'min-light' | 'slack-ochin'

/**
 * SQL 子句类型
 */
export type SqlClauseType = 
  | 'SELECT' 
  | 'FROM' 
  | 'JOIN' 
  | 'WHERE' 
  | 'GROUP BY' 
  | 'HAVING' 
  | 'ORDER BY' 
  | 'LIMIT'
  | 'INSERT'
  | 'INSERT INTO'
  | 'VALUES'
  | 'VALUE_TUPLE'
  | 'UPDATE'
  | 'SET'
  | 'DELETE'
  | 'CREATE'
  | 'ALTER'
  | 'DROP'
  | 'UNKNOWN'

/**
 * SQL 子句节点接口
 */
export interface SqlClause {
  // 子句类型
  type: SqlClauseType
  
  // 子句内容
  content: string
  
  // 原始文本
  raw: string
  
  // 是否可折叠
  collapsible: boolean
  
  // 内部使用：用于树形展示的路径
  path?: string
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
    hoverBackground: string

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

    // SQL 语法高亮
    sqlKeyword: string         // SQL 关键字
    sqlFunction: string        // SQL 函数
    sqlString: string          // 字符串
    sqlNumber: string          // 数字
    sqlComment: string         // 注释
    sqlOperator: string        // 操作符
    sqlIdentifier: string      // 标识符（表名、列名）
    sqlPunctuation: string     // 标点符号

    // 折叠效果
    collapsedBackground: string // 折叠信息背景色
    collapsedText: string       // 折叠信息文本色

    // 缩进指示线
    indentLine: string          // 对齐线颜色
  }
}

/**
 * SQL 格式化选项
 */
export interface SqlFormatOptions {
  // SQL 方言
  dialect?: SqlDialect
  
  // 缩进宽度
  tabWidth?: number
  
  // 关键字大小写
  keywordCase?: 'upper' | 'lower' | 'preserve'
  
  // 是否使用制表符
  useTabs?: boolean
  
  // 每行最大长度
  linesBetweenQueries?: number
}

/**
 * SQL 格式化组件暴露的方法
 */
export interface SqlFormatExposed {
  // 复制 SQL
  copySql: () => Promise<void>
  
  // 格式化 SQL
  formatSource: () => void
  
  // 压缩 SQL
  compressSource: () => void
  
  // 全部展开
  expandAll: () => void
  
  // 全部折叠
  collapseAll: () => void
  
  // 切换节点展开状态
  toggleExpand: (path: string) => void
  
  // 验证 SQL
  isValidSql: () => boolean
  
  // 获取解析后的 SQL 子句
  getParsedSql: () => SqlClause[] | null
  
  // 获取解析错误
  getParseError: () => string
}

/**
 * 解析后的 SQL 数据
 */
export interface ParsedSql {
  clauses: SqlClause[]
  raw: string
}
