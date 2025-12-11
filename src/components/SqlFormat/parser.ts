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
    
    // 处理 CREATE TABLE 语句（在字符串保护之前）
    // 使用手动括号匹配，因为正则的非贪婪匹配无法处理嵌套括号
    const createTablePlaceholders: Array<{ placeholder: string; content: string }> = []
    
    // 查找所有 CREATE TABLE 语句
    const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\(/gi
    let ctMatch
    let processedSql = sql
    let ctOffset = 0
    
    while ((ctMatch = createTableRegex.exec(sql)) !== null) {
      const tableName = ctMatch[1]
      const ifNotExists = /IF\s+NOT\s+EXISTS/i.test(ctMatch[0])
      const startPos = ctMatch.index
      const leftParenPos = ctMatch.index + ctMatch[0].length
      
      // 手动匹配括号，找到对应的右括号
      let depth = 1
      let pos = leftParenPos
      while (pos < sql.length && depth > 0) {
        if (sql[pos] === '(') depth++
        else if (sql[pos] === ')') depth--
        pos++
      }
      
      if (depth !== 0) {
        continue
      }
      
      const rightParenPos = pos - 1
      const columnsDef = sql.substring(leftParenPos, rightParenPos)
      
      // 找到分号
      const remainingPart = sql.substring(rightParenPos + 1)
      const semicolonMatch = remainingPart.match(/^([^;]*);/)
      if (!semicolonMatch) {
        continue
      }
      
      const tableSuffix = semicolonMatch[1]
      const endPos = rightParenPos + 1 + semicolonMatch[0].length
      
      // 格式化 CREATE TABLE
      const createKeyword = keywordCase === 'upper' ? 'CREATE TABLE' : 'create table'
      const ifPart = ifNotExists ? (keywordCase === 'upper' ? ' IF NOT EXISTS' : ' if not exists') : ''
      
      // 分割列定义和约束（排除括号内的逗号）
      const definitions: string[] = []
      let current = ''
      let parenDepth = 0
      
      for (let i = 0; i < columnsDef.length; i++) {
        const char = columnsDef[i]
        
        if (char === '(') {
          parenDepth++
          current += char
        } else if (char === ')') {
          parenDepth--
          current += char
        } else if (char === ',' && parenDepth === 0) {
          if (current.trim()) {
            definitions.push(current.trim())
          }
          current = ''
        } else {
          current += char
        }
      }
      
      if (current.trim()) {
        definitions.push(current.trim())
      }
      
      // 构建格式化的 CREATE TABLE
      let formattedContent = `${createKeyword}${ifPart} ${tableName} (`
      definitions.forEach((def, idx) => {
        formattedContent += `\n${indent}${def}`
        if (idx < definitions.length - 1) {
          formattedContent += ','
        }
      })
      formattedContent += `\n) ${tableSuffix.trim()};`
      
      // 使用占位符替换
      const placeholder = `__CREATE_TABLE_${createTablePlaceholders.length}__`
      createTablePlaceholders.push({ placeholder, content: formattedContent })
      
      // 替换原SQL
      const originalStatement = sql.substring(startPos, endPos)
      processedSql = processedSql.replace(originalStatement, placeholder)
    }
    
    sql = processedSql
    
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
    
    // 特殊处理 WITH...AS 语句，使 CTE 名称缩进
    sql = sql.replace(
      /\b(WITH)\s+(\w+)\s+(AS)\s*\(/gi,
      (match, withKeyword, cteName, asKeyword) => {
        const w = keywordCase === 'upper' ? 'WITH' : 'with'
        const a = keywordCase === 'upper' ? 'AS' : 'as'
        return `${w}\n${indent}${cteName} ${a} (`
      }
    )
    
    // 后处理：为 CTE 内容添加额外缩进
    const addCteIndentation = (text: string): string => {
      const lines = text.split('\n')
      const result: string[] = []
      let inCte = false
      let cteDepth = 0
      let parenCount = 0
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const trimmed = line.trim()
        
        // 检测 CTE 开始
        if (/^\s*\w+\s+AS\s*\(/.test(line)) {
          inCte = true
          cteDepth = 1
          parenCount = 1
          result.push(indent + line.trim())  // CTE 名称行缩进 2 spaces
          continue
        }
        
        if (inCte) {
          // 追踪括号深度（需要忽略字符串中的括号）
          let inString = false
          let stringChar = ''
          for (const char of trimmed) {
            if ((char === '"' || char === "'") && !inString) {
              inString = true
              stringChar = char
            } else if (char === stringChar && inString) {
              inString = false
            } else if (!inString) {
              if (char === '(') parenCount++
              else if (char === ')') parenCount--
            }
          }
          
          // CTE 结束
          if (parenCount === 0) {
            inCte = false
            // 闭括号单独一行，缩进 2 spaces
            result.push(indent + ')')
          } else {
            // CTE 内部内容，添加额外缩进
            if (trimmed) {
              result.push(indent + line)
            } else {
              result.push('')
            }
          }
        } else {
          result.push(line)
        }
      }
      
      return result.join('\n')
    }
    
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
      if (!clause.includes(' ') && clause !== 'WITH') {  // WITH 已经特殊处理
        const casedClause = keywordCase === 'upper' ? clause : clause.toLowerCase()
        const regex = new RegExp(`\\b${clause}\\b`, 'gi')
        sql = sql.replace(regex, `\n${casedClause}`)
      }
    })
    
    // 恢复复合关键字并添加换行
    keywordPlaceholders.forEach(({ placeholder, original }) => {
      sql = sql.replace(new RegExp(placeholder, 'g'), `\n${original}`)
    })
    
    // 处理 OVER 窗口函数：使括号内的内容换行并缩进
    // 使用更智能的括号匹配
    const processOverClauses = (text: string): string => {
      let result = text
      const overRegex = /\b(\w+)\s+OVER\s*\(/gi
      let match
      
      while ((match = overRegex.exec(result)) !== null) {
        const functionName = match[1]
        const startPos = match.index + match[0].length
        
        // 找到匹配的右括号
        let parenCount = 1
        let endPos = startPos
        
        while (parenCount > 0 && endPos < result.length) {
          if (result[endPos] === '(') parenCount++
          else if (result[endPos] === ')') parenCount--
          endPos++
        }
        
        if (parenCount === 0) {
          const overContent = result.substring(startPos, endPos - 1).trim()
          const overKeyword = keywordCase === 'upper' ? 'OVER' : 'over'
          
          // 检查 OVER 内容是否包含 ORDER BY 或 PARTITION BY
          const hasOrderBy = /\bORDER\s+BY\b/i.test(overContent)
          const hasPartitionBy = /\bPARTITION\s+BY\b/i.test(overContent)
          
          if (hasOrderBy || hasPartitionBy) {
            let formatted = overContent
            
            // 在 ORDER BY 前换行，并在 ORDER BY 后的内容前也换行
            if (hasOrderBy) {
              const orderKeyword = keywordCase === 'upper' ? 'ORDER BY' : 'order by'
              formatted = formatted.replace(
                /\bORDER\s+BY\s+(.+)/gi,
                (_, orderContent) => {
                  return `\n${indent}${orderKeyword}\n${indent}${indent}${orderContent.trim()}`
                }
              )
            }
            
            // 在 PARTITION BY 前换行，并在 PARTITION BY 后的内容前也换行
            if (hasPartitionBy) {
              const partitionKeyword = keywordCase === 'upper' ? 'PARTITION BY' : 'partition by'
              formatted = formatted.replace(
                /\bPARTITION\s+BY\s+(.+)/gi,
                (_, partitionContent) => {
                  return `\n${indent}${partitionKeyword}\n${indent}${indent}${partitionContent.trim()}`
                }
              )
            }
            
            const replacement = `${functionName} ${overKeyword} (${formatted}\n${indent})`
            result = result.substring(0, match.index) + replacement + result.substring(endPos)
            
            // 重置正则表达式索引
            overRegex.lastIndex = match.index + replacement.length
          }
        }
      }
      
      return result
    }
    
    sql = processOverClauses(sql)
    
    // 处理 JOIN...ON：将 ON 子句内容与 JOIN 在同一行
    sql = sql.replace(
      /\b((?:INNER\s+|LEFT\s+|RIGHT\s+|FULL\s+|CROSS\s+|OUTER\s+)?JOIN\s+[^\n]+?)\s+ON\s+(.+?)(?=\n|$)/gi,
      (match, joinPart, onCondition) => {
        const onKeyword = keywordCase === 'upper' ? 'ON' : 'on'
        return `${joinPart} ${onKeyword} ${onCondition.trim()}`
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
      /\b(INSERT\s+INTO)\s+(\w+)\s*\(([^)]+)\)\s*(VALUES)\s*(.+?)(?=;|$)/gis,
      (match, insertPart, tableName, columns, valuesPart, valuesContent) => {
        const insertKeyword = keywordCase === 'upper' ? 'INSERT INTO' : 'insert into'
        const valuesKeyword = keywordCase === 'upper' ? 'VALUES' : 'values'
        
        // 格式化列名 - 保持在同一行
        const columnList = columns.split(',').map((col: string) => col.trim()).join(', ')
        
        // INSERT INTO 单独一行，表名和列在下一行缩进
        let result = `${insertKeyword}\n${indent}${tableName} (${columnList})\n${valuesKeyword}`
        
        // 处理多个值组
        // 匹配所有 (...) 值组
        const valueGroups: string[] = []
        let depth = 0
        let currentGroup = ''
        let inString = false
        let stringChar = ''
        
        for (let i = 0; i < valuesContent.length; i++) {
          const char = valuesContent[i]
          const prevChar = i > 0 ? valuesContent[i - 1] : ''
          
          // 处理字符串
          if ((char === '"' || char === "'") && prevChar !== '\\') {
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
                currentGroup = ''
              } else {
                currentGroup += char
              }
              depth++
            } else if (char === ')') {
              depth--
              if (depth === 0) {
                valueGroups.push(currentGroup.trim())
              } else {
                currentGroup += char
              }
            } else if (depth > 0) {
              currentGroup += char
            }
          } else {
            currentGroup += char
          }
        }
        
        // 格式化每个值组
        valueGroups.forEach((group, idx) => {
          // 分割值（处理字符串中的逗号）
          const values = group.split(/,\s*(?=(?:[^']*'[^']*')*[^']*$)/).map((val: string) => val.trim())
          
          result += '\n' + indent + '('
          values.forEach((val, valIdx) => {
            result += '\n' + indent + indent + val
            if (valIdx < values.length - 1) {
              result += ','
            }
          })
          result += '\n' + indent + ')'
          if (idx < valueGroups.length - 1) {
            result += ','
          }
        })
        
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
    
    // 在 AND/OR 前添加换行和缩进（去除前面的空格）
    const logicalOps = ['AND', 'OR']
    logicalOps.forEach(op => {
      const casedOp = keywordCase === 'upper' ? op : op.toLowerCase()
      // 匹配 AND/OR 前的可选空格并去除
      const regex = new RegExp(`\\s*\\b${op}\\b`, 'gi')
      sql = sql.replace(regex, `\n${indent}${casedOp}`)
    })
    
    // 处理 SELECT 字段：在逗号后换行（但要排除括号内的逗号）
    const clauseLines = sql.split('\n')
    const processedLines: string[] = []
    let subqueryDepth = 0  // 跟踪子查询嵌套深度
    
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
        
        // 处理 CASE 块 - CASE 单独一行
        lines.push('CASE')
        
        const caseBody = match[2]
        
        // 分割 WHEN、ELSE 子句
        const parts = caseBody.split(/\b(WHEN|ELSE)\b/gi)
        
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i].trim()
          
          if (!part) continue
          
          if (/^WHEN$/i.test(part)) {
            // WHEN 关键字 - 缩进 2 spaces
            const condition = parts[++i]?.trim() || ''
            // 提取条件和 THEN 之后的值
            const thenMatch = condition.match(/^(.*?)\s+THEN\s+(.*)$/i)
            if (thenMatch) {
              const whenKeyword = keywordCase === 'upper' ? 'WHEN' : 'when'
              const thenKeyword = keywordCase === 'upper' ? 'THEN' : 'then'
              lines.push(indent + whenKeyword + ' ' + thenMatch[1].trim() + ' ' + thenKeyword + ' ' + thenMatch[2].trim())
            } else {
              const whenKeyword = keywordCase === 'upper' ? 'WHEN' : 'when'
              lines.push(indent + whenKeyword + ' ' + condition)
            }
          } else if (/^ELSE$/i.test(part)) {
            // ELSE 关键字 - 缩进 2 spaces
            const value = parts[++i]?.trim() || ''
            const elseKeyword = keywordCase === 'upper' ? 'ELSE' : 'else'
            lines.push(indent + elseKeyword + ' ' + value)
          }
        }
        
        // END 对齐 CASE，不缩进
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
      const line = clauseLines[i]
      const trimmed = line.trim()
      
      // 检测 ) AS 表示离开子查询（在处理当前行之前）
      if (/^\)\s+AS\s+/i.test(trimmed)) {
        subqueryDepth = Math.max(0, subqueryDepth - 1)
      }
      
      // 计算当前行的额外缩进
      const extraIndent = indent.repeat(subqueryDepth)
      
      // 检查是否已经有缩进（来自 INSERT、UPDATE 等特殊处理）
      const hasIndent = line !== trimmed && trimmed.length > 0
      
      // 如果已经有缩进，直接保留原行（但可能需要添加子查询缩进）
      if (hasIndent && !/^(SELECT|FROM|GROUP BY|ORDER BY)\b/i.test(trimmed)) {
        processedLines.push(extraIndent + line)
        continue
      }
      
      // 检查是否是 SELECT 行
      if (/^SELECT\b/i.test(trimmed)) {
        const match = trimmed.match(/^(SELECT\s+(?:DISTINCT\s+)?)(.*)/i)
        if (match) {
          const selectPart = match[1].trim()
          const fieldsPart = match[2]
          const fields = splitFields(fieldsPart)
          
          // 总是换行和缩进字段，不管字段数量
          processedLines.push(extraIndent + selectPart)
          fields.forEach((field, idx) => {
            const isLast = idx === fields.length - 1
            
            // 检查字段是否包含 CASE WHEN
            if (/\bCASE\b/i.test(field)) {
              const caseLines = formatCaseWhen(field)
              caseLines.forEach((caseLine, caseIdx) => {
                if (caseIdx === 0) {
                  // 第一行：添加缩进 2 spaces + 子查询缩进
                  processedLines.push(extraIndent + indent + caseLine)
                } else if (caseIdx === caseLines.length - 1) {
                  // 最后一行：END，添加逗号（如果不是最后一个字段）
                  processedLines.push(extraIndent + indent + caseLine + (isLast ? '' : ','))
                } else {
                  // 中间行：已经在 formatCaseWhen 中处理了缩进
                  processedLines.push(extraIndent + indent + caseLine)
                }
              })
            } else {
              // 普通字段 - 缩进 2 spaces + 子查询缩进
              if (isLast) {
                processedLines.push(extraIndent + indent + field)
              } else {
                processedLines.push(extraIndent + indent + field + ',')
              }
            }
          })
        } else {
          processedLines.push(extraIndent + trimmed)
        }
      }
      // 检查是否是 FROM 行 - 需要处理表名、子查询和 JOIN
      else if (/^FROM\b/i.test(trimmed)) {
        const match = trimmed.match(/^(FROM\s+)(.*)/i)
        if (match) {
          const fromPart = match[1].trim()
          const tablePart = match[2].trim()
          
          // FROM 单独一行
          processedLines.push(extraIndent + fromPart)
          
          // 检查是否是子查询（以 ( 开头）
          if (tablePart === '(') {
            // 子查询情况：添加左括号，然后增加缩进深度
            processedLines.push(extraIndent + indent + '(')
            subqueryDepth++
          } else {
            // 表名缩进 2 spaces
            processedLines.push(extraIndent + indent + tablePart)
          }
        } else {
          processedLines.push(extraIndent + trimmed)
        }
      }
      // 检查是否是 JOIN 行
      else if (/^(INNER\s+JOIN|LEFT\s+JOIN|RIGHT\s+JOIN|FULL\s+JOIN|CROSS\s+JOIN|OUTER\s+JOIN|JOIN)\b/i.test(trimmed)) {
        // JOIN 缩进 2 spaces + 子查询缩进
        processedLines.push(extraIndent + indent + trimmed)
      }
      // 检查是否是 GROUP BY 行
      else if (/^GROUP BY\b/i.test(trimmed)) {
        const match = trimmed.match(/^(GROUP BY\s+)(.*)/i)
        if (match) {
          const groupByPart = match[1].trim()
          const fieldsPart = match[2]
          const fields = splitFields(fieldsPart)
          
          if (fields.length > 1) {
            processedLines.push(extraIndent + groupByPart)
            fields.forEach((field, idx) => {
              if (idx === fields.length - 1) {
                processedLines.push(extraIndent + indent + field)
              } else {
                processedLines.push(extraIndent + indent + field + ',')
              }
            })
          } else {
            processedLines.push(extraIndent + line)
          }
        } else {
          processedLines.push(extraIndent + line)
        }
      }
      // 检查是否是 ORDER BY 行
      else if (/^ORDER BY\b/i.test(trimmed)) {
        const match = trimmed.match(/^(ORDER BY\s+)(.*)/i)
        if (match) {
          const orderByPart = match[1].trim()
          const fieldsPart = match[2]
          const fields = splitFields(fieldsPart)
          
          if (fields.length > 1) {
            processedLines.push(extraIndent + orderByPart)
            fields.forEach((field, idx) => {
              if (idx === fields.length - 1) {
                processedLines.push(extraIndent + indent + field)
              } else {
                processedLines.push(extraIndent + indent + field + ',')
              }
            })
          } else {
            processedLines.push(extraIndent + trimmed)
          }
        } else {
          processedLines.push(extraIndent + trimmed)
        }
      }
      else {
        // 处理 ) AS alias - 需要减少缩进层级
        if (/^\)\s+AS\s+/i.test(trimmed)) {
          processedLines.push(extraIndent + trimmed)
        } else {
          // 其他情况（WHERE, HAVING等）也需要子查询缩进
          processedLines.push(extraIndent + trimmed)
        }
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
    
    // 恢复 CREATE TABLE 占位符
    createTablePlaceholders.forEach(({ placeholder, content }) => {
      sql = sql.replace(placeholder, content)
    })
    
    // 添加基本缩进（优化版）
    const finalLines = sql.split('\n')
    const formatted: string[] = []
    
    for (let i = 0; i < finalLines.length; i++) {
      const line = finalLines[i]
      const trimmed = line.trim()
      
      // 检查行是否已经有缩进（来自 SELECT、GROUP BY、ORDER BY、INSERT 等的字段处理）
      const hasIndent = line.startsWith(' ') || line.startsWith('\t')
      
      // 如果已经有缩进，保持原样（优先检查，避免被后续逻辑覆盖）
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
      // 1. AND/OR 逻辑运算符
      // 2. WHERE 子句的条件内容
      // 3. HAVING 子句的条件内容
      // 4. JOIN...ON 子句的 ON 条件内容
      // 5. ORDER BY 的字段列表
      // 6. SELECT 后续的字段行
      
      if (/^(AND|OR)\b/i.test(trimmed)) {
        // AND/OR 已经有缩进标记，保持缩进
        formatted.push(indent + trimmed)
      } else if (
        lastMainClause.match(/^SELECT$/i) ||
        lastMainClause.match(/^(WHERE|HAVING)$/i) ||
        lastMainClause.match(/JOIN$/i) ||
        lastMainClause.match(/^ORDER BY$/i)
      ) {
        // SELECT、WHERE、HAVING、JOIN ON、ORDER BY 子句的内容需要缩进
        formatted.push(indent + trimmed)
      } else {
        // 其他情况保持原样
        formatted.push(trimmed)
      }
    }
    
    let result = formatted.join('\n')
    
    // 应用 CTE 缩进处理
    result = addCteIndentation(result)
    
    return result
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
        // 在开始新子句之前，如果有待处理的注释，将它们作为独立的不可折叠子句添加
        if (pendingComments.length > 0) {
          clauses.push({
            type: 'UNKNOWN',
            content: pendingComments.join('\n'),
            raw: pendingComments.join('\n'),
            collapsible: false,
            path: `clause-${clauses.length}`,
          })
          pendingComments = []
        }
        
        // 保存之前的子句
        if (currentClause && currentContent.length > 0) {
          currentClause.content = currentContent.join('\n')
          currentClause.raw = currentContent.join('\n')
          clauses.push(currentClause)
        }
        
        // 开始新的子句（不包含之前的注释）
        currentContent = [line]
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
