/**
 * SQL 解析和格式化工具
 * 基于 sql-formatter 的稳定实现
 */

import { format } from 'sql-formatter'
import type { SqlClause, SqlBodySegment, ParsedSql, SqlFormatOptions } from './types'

/**
 * SQL 关键字列表（用于基础验证）
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
 * 主要子句关键字（用于解析 SQL 结构）
 */
const MAJOR_CLAUSES = [
  'WITH', 'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT',
  'INSERT INTO', 'UPDATE', 'SET', 'DELETE FROM', 'CREATE', 'ALTER', 'DROP',
  'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'CROSS JOIN', 'OUTER JOIN', 'JOIN',
  'UNION ALL', 'UNION', 'INTERSECT', 'EXCEPT'
]

/**
 * 验证 SQL 字符串
 * 使用 sql-formatter 进行验证，同时保留基础检查
 */
export const validateSql = (sqlString: string): { valid: boolean; error?: string } => {
  try {
    if (!sqlString || !sqlString.trim()) {
      return { valid: false, error: 'SQL string is empty' }
    }

    const upperSql = sqlString.toUpperCase().trim()

    // 1. 基础验证：检查是否包含至少一个 SQL 关键字
    const hasKeyword = SQL_KEYWORDS.some(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`)
      return regex.test(upperSql)
    })

    if (!hasKeyword) {
      return { valid: false, error: 'No valid SQL keywords found' }
    }

    // 2. 基础括号匹配验证
    let parenCount = 0
    let inString = false
    let stringChar = ''
    
    for (let i = 0; i < sqlString.length; i++) {
      const char = sqlString[i]
      const prevChar = i > 0 ? sqlString[i - 1] : ''
      
      // 处理字符串内的情况
      if ((char === "'" || char === '"') && prevChar !== '\\') {
        if (!inString) {
          inString = true
          stringChar = char
        } else if (char === stringChar) {
          inString = false
          stringChar = ''
        }
      }
      
      // 只在字符串外统计括号
      if (!inString) {
        if (char === '(') parenCount++
        if (char === ')') parenCount--
        if (parenCount < 0) {
          return { valid: false, error: 'Mismatched parentheses: unexpected closing parenthesis' }
        }
      }
    }
    
    if (parenCount !== 0) {
      return { valid: false, error: `Mismatched parentheses: ${parenCount} unclosed opening parenthesis` }
    }

    // 3. 使用 sql-formatter 进行验证
    try {
      // 尝试格式化 SQL，如果失败则说明语法有问题
      format(sqlString, { language: 'sql' })
      return { valid: true }
    } catch (formatError) {
      // sql-formatter 解析失败，返回错误信息
      return {
        valid: false,
        error: formatError instanceof Error ? formatError.message : 'SQL syntax error',
      }
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown validation error',
    }
  }
}

/**
 * 格式化 INSERT VALUES 子句，使每个值在单独的行上
 */
const formatInsertValues = (sql: string, tabWidth: number): string => {
  // 查找 VALUES 关键字的位置
  const valuesMatch = sql.match(/\bVALUES\s*/i)
  if (!valuesMatch || valuesMatch.index === undefined) return sql
  
  const beforeValues = sql.slice(0, valuesMatch.index! + valuesMatch[0].length)
  const afterValuesKeyword = sql.slice(valuesMatch.index! + valuesMatch[0].length)
  
  // 解析每个值元组 - 使用深度计数来正确处理嵌套括号
  const tuples: string[] = []
  let depth = 0
  let currentTuple = ''
  let inString = false
  let stringChar = ''
  let i = 0
  
  while (i < afterValuesKeyword.length) {
    const char = afterValuesKeyword[i]
    const prevChar = i > 0 ? afterValuesKeyword[i - 1] : ''
    
    // 处理字符串
    if ((char === "'" || char === '"') && prevChar !== '\\') {
      if (!inString) {
        inString = true
        stringChar = char
      } else if (char === stringChar) {
        inString = false
      }
    }
    
    if (!inString) {
      if (char === '(') {
        if (depth === 0) {
          currentTuple = char
        } else {
          currentTuple += char
        }
        depth++
      } else if (char === ')') {
        currentTuple += char
        depth--
        if (depth === 0 && currentTuple.trim()) {
          tuples.push(currentTuple.trim())
          currentTuple = ''
        }
      } else if (char === ';' && depth === 0) {
        // 遇到分号，结束解析
        break
      } else if (depth > 0) {
        currentTuple += char
      }
    } else {
      if (depth > 0) {
        currentTuple += char
      }
    }
    
    i++
  }
  
  if (tuples.length === 0) {
    return sql // 没有找到元组，返回原SQL
  }
  
  // 格式化每个元组：在括号内的逗号后换行
  const indent = ' '.repeat(tabWidth)
  const formattedTuples = tuples.map(tuple => {
    // 提取括号内的内容
    const innerContent = tuple.slice(1, -1) // 去掉开始和结束的括号
    
    // 分割逗号分隔的值（需要考虑字符串和嵌套函数）
    const values: string[] = []
    let currentValue = ''
    let parenDepth = 0
    let inStr = false
    let strChar = ''
    
    for (let j = 0; j < innerContent.length; j++) {
      const c = innerContent[j]
      const prev = j > 0 ? innerContent[j - 1] : ''
      
      if ((c === "'" || c === '"') && prev !== '\\') {
        if (!inStr) {
          inStr = true
          strChar = c
        } else if (c === strChar) {
          inStr = false
        }
      }
      
      if (!inStr) {
        if (c === '(') parenDepth++
        if (c === ')') parenDepth--
        
        if (c === ',' && parenDepth === 0) {
          values.push(currentValue.trim())
          currentValue = ''
          continue
        }
      }
      
      currentValue += c
    }
    
    if (currentValue.trim()) {
      values.push(currentValue.trim())
    }
    
    // 格式化为多行
    const formattedValues = values.map((v, idx) => {
      const comma = idx < values.length - 1 ? ',' : ''
      return `${indent}${indent}${v}${comma}`
    }).join('\n')
    
    return `${indent}(\n${formattedValues}\n${indent})`
  })
  
  // 组合结果
  const formattedValuesSection = formattedTuples.map((t, idx) => {
    const comma = idx < formattedTuples.length - 1 ? ',' : ';'
    return t + comma
  }).join('\n')
  
  // 找到剩余的部分（分号后的内容）
  // 注意：如果在 i 位置是分号，我们已经在 formattedValuesSection 中添加了，所以要跳过它
  let remainingStartIndex = i
  if (remainingStartIndex < afterValuesKeyword.length && afterValuesKeyword[remainingStartIndex] === ';') {
    remainingStartIndex++ // 跳过分号
  }
  const remainingContent = afterValuesKeyword.slice(remainingStartIndex)
  
  return beforeValues.trimEnd() + '\n' + formattedValuesSection + remainingContent
}

/**
 * 格式化 SQL 字符串
 * 使用 sql-formatter 进行格式化
 */
export const formatSql = (
  sqlString: string,
  options?: SqlFormatOptions
): string => {
  try {
    const dialect = options?.dialect || 'sql'
    const tabWidth = options?.tabWidth || 2
    const keywordCase = options?.keywordCase || 'upper'
    const useTabs = options?.useTabs || false
    const linesBetweenQueries = options?.linesBetweenQueries || 1

    // 将我们的方言映射到 sql-formatter 支持的语言
    const languageMap: Record<string, string> = {
      'sql': 'sql',
      'mysql': 'mysql',
      'postgresql': 'postgresql',
      'sqlite': 'sqlite',
      'plsql': 'plsql',
      'tsql': 'tsql'
    }

    const language = languageMap[dialect] || 'sql'

    // 使用 sql-formatter 进行格式化
    let formatted = format(sqlString, {
      language: language as any,
      tabWidth,
      keywordCase,
      useTabs,
      linesBetweenQueries,
      // 其他默认配置
      indentStyle: 'standard',
    })

    // 对 INSERT VALUES 语句进行特殊格式化
    if (/\bINSERT\s+INTO\b/i.test(formatted) && /\bVALUES\b/i.test(formatted)) {
      formatted = formatInsertValues(formatted, tabWidth)
    }

    return formatted
  } catch (error) {
    // 如果格式化失败，返回原始字符串
    console.error('SQL formatting error:', error)
    return sqlString
  }
}

/**
 * 压缩 SQL（移除多余空格和换行）
 */
export const compressSql = (sqlString: string): string => {
  try {
    // 保护字符串字面量
    const protectedStrings: string[] = []
    let sql = sqlString.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, (match) => {
      protectedStrings.push(match)
      return `__STR_${protectedStrings.length - 1}__`
    })

    // 移除注释
    sql = sql
      .replace(/--[^\n]*/g, '') // 单行注释
      .replace(/\/\*[\s\S]*?\*\//g, '') // 多行注释

    // 压缩空白字符
    sql = sql
      .replace(/\s+/g, ' ') // 将所有空白字符替换为单个空格
      .trim()

    // 恢复字符串字面量
    protectedStrings.forEach((str, index) => {
      sql = sql.replace(`__STR_${index}__`, str)
    })

    return sql
  } catch (error) {
    console.error('SQL compression error:', error)
    return sqlString
  }
}

/**
 * 解析 INSERT VALUES 子句，将每个值元组作为独立的可折叠项
 */
const parseInsertValues = (content: string, baseIndex: number): SqlClause[] => {
  const clauses: SqlClause[] = []
  
  // 匹配 VALUES 关键字
  const valuesMatch = content.match(/^(.*?\bVALUES\b)/is)
  if (!valuesMatch) return []
  
  const valuesKeyword = valuesMatch[1].trim()
  
  // 添加 VALUES 关键字作为一个不可折叠子句
  clauses.push({
    type: 'VALUES' as SqlClause['type'],
    content: valuesKeyword,
    raw: valuesKeyword,
    collapsible: false,
    path: `clause-${baseIndex}`,
  })
  
  // 获取 VALUES 后的内容
  const afterValues = content.slice(valuesMatch[1].length).trim()
  
  // 解析每个值元组 (...)
  let remaining = afterValues
  let valueIndex = 0
  let depth = 0
  let currentValue = ''
  let inString = false
  let stringChar = ''
  
  for (let i = 0; i < remaining.length; i++) {
    const char = remaining[i]
    const prevChar = i > 0 ? remaining[i - 1] : ''
    
    // 处理字符串
    if ((char === "'" || char === '"') && prevChar !== '\\') {
      if (!inString) {
        inString = true
        stringChar = char
      } else if (char === stringChar) {
        inString = false
      }
    }
    
    if (!inString) {
      if (char === '(' && depth === 0) {
        // 开始一个新的元组
        depth++
        currentValue = char
      } else if (char === '(') {
        depth++
        currentValue += char
      } else if (char === ')') {
        currentValue += char
        depth--
        if (depth === 0) {
          // 完成一个值元组，继续查找后面的逗号或分号
          let j = i + 1
          let punctuation = ''
          while (j < remaining.length) {
            const nextChar = remaining[j]
            if (nextChar === ',' || nextChar === ';') {
              punctuation = nextChar
              break
            } else if (!/\s/.test(nextChar)) {
              // 遇到非空白非标点字符，停止
              break
            }
            j++
          }
          
          const trimmedValue = currentValue.trim()
          if (trimmedValue) {
            clauses.push({
              type: 'VALUE_TUPLE' as SqlClause['type'],
              content: trimmedValue + punctuation,
              raw: trimmedValue + punctuation,
              collapsible: true,
              path: `clause-${baseIndex}-value-${valueIndex}`,
            })
            valueIndex++
          }
          currentValue = ''
          
          // 跳过已处理的标点符号
          if (punctuation) {
            i = j
          }
        }
      } else if (depth > 0) {
        // 在元组内部，收集所有字符
        currentValue += char
      }
      // depth === 0 时，忽略逗号和空格等分隔符
    } else {
      // 在字符串内部
      if (depth > 0) {
        currentValue += char
      }
    }
  }
  
  return clauses
}

/**
 * 规范化 JOIN 子句展示：将 ON 条件拆分到新行。
 * 仅在 ON 与 JOIN 同行且当前子句中还没有独立 ON 行时生效。
 */
const normalizeJoinClauseContent = (clauseType: SqlClause['type'], clauseContent: string): string => {
  void clauseType

  // 已经存在独立 ON 行时，不重复处理
  if (/\n\s*ON\b/i.test(clauseContent)) {
    return clauseContent
  }

  // 仅拆分第一个 ON，避免误拆条件表达式中的其他单词。
  // ON 行复用 JOIN 行的前导缩进，确保两者对齐。
  return clauseContent.replace(
    /^(\s*)((?:INNER|LEFT|RIGHT|FULL|CROSS|OUTER)?\s*JOIN\b[^\n]*?)\s+ON\b\s*/gim,
    '$1$2\n$1ON '
  )
}

/**
 * 计算一行 SQL 的括号深度变化（忽略字符串中的括号）。
 */
const getParenDepthDelta = (line: string): number => {
  let delta = 0
  let inString = false
  let stringChar = ''

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const prevChar = i > 0 ? line[i - 1] : ''

    if ((char === "'" || char === '"') && prevChar !== '\\') {
      if (!inString) {
        inString = true
        stringChar = char
      } else if (char === stringChar) {
        inString = false
        stringChar = ''
      }
      continue
    }

    if (!inString) {
      if (char === '(') delta++
      if (char === ')') delta--
    }
  }

  return delta
}

/**
 * 查找文本中处于最外层（深度 0→1）的括号对，忽略字符串字面量内的括号。
 */
const findTopLevelParens = (text: string): Array<{ open: number; close: number }> => {
  const result: Array<{ open: number; close: number }> = []
  let depth = 0
  let openIndex = -1
  let inString = false
  let stringChar = ''

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const prev = i > 0 ? text[i - 1] : ''

    if ((char === "'" || char === '"') && prev !== '\\') {
      if (!inString) {
        inString = true
        stringChar = char
      } else if (char === stringChar) {
        inString = false
        stringChar = ''
      }
      continue
    }

    if (inString) continue

    if (char === '(') {
      if (depth === 0) openIndex = i
      depth++
    } else if (char === ')') {
      depth--
      if (depth === 0 && openIndex >= 0) {
        result.push({ open: openIndex, close: i })
        openIndex = -1
      }
    }
  }

  return result
}

/**
 * 判断括号内容是否是 SQL 子查询（区别于函数调用、IN 列表等）
 */
const isSqlSubquery = (innerText: string): boolean => {
  const trimmed = innerText.trim()
  if (!trimmed) return false
  if (/^(SELECT|WITH)\b/i.test(trimmed)) return true
  return /\n\s*(SELECT|FROM|WHERE|JOIN|UNION|INTERSECT|EXCEPT)\b/i.test(innerText)
}

/**
 * 解析子句正文：在其"首行之外"的内容中寻找子查询括号，将子查询内部递归解析为嵌套子句。
 * 仅当确实存在子查询时才设置 clause.body。
 */
const processClauseBody = (clause: SqlClause): void => {
  const lines = clause.content.split('\n')
  let firstNonEmptyIdx = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim()) {
      firstNonEmptyIdx = i
      break
    }
  }
  if (firstNonEmptyIdx < 0) return

  const restContent = lines.slice(firstNonEmptyIdx + 1).join('\n')
  if (!restContent) return

  const parens = findTopLevelParens(restContent)
  const subqueryParens = parens.filter(p =>
    isSqlSubquery(restContent.slice(p.open + 1, p.close))
  )
  if (subqueryParens.length === 0) return

  const body: SqlBodySegment[] = []
  let cursor = 0
  const basePath = clause.path || 'clause'

  subqueryParens.forEach((paren, idx) => {
    // 括号前的文本（包含 `(`）
    if (paren.open + 1 > cursor) {
      body.push({ kind: 'text', text: restContent.slice(cursor, paren.open + 1) })
    }

    // 递归解析括号内部内容
    const innerText = restContent.slice(paren.open + 1, paren.close)
    const innerClauses = splitIntoClauses(innerText, `${basePath}-sub${idx}-`)
    for (const innerClause of innerClauses) {
      body.push({ kind: 'clause', clause: innerClause })
    }

    cursor = paren.close
  })

  if (cursor < restContent.length) {
    body.push({ kind: 'text', text: restContent.slice(cursor) })
  }

  clause.body = body
}

/**
 * 将已格式化的 SQL 文本按主要子句切分（不再进行 formatSql 调用，便于递归复用）
 */
const splitIntoClauses = (formattedSql: string, pathPrefix: string): SqlClause[] => {
  const clauses: SqlClause[] = []
  const lines = formattedSql.split('\n')

  let currentClause: SqlClause | null = null
  let currentContent: string[] = []
  let pendingComments: string[] = []
  let parenDepth = 0

  const sortedClauses = [...MAJOR_CLAUSES].sort((a, b) => b.length - a.length)

  const finalizeCurrent = () => {
    if (!currentClause || currentContent.length === 0) return

    let clauseContent = currentContent.join('\n')
    clauseContent = normalizeJoinClauseContent(currentClause.type, clauseContent)
    currentClause.content = clauseContent
    currentClause.raw = clauseContent

    // INSERT INTO ... VALUES 的特殊处理
    if (currentClause.type === 'INSERT INTO' && /\bVALUES\b/i.test(clauseContent)) {
      const insertMatch = clauseContent.match(/^(.*?\bINSERT\s+INTO\s+[^(]+\s*\([^)]+\))/is)
      if (insertMatch) {
        const insertClause: SqlClause = {
          type: 'INSERT INTO',
          content: insertMatch[1].trim(),
          raw: insertMatch[1].trim(),
          collapsible: true,
          path: `${pathPrefix}clause-${clauses.length}`,
        }
        clauses.push(insertClause)

        const valuesContent = clauseContent.slice(insertMatch[1].length).trim()
        const baseIndex = clauses.length
        const valueClauses = parseInsertValues(valuesContent, baseIndex)
        for (let i = 0; i < valueClauses.length; i++) {
          valueClauses[i].path = `${pathPrefix}clause-${baseIndex + i}`
        }
        clauses.push(...valueClauses)
        return
      }
    }

    processClauseBody(currentClause)
    clauses.push(currentClause)
  }

  for (const line of lines) {
    const trimmedLine = line.trim()

    if (!trimmedLine) {
      if (currentClause) currentContent.push(line)
      continue
    }

    const isComment = trimmedLine.startsWith('--') || trimmedLine.startsWith('/*')
    if (isComment) {
      if (!currentClause) pendingComments.push(line)
      else currentContent.push(line)
      continue
    }

    let isNewClause = false
    let clauseType: SqlClause['type'] = 'UNKNOWN'

    if (parenDepth === 0) {
      for (const majorClause of sortedClauses) {
        const regex = new RegExp(`^${majorClause}\\b`, 'i')
        if (regex.test(trimmedLine)) {
          isNewClause = true
          clauseType = majorClause.toUpperCase() as SqlClause['type']
          break
        }
      }
    }

    if (isNewClause) {
      finalizeCurrent()

      if (pendingComments.length > 0) {
        clauses.push({
          type: 'UNKNOWN',
          content: pendingComments.join('\n'),
          raw: pendingComments.join('\n'),
          collapsible: false,
          path: `${pathPrefix}clause-${clauses.length}`,
        })
        pendingComments = []
      }

      currentContent = [line]
      currentClause = {
        type: clauseType,
        content: '',
        raw: '',
        collapsible: true,
        path: `${pathPrefix}clause-${clauses.length}`,
      }
    } else if (currentClause) {
      currentContent.push(line)
    } else {
      currentContent = [...pendingComments, line]
      pendingComments = []
      currentClause = {
        type: 'UNKNOWN',
        content: '',
        raw: '',
        collapsible: false,
        path: `${pathPrefix}clause-${clauses.length}`,
      }
    }

    parenDepth = Math.max(0, parenDepth + getParenDepthDelta(line))
  }

  finalizeCurrent()

  if (pendingComments.length > 0) {
    clauses.push({
      type: 'UNKNOWN',
      content: pendingComments.join('\n'),
      raw: pendingComments.join('\n'),
      collapsible: false,
      path: `${pathPrefix}clause-${clauses.length}`,
    })
  }

  return clauses
}

/**
 * 解析 SQL 为子句结构
 * 使用 sql-formatter 格式化后进行解析；子查询内部递归拆分为嵌套子句。
 */
export const parseSqlClauses = (sqlString: string): ParsedSql => {
  try {
    const formatted = formatSql(sqlString, { keywordCase: 'upper' })
    const clauses = splitIntoClauses(formatted, '')
    return { clauses, raw: sqlString }
  } catch (error) {
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
 * SQL 语法 Token 类型
 */
export interface SqlToken {
  type: 'keyword' | 'function' | 'string' | 'number' | 'comment' | 'operator' | 'identifier' | 'punctuation' | 'whitespace'
  value: string
}

/**
 * 高亮 SQL 语法（返回带有标记的 token 数组）
 */
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
