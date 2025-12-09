/**
 * SQL 解析和格式化工具
 * 轻量级实现，不依赖外部格式化库
 */

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
  'WITH', 'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT',
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
    const tabWidth = options?.tabWidth || 2
    const keywordCase = options?.keywordCase || 'upper'
    const indent = ' '.repeat(tabWidth)
    
    // 移除多余的空白字符
    let sql = sqlString.trim()
    
    // 保护字符串字面量和注释
    const protectedItems: { type: string; value: string }[] = []
    
    // 保护字符串
    sql = sql.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, (match) => {
      protectedItems.push({ type: 'string', value: match })
      return `__PROTECTED_${protectedItems.length - 1}__`
    })
    
    // 保护单行注释
    sql = sql.replace(/--[^\n]*/g, (match) => {
      protectedItems.push({ type: 'comment', value: match })
      return `__PROTECTED_${protectedItems.length - 1}__`
    })
    
    // 保护多行注释
    sql = sql.replace(/\/\*[\s\S]*?\*\//g, (match) => {
      protectedItems.push({ type: 'comment', value: match })
      return `__PROTECTED_${protectedItems.length - 1}__`
    })
    
    // 规范化空格：在逗号、操作符等周围添加适当的空格
    sql = sql
      // 逗号后添加空格（如果后面不是空格）
      .replace(/,(?!\s)/g, ', ')
      // AS 关键字前后添加空格
      .replace(/\s*\bAS\b\s*/gi, ' AS ')
      // OVER 关键字前后添加空格
      .replace(/\s*\bOVER\b\s*/gi, ' OVER ')
      // DESC/ASC 关键字前后添加空格
      .replace(/\s*\b(DESC|ASC)\b\s*/gi, ' $1 ')
      // 操作符周围添加空格
      .replace(/\s*([<>=!]+)\s*/g, ' $1 ')
      // ON 关键字前后添加空格
      .replace(/\s*\bON\b\s*/gi, ' ON ')
      // 括号前后的空格处理：)和字母/关键字之间加空格
      .replace(/\)([A-Z])/gi, ') $1')
      // 清理多余的空格（但保留换行符）
      .replace(/[ \t]+/g, ' ')
      // 清理行尾空格
      .replace(/ +$/gm, '')
      // 清理行首空格（保留缩进会在后面处理）
      .replace(/^ +/gm, '')
    
    // 统一关键字大小写
    if (keywordCase === 'upper') {
      SQL_KEYWORDS.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
        sql = sql.replace(regex, keyword.toUpperCase())
      })
    } else if (keywordCase === 'lower') {
      SQL_KEYWORDS.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
        sql = sql.replace(regex, keyword.toLowerCase())
      })
    }
    
    // 在主要子句前添加换行
    const clauseKeywords = [
      'WITH', 'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT', 'OFFSET',
      'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'CROSS JOIN', 'OUTER JOIN', 'JOIN',
      'UNION', 'UNION ALL', 'INTERSECT', 'EXCEPT',
      'INSERT INTO', 'UPDATE', 'DELETE FROM',
      'CREATE', 'ALTER', 'DROP'
    ]
    
    // 按长度降序排序，确保先匹配长的短语（重要：LEFT JOIN 要在 JOIN 之前处理）
    clauseKeywords.sort((a, b) => b.length - a.length)
    
    // 保护复合关键字，防止被拆分
    const keywordPlaceholders: { placeholder: string; original: string }[] = []
    clauseKeywords.forEach((clause, index) => {
      if (clause.includes(' ')) {
        const casedClause = keywordCase === 'upper' ? clause : clause.toLowerCase()
        const regex = new RegExp(`\\b${clause}\\b`, 'gi')
        const placeholder = `__KEYWORD_${index}__`
        sql = sql.replace(regex, placeholder)
        keywordPlaceholders.push({ placeholder, original: casedClause })
      }
    })
    
    // 然后处理单个关键字
    clauseKeywords.forEach(clause => {
      if (!clause.includes(' ')) {
        const casedClause = keywordCase === 'upper' ? clause : clause.toLowerCase()
        const regex = new RegExp(`\\b${clause}\\b`, 'gi')
        sql = sql.replace(regex, `\n${casedClause}`)
      }
    })
    
    // 恢复复合关键字并添加换行
    keywordPlaceholders.forEach(({ placeholder, original }) => {
      sql = sql.replace(new RegExp(placeholder, 'g'), `\n${original}`)
    })
    
    // 处理 JOIN...ON：将 ON 子句内容换行
    sql = sql.replace(
      /\b((?:INNER\s+|LEFT\s+|RIGHT\s+|FULL\s+|CROSS\s+|OUTER\s+)?JOIN\s+[^\n]+?)\s+ON\s+(.+?)(?=\n|$)/gi,
      (match, joinPart, onCondition) => {
        const onKeyword = keywordCase === 'upper' ? 'ON' : 'on'
        return `${joinPart}\n${indent}${onKeyword} ${onCondition.trim()}`
      }
    )
    
    // 处理 WHERE 子句：将条件内容换行（只处理第一个条件，不包含 AND/OR）
    sql = sql.replace(
      /\b(WHERE)\s+([^\n]+?)(?=\s+AND\b|\s+OR\b|\n|$)/gis,
      (match, whereKeyword, condition) => {
        const keyword = keywordCase === 'upper' ? 'WHERE' : 'where'
        const trimmedCondition = condition.trim()
        return `${keyword}\n${indent}${trimmedCondition}`
      }
    )
    
    // 处理 HAVING 子句：将条件内容换行
    sql = sql.replace(
      /\b(HAVING)\s+(?!\n)(.+?)(?=\n|$)/gis,
      (match, havingKeyword, condition) => {
        const keyword = keywordCase === 'upper' ? 'HAVING' : 'having'
        return `${keyword}\n${indent}${condition.trim()}`
      }
    )
    
    // 处理 ORDER BY 子句：将排序字段换行（如果不包含逗号分隔的多字段）
    sql = sql.replace(
      /\b(ORDER BY)\s+(?!\n)([^,\n]+?)(?=\n|$|;)/gis,
      (match, orderByKeyword, fields) => {
        const keyword = keywordCase === 'upper' ? 'ORDER BY' : 'order by'
        // 检查是否有逗号（多字段会在后面处理）
        if (!fields.includes(',')) {
          return `${keyword}\n${indent}${fields.trim()}`
        }
        return match
      }
    )
    
    // 处理 INSERT INTO...VALUES 语句
    sql = sql.replace(
      /\b(INSERT\s+INTO)\s+(\w+)\s*\(([^)]+)\)\s*(VALUES)/gis,
      (match, insertPart, tableName, columns, valuesPart) => {
        const insertKeyword = keywordCase === 'upper' ? 'INSERT INTO' : 'insert into'
        const valuesKeyword = keywordCase === 'upper' ? 'VALUES' : 'values'
        
        // 分割列名
        const columnList = columns.split(',').map((col: string) => col.trim())
        
        let result = `${insertKeyword} ${tableName}\n  (`
        result += columnList.join(',\n   ')
        result += `)\n${valuesKeyword}`
        
        return result
      }
    )
    
    // 处理 VALUES 后的值列表（可能有多行）
    sql = sql.replace(
      /\b(VALUES)\s*\n?\s*\(([^)]+)\)/gis,
      (match, valuesPart, firstValue) => {
        const valuesKeyword = keywordCase === 'upper' ? 'VALUES' : 'values'
        // 分割第一组值
        const valueList = firstValue.split(/,\s*(?=(?:[^']*'[^']*')*[^']*$)/).map((val: string) => val.trim())
        
        let result = `${valuesKeyword}\n  (`
        result += valueList.join(',\n   ')
        result += ')'
        
        return result
      }
    )
    
    // 处理 UPDATE...SET 语句
    sql = sql.replace(
      /\b(UPDATE\s+)(\w+)\s+(SET)\s+([^\n]+?)(?=\n(?:WHERE)|$|;)/gis,
      (match, updatePart, tableName, setPart, setContent) => {
        const updateKeyword = keywordCase === 'upper' ? 'UPDATE' : 'update'
        const setKeyword = keywordCase === 'upper' ? 'SET' : 'set'
        
        // 分割 SET 子句的赋值
        const assignments = setContent.split(/,\s*(?![^()]*\))/).map((s: string) => s.trim())
        
        let result = `${updateKeyword} ${tableName}\n${setKeyword}`
        assignments.forEach((assignment: string, idx: number) => {
          result += `\n${indent}${assignment}`
          if (idx < assignments.length - 1) {
            result += ','
          }
        })
        
        return result
      }
    )
    
    // 在 AND/OR 前添加换行和缩进
    const logicalOps = ['AND', 'OR']
    logicalOps.forEach(op => {
      const casedOp = keywordCase === 'upper' ? op : op.toLowerCase()
      const regex = new RegExp(`\\b${op}\\b`, 'gi')
      sql = sql.replace(regex, `\n${indent}${casedOp}`)
    })
    
    // 处理 SELECT 字段：在逗号后换行（但要排除括号内的逗号）
    const clauseLines = sql.split('\n')
    const processedLines: string[] = []
    
    // 通用函数：分割字段（排除括号内的逗号）
    const splitFields = (fieldsPart: string): string[] => {
      const fields: string[] = []
      let currentField = ''
      let parenDepth = 0
      
      for (let j = 0; j < fieldsPart.length; j++) {
        const char = fieldsPart[j]
        
        if (char === '(') {
          parenDepth++
          currentField += char
        } else if (char === ')') {
          parenDepth--
          currentField += char
        } else if (char === ',' && parenDepth === 0) {
          // 在括号外的逗号处分割
          fields.push(currentField.trim())
          currentField = ''
        } else {
          currentField += char
        }
      }
      
      // 添加最后一个字段
      if (currentField.trim()) {
        fields.push(currentField.trim())
      }
      
      return fields
    }
    
    // 格式化 CASE WHEN 语句
    const formatCaseWhen = (field: string): string[] => {
      // 检查是否包含 CASE WHEN
      if (!/\bCASE\b/i.test(field)) {
        return [field]
      }
      
      const lines: string[] = []
      
      // 保护字符串字面量
      const stringLiterals: string[] = []
      let protectedField = field.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, (match) => {
        const index = stringLiterals.length
        stringLiterals.push(match)
        return `__STRING_${index}__`
      })
      
      // 使用正则匹配并格式化 CASE WHEN 结构
      // 匹配 CASE...END 块
      const caseRegex = /\b(CASE)\b([\s\S]*?)\b(END)\b/gi
      
      let lastIndex = 0
      let match
      
      while ((match = caseRegex.exec(protectedField)) !== null) {
        // CASE 之前的内容
        if (match.index > lastIndex) {
          const before = protectedField.substring(lastIndex, match.index).trim()
          if (before) {
            lines.push(before)
          }
        }
        
        // 处理 CASE 块
        lines.push('CASE')
        
        const caseBody = match[2]
        
        // 分割 WHEN、ELSE 子句
        const parts = caseBody.split(/\b(WHEN|ELSE)\b/gi)
        
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i].trim()
          
          if (!part) continue
          
          if (/^WHEN$/i.test(part)) {
            // WHEN 关键字
            const condition = parts[++i]?.trim() || ''
            // 提取条件和 THEN 之后的值
            const thenMatch = condition.match(/^(.*?)\s+THEN\s+(.*)$/i)
            if (thenMatch) {
              lines.push(indent + 'WHEN ' + thenMatch[1].trim() + ' THEN ' + thenMatch[2].trim())
            } else {
              lines.push(indent + 'WHEN ' + condition)
            }
          } else if (/^ELSE$/i.test(part)) {
            // ELSE 关键字
            const value = parts[++i]?.trim() || ''
            lines.push(indent + 'ELSE ' + value)
          }
        }
        
        lines.push('END')
        
        lastIndex = caseRegex.lastIndex
      }
      
      // CASE 之后的内容
      if (lastIndex < protectedField.length) {
        const after = protectedField.substring(lastIndex).trim()
        if (after) {
          lines[lines.length - 1] += ' ' + after
        }
      }
      
      // 恢复字符串字面量
      const restoredLines = lines.map(line => {
        return line.replace(/__STRING_(\d+)__/g, (_, index) => stringLiterals[parseInt(index)])
      })
      
      return restoredLines
    }
    
    for (let i = 0; i < clauseLines.length; i++) {
      const line = clauseLines[i].trim()
      
      // 检查是否是 SELECT 行
      if (/^SELECT\b/i.test(line)) {
        const match = line.match(/^(SELECT\s+(?:DISTINCT\s+)?)(.*)/i)
        if (match) {
          const selectPart = match[1].trim()
          const fieldsPart = match[2]
          const fields = splitFields(fieldsPart)
          
          // 总是换行和缩进字段，不管字段数量
          processedLines.push(selectPart)
          fields.forEach((field, idx) => {
            const isLast = idx === fields.length - 1
            
            // 检查字段是否包含 CASE WHEN
            if (/\bCASE\b/i.test(field)) {
              const caseLines = formatCaseWhen(field)
              caseLines.forEach((caseLine, caseIdx) => {
                if (caseIdx === 0) {
                  // 第一行：添加缩进
                  processedLines.push(indent + caseLine)
                } else if (caseIdx === caseLines.length - 1) {
                  // 最后一行：END，添加逗号（如果不是最后一个字段）
                  processedLines.push(indent + caseLine + (isLast ? '' : ','))
                } else {
                  // 中间行：保持原有缩进
                  processedLines.push(caseLine)
                }
              })
            } else {
              // 普通字段
              if (isLast) {
                processedLines.push(indent + field)
              } else {
                processedLines.push(indent + field + ',')
              }
            }
          })
        } else {
          processedLines.push(line)
        }
      }
      // 检查是否是 GROUP BY 行
      else if (/^GROUP BY\b/i.test(line)) {
        const match = line.match(/^(GROUP BY\s+)(.*)/i)
        if (match) {
          const groupByPart = match[1].trim()
          const fieldsPart = match[2]
          const fields = splitFields(fieldsPart)
          
          if (fields.length > 1) {
            processedLines.push(groupByPart)
            fields.forEach((field, idx) => {
              if (idx === fields.length - 1) {
                processedLines.push(indent + field)
              } else {
                processedLines.push(indent + field + ',')
              }
            })
          } else {
            processedLines.push(line)
          }
        } else {
          processedLines.push(line)
        }
      }
      // 检查是否是 ORDER BY 行
      else if (/^ORDER BY\b/i.test(line)) {
        const match = line.match(/^(ORDER BY\s+)(.*)/i)
        if (match) {
          const orderByPart = match[1].trim()
          const fieldsPart = match[2]
          const fields = splitFields(fieldsPart)
          
          if (fields.length > 1) {
            processedLines.push(orderByPart)
            fields.forEach((field, idx) => {
              if (idx === fields.length - 1) {
                processedLines.push(indent + field)
              } else {
                processedLines.push(indent + field + ',')
              }
            })
          } else {
            processedLines.push(line)
          }
        } else {
          processedLines.push(line)
        }
      }
      else {
        processedLines.push(line)
      }
    }
    
    sql = processedLines.join('\n')
    
    // 清理多余的空白（保留有意义的缩进）
    sql = sql
      .split('\n')
      .filter(line => line.trim().length > 0)  // 只过滤完全空白的行
      .join('\n')
    
    // 恢复保护的内容
    protectedItems.forEach((item, index) => {
      sql = sql.replace(`__PROTECTED_${index}__`, item.value)
    })
    
    // 添加基本缩进（优化版）
    const finalLines = sql.split('\n')
    const formatted: string[] = []
    
    for (let i = 0; i < finalLines.length; i++) {
      const line = finalLines[i]
      const trimmed = line.trim()
      
      // 检查行是否已经有缩进（来自 SELECT、GROUP BY、ORDER BY 等的字段处理）
      const hasIndent = line.startsWith(' ') || line.startsWith('\t')
      
      // 如果已经有缩进，保持原样
      if (hasIndent) {
        formatted.push(line)
        continue
      }
      
      // 检查是否是主子句
      const isMainClause = clauseKeywords.some(clause => {
        const regex = new RegExp(`^${clause}\\b`, 'i')
        return regex.test(trimmed)
      })
      
      if (isMainClause) {
        // 主子句不缩进
        formatted.push(trimmed)
        continue
      }
      
      // 检查上一个主子句是什么（用于决定是否需要缩进）
      let lastMainClause = ''
      for (let j = i - 1; j >= 0; j--) {
        const prevLine = finalLines[j].trim()
        const foundClause = clauseKeywords.find(clause => {
          const regex = new RegExp(`^${clause}\\b`, 'i')
          return regex.test(prevLine)
        })
        if (foundClause) {
          lastMainClause = foundClause
          break
        }
      }
      
      // 需要缩进的情况：
      // 1. AND/OR 逻辑运算符（已经在前面处理过，这里保持）
      // 2. WHERE 子句的条件内容（第一行）
      // 3. HAVING 子句的条件内容（第一行）
      // 4. JOIN...ON 子句的 ON 条件内容
      // 5. ORDER BY 的字段列表（不包括已经处理过的多字段情况）
      
      if (/^(AND|OR)\b/i.test(trimmed)) {
        // AND/OR 已经有缩进标记，保持
        formatted.push(trimmed)
      } else if (
        lastMainClause.match(/^(WHERE|HAVING)$/i) ||
        lastMainClause.match(/JOIN$/i) ||
        lastMainClause.match(/^ORDER BY$/i)
      ) {
        // WHERE、HAVING、JOIN ON、ORDER BY 子句的内容需要缩进
        formatted.push(indent + trimmed)
      } else {
        // 其他情况保持原样
        formatted.push(trimmed)
      }
    }
    
    return formatted.join('\n')
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
