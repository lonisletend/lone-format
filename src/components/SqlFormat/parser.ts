/**
 * SQL 解析和格式化工具
 * 使用 sql-formatter 进行格式化
 */

import { format } from 'sql-formatter'
import type { SqlClause, ParsedSql, SqlFormatOptions } from './types'

/**
 * SQL 关键字列表（用于基础验证和解析）
 */
const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'OUTER',
  'ON', 'GROUP', 'BY', 'HAVING', 'ORDER', 'LIMIT', 'OFFSET',
  'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE',
  'CREATE', 'ALTER', 'DROP', 'TABLE', 'DATABASE', 'INDEX', 'VIEW',
  'AND', 'OR', 'NOT', 'IN', 'BETWEEN', 'LIKE', 'IS', 'NULL',
  'AS', 'DISTINCT', 'UNION', 'ALL', 'EXISTS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END'
]

/**
 * 主要子句关键字
 */
const MAJOR_CLAUSES = [
  'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT',
  'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP',
  'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'OUTER JOIN'
]

/**
 * 验证 SQL 字符串（基础验证）
 */
export const validateSql = (sqlString: string): { valid: boolean; error?: string } => {
  try {
    if (!sqlString || !sqlString.trim()) {
      return { valid: false, error: 'SQL string is empty' }
    }

    // 基础验证：检查是否包含至少一个 SQL 关键字
    const upperSql = sqlString.toUpperCase()
    const hasKeyword = SQL_KEYWORDS.some(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`)
      return regex.test(upperSql)
    })

    if (!hasKeyword) {
      return { valid: false, error: 'No valid SQL keywords found' }
    }

    // 基础括号匹配验证
    let parenCount = 0
    for (const char of sqlString) {
      if (char === '(') parenCount++
      if (char === ')') parenCount--
      if (parenCount < 0) {
        return { valid: false, error: 'Mismatched parentheses' }
      }
    }
    if (parenCount !== 0) {
      return { valid: false, error: 'Mismatched parentheses' }
    }

    // 基础引号匹配验证
    let singleQuoteCount = 0
    let doubleQuoteCount = 0
    let escaped = false
    
    for (let i = 0; i < sqlString.length; i++) {
      const char = sqlString[i]
      
      if (escaped) {
        escaped = false
        continue
      }
      
      if (char === '\\') {
        escaped = true
        continue
      }
      
      if (char === "'") singleQuoteCount++
      if (char === '"') doubleQuoteCount++
    }
    
    if (singleQuoteCount % 2 !== 0) {
      return { valid: false, error: 'Mismatched single quotes' }
    }
    if (doubleQuoteCount % 2 !== 0) {
      return { valid: false, error: 'Mismatched double quotes' }
    }

    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown validation error',
    }
  }
}

/**
 * 格式化 SQL 字符串
 */
export const formatSql = (
  sqlString: string,
  options?: SqlFormatOptions
): string => {
  try {
    const language = options?.dialect || 'sql'
    const tabWidth = options?.tabWidth || 2
    const keywordCase = options?.keywordCase || 'upper'
    const useTabs = options?.useTabs || false
    const linesBetweenQueries = options?.linesBetweenQueries || 1

    return format(sqlString, {
      language,
      tabWidth,
      keywordCase,
      useTabs,
      linesBetweenQueries,
    })
  } catch (error) {
    throw new Error(
      `SQL 格式化失败: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * 压缩 SQL 字符串（移除多余空格和换行）
 */
export const compressSql = (sqlString: string): string => {
  try {
    // 移除注释
    let result = sqlString
      // 移除单行注释 --
      .replace(/--[^\n]*/g, '')
      // 移除多行注释 /* */
      .replace(/\/\*[\s\S]*?\*\//g, '')
    
    // 保护字符串字面量
    const strings: string[] = []
    result = result.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, (match) => {
      strings.push(match)
      return `__STRING_${strings.length - 1}__`
    })
    
    // 压缩空白字符
    result = result
      .replace(/\s+/g, ' ')  // 多个空白字符替换为单个空格
      .replace(/\s*([(),;])\s*/g, '$1')  // 移除标点符号周围的空格
      .trim()
    
    // 恢复字符串字面量
    strings.forEach((str, index) => {
      result = result.replace(`__STRING_${index}__`, str)
    })
    
    return result
  } catch (error) {
    throw new Error(
      `SQL 压缩失败: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * 解析 SQL 为子句结构
 */
export const parseSqlClauses = (sqlString: string): ParsedSql => {
  const clauses: SqlClause[] = []
  
  try {
    // 首先格式化 SQL 以便更好地解析
    const formatted = formatSql(sqlString, { keywordCase: 'upper' })
    const lines = formatted.split('\n')
    
    let currentClause: SqlClause | null = null
    let currentContent: string[] = []
    let pendingComments: string[] = []
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      
      // 跳过空行（但保留在内容中以保持格式）
      if (!trimmedLine) {
        if (currentClause) {
          currentContent.push(line)
        }
        continue
      }
      
      // 检查是否是注释行
      const isComment = trimmedLine.startsWith('--') || trimmedLine.startsWith('/*')
      
      if (isComment) {
        // 如果还没有当前子句，缓存注释
        if (!currentClause) {
          pendingComments.push(line)
        } else {
          currentContent.push(line)
        }
        continue
      }
      
      // 检查是否是新的主要子句
      let isNewClause = false
      let clauseType: SqlClause['type'] = 'UNKNOWN'
      
      for (const majorClause of MAJOR_CLAUSES) {
        const regex = new RegExp(`^${majorClause}\\b`, 'i')
        if (regex.test(trimmedLine)) {
          isNewClause = true
          clauseType = majorClause.replace(/ /g, ' ') as SqlClause['type']
          break
        }
      }
      
      if (isNewClause) {
        // 保存之前的子句
        if (currentClause && currentContent.length > 0) {
          currentClause.content = currentContent.join('\n')
          currentClause.raw = currentContent.join('\n')
          clauses.push(currentClause)
        }
        
        // 开始新的子句
        currentContent = [...pendingComments, line]
        pendingComments = []
        currentClause = {
          type: clauseType,
          content: '',
          raw: '',
          collapsible: true,
          path: `clause-${clauses.length}`,
        }
      } else if (currentClause) {
        // 继续当前子句
        currentContent.push(line)
      } else {
        // 没有当前子句，创建一个未知类型的子句（用于注释等）
        currentContent = [...pendingComments, line]
        pendingComments = []
        currentClause = {
          type: 'UNKNOWN',
          content: '',
          raw: '',
          collapsible: false,
          path: `clause-${clauses.length}`,
        }
      }
    }
    
    // 保存最后一个子句
    if (currentClause && currentContent.length > 0) {
      currentClause.content = currentContent.join('\n')
      currentClause.raw = currentContent.join('\n')
      clauses.push(currentClause)
    }
    
    // 如果还有待处理的注释，添加为独立子句
    if (pendingComments.length > 0) {
      clauses.push({
        type: 'UNKNOWN',
        content: pendingComments.join('\n'),
        raw: pendingComments.join('\n'),
        collapsible: false,
        path: `clause-${clauses.length}`,
      })
    }
    
    return {
      clauses,
      raw: sqlString,
    }
  } catch (error) {
    // 解析失败时返回整个 SQL 作为单个未知子句
    return {
      clauses: [
        {
          type: 'UNKNOWN',
          content: sqlString,
          raw: sqlString,
          collapsible: false,
          path: 'clause-0',
        },
      ],
      raw: sqlString,
    }
  }
}

/**
 * 高亮 SQL 语法（返回带有标记的 token 数组）
 */
export interface SqlToken {
  type: 'keyword' | 'function' | 'string' | 'number' | 'comment' | 'operator' | 'identifier' | 'punctuation' | 'whitespace'
  value: string
}

export const tokenizeSql = (sqlString: string): SqlToken[] => {
  const tokens: SqlToken[] = []
  let remaining = sqlString
  
  // SQL 函数列表
  const SQL_FUNCTIONS = [
    'COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'UPPER', 'LOWER', 'SUBSTRING',
    'CONCAT', 'LENGTH', 'TRIM', 'NOW', 'DATE', 'YEAR', 'MONTH', 'DAY',
    'COALESCE', 'CAST', 'CONVERT', 'ROUND', 'ABS', 'FLOOR', 'CEIL'
  ]
  
  // 操作符列表
  const OPERATORS = ['=', '!=', '<>', '<', '>', '<=', '>=', '+', '-', '*', '/', '%', '||']
  
  // 标点符号
  const PUNCTUATION = ['(', ')', ',', ';', '.']
  
  while (remaining.length > 0) {
    let matched = false
    
    // 匹配空白字符
    const whitespaceMatch = remaining.match(/^(\s+)/)
    if (whitespaceMatch) {
      tokens.push({ type: 'whitespace', value: whitespaceMatch[1] })
      remaining = remaining.slice(whitespaceMatch[1].length)
      continue
    }
    
    // 匹配单行注释 --
    const singleCommentMatch = remaining.match(/^(--[^\n]*)/)
    if (singleCommentMatch) {
      tokens.push({ type: 'comment', value: singleCommentMatch[1] })
      remaining = remaining.slice(singleCommentMatch[1].length)
      continue
    }
    
    // 匹配多行注释 /* */
    const multiCommentMatch = remaining.match(/^(\/\*[\s\S]*?\*\/)/)
    if (multiCommentMatch) {
      tokens.push({ type: 'comment', value: multiCommentMatch[1] })
      remaining = remaining.slice(multiCommentMatch[1].length)
      continue
    }
    
    // 匹配字符串 '...' 或 "..."
    const stringMatch = remaining.match(/^(["'])(?:(?=(\\?))\2.)*?\1/)
    if (stringMatch) {
      tokens.push({ type: 'string', value: stringMatch[0] })
      remaining = remaining.slice(stringMatch[0].length)
      continue
    }
    
    // 匹配数字
    const numberMatch = remaining.match(/^(\d+\.?\d*|\.\d+)/)
    if (numberMatch) {
      tokens.push({ type: 'number', value: numberMatch[1] })
      remaining = remaining.slice(numberMatch[1].length)
      continue
    }
    
    // 匹配操作符
    for (const op of OPERATORS) {
      if (remaining.startsWith(op)) {
        tokens.push({ type: 'operator', value: op })
        remaining = remaining.slice(op.length)
        matched = true
        break
      }
    }
    if (matched) continue
    
    // 匹配标点符号
    for (const punct of PUNCTUATION) {
      if (remaining.startsWith(punct)) {
        tokens.push({ type: 'punctuation', value: punct })
        remaining = remaining.slice(punct.length)
        matched = true
        break
      }
    }
    if (matched) continue
    
    // 匹配标识符（关键字、函数名、表名、列名等）
    const identifierMatch = remaining.match(/^([a-zA-Z_][a-zA-Z0-9_]*)/)
    if (identifierMatch) {
      const word = identifierMatch[1]
      const upperWord = word.toUpperCase()
      
      if (SQL_KEYWORDS.includes(upperWord)) {
        tokens.push({ type: 'keyword', value: word })
      } else if (SQL_FUNCTIONS.includes(upperWord)) {
        tokens.push({ type: 'function', value: word })
      } else {
        tokens.push({ type: 'identifier', value: word })
      }
      
      remaining = remaining.slice(word.length)
      continue
    }
    
    // 无法匹配，跳过当前字符
    tokens.push({ type: 'punctuation', value: remaining[0] })
    remaining = remaining.slice(1)
  }
  
  return tokens
}
