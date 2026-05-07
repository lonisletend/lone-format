/**
 * XML 解析和构建工具
 * 基于 fast-xml-parser
 */

import { XMLParser, XMLBuilder, XMLValidator } from 'fast-xml-parser'
import type { ParsedXml, XmlFormatOptions } from './types'

/**
 * 默认解析选项
 */
const defaultParserOptions = {
  ignoreAttributes: false,        // 保留属性
  attributeNamePrefix: '@_',      // 属性前缀
  textNodeName: '#text',          // 文本节点名
  ignoreDeclaration: false,       // 保留 XML 声明
  commentPropName: '#comment',    // 注释属性名
  cdataPropName: '__cdata',       // CDATA 属性名
  preserveOrder: true,            // 保留顺序（使用数组结构以保留注释位置）
  parseAttributeValue: false,     // 不解析属性值（保持字符串）
  trimValues: false,              // 不去除首尾空白（保留原始空白字符）
  parseTagValue: false,           // 不解析标签值（保持字符串）
  processEntities: false,         // 不处理实体（保留原始实体引用）
  htmlEntities: false,            // 不是 HTML 实体
  ignoreNameSpace: false,         // 保留命名空间
  allowBooleanAttributes: true,   // 允许布尔属性
  unpairedTags: [],               // 未配对的标签
  stopNodes: [],                  // 停止解析的节点
  alwaysCreateTextNode: false,    // 仅在有文本时创建文本节点
}

/**
 * 默认构建选项
 */
const defaultBuilderOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  format: true,                   // 格式化输出
  indentBy: '  ',                 // 缩进 2 空格
  suppressEmptyNode: false,       // 不抑制空节点
  suppressBooleanAttributes: false,
  suppressUnpairedNode: false,
}

/**
 * 验证实体引用
 * 检查 XML 中的实体引用是否合法
 * 合法的预定义实体引用：&lt; &gt; &amp; &quot; &apos;
 * 数字字符引用：&#数字; 或 &#x十六进制;
 * 注意：CDATA 区域内的内容会被跳过，不进行实体引用验证
 */
const validateEntityReferences = (xmlString: string): { valid: boolean; error?: string } => {
  // 首先找出所有 CDATA 区域的位置
  const cdataPattern = /<!\[CDATA\[([\s\S]*?)\]\]>/g
  const cdataRanges: Array<{ start: number; end: number }> = []
  let cdataMatch
  
  while ((cdataMatch = cdataPattern.exec(xmlString)) !== null) {
    cdataRanges.push({
      start: cdataMatch.index,
      end: cdataMatch.index + cdataMatch[0].length
    })
  }
  
  // 检查位置是否在 CDATA 区域内
  const isInCDATA = (position: number): boolean => {
    return cdataRanges.some(range => position >= range.start && position < range.end)
  }
  
  // 匹配所有实体引用：&xxx;
  const entityPattern = /&([a-zA-Z0-9#]+);/g
  const validPredefinedEntities = ['lt', 'gt', 'amp', 'quot', 'apos']
  
  let match
  let lineNumber = 1
  let lastIndex = 0
  
  while ((match = entityPattern.exec(xmlString)) !== null) {
    const entityName = match[1]
    const entityPosition = match.index
    
    // 如果实体引用在 CDATA 区域内，跳过验证
    if (isInCDATA(entityPosition)) {
      continue
    }
    
    // 计算行号
    const textBeforeEntity = xmlString.substring(lastIndex, entityPosition)
    lineNumber += (textBeforeEntity.match(/\n/g) || []).length
    lastIndex = entityPosition
    
    // 检查是否为数字字符引用 &#数字; 或 &#x十六进制;
    if (entityName.startsWith('#')) {
      const numPart = entityName.substring(1)
      // 十六进制格式 &#xHEX;
      if (numPart.startsWith('x') || numPart.startsWith('X')) {
        const hexValue = numPart.substring(1)
        if (!/^[0-9a-fA-F]+$/.test(hexValue)) {
          return {
            valid: false,
            error: `Line ${lineNumber}: Invalid hexadecimal character reference '&${entityName};'`
          }
        }
      }
      // 十进制格式 &#数字;
      else if (!/^[0-9]+$/.test(numPart)) {
        return {
          valid: false,
          error: `Line ${lineNumber}: Invalid numeric character reference '&${entityName};'`
        }
      }
      continue
    }
    
    // 检查是否为预定义实体引用（区分大小写）
    if (!validPredefinedEntities.includes(entityName)) {
      return {
        valid: false,
        error: `Line ${lineNumber}: Invalid entity reference '&${entityName};'. Valid predefined entities are: &lt; &gt; &amp; &quot; &apos;`
      }
    }
  }
  
  return { valid: true }
}

/**
 * 验证 XML 字符串
 */
export const validateXml = (xmlString: string): { valid: boolean; error?: string } => {
  try {
    // 先进行基本的 XML 语法验证
    const result = XMLValidator.validate(xmlString, {
      allowBooleanAttributes: true,
    })

    if (result !== true) {
      return {
        valid: false,
        error: `Line ${result.err.line}: ${result.err.msg}`,
      }
    }
    
    // 再验证实体引用的合法性
    const entityValidation = validateEntityReferences(xmlString)
    if (!entityValidation.valid) {
      return entityValidation
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
 * 解析 XML 字符串为 JSON 对象
 */
export const parseXml = (
  xmlString: string,
  options?: Partial<typeof defaultParserOptions>
): ParsedXml => {
  try {
    const parser = new XMLParser({
      ...defaultParserOptions,
      ...options,
    })

    return parser.parse(xmlString)
  } catch (error) {
    throw new Error(
      `XML 解析失败: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * 构建 XML 字符串
 */
export const buildXml = (
  obj: ParsedXml,
  options?: XmlFormatOptions
): string => {
  try {
    const builder = new XMLBuilder({
      ...defaultBuilderOptions,
      format: options?.format ?? true,
      indentBy: options?.indentBy ?? '  ',
    })

    let xml = builder.build(obj)

    // 添加 XML 声明（如果需要）
    if (options?.showDeclaration !== false && !xml.startsWith('<?xml')) {
      xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + xml
    }

    return xml
  } catch (error) {
    throw new Error(
      `XML 构建失败: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * 压缩 XML（移除格式化）
 */
export const compressXml = (obj: ParsedXml, originalXml?: string): string => {
  // 处理 preserveOrder: true 的数组结构
  if (Array.isArray(obj)) {
    return buildXmlFromArray(obj, { format: false, originalXml })
  }
  return buildXml(obj, { format: false, showDeclaration: false })
}

/**
 * 格式化 XML 字符串
 */
export const formatXml = (
  xmlString: string,
  options?: XmlFormatOptions
): string => {
  const parsed = parseXml(xmlString)
  // 处理 preserveOrder: true 的数组结构
  if (Array.isArray(parsed)) {
    return buildXmlFromArray(parsed, { 
      indent: options?.indentBy || '  ',
      originalXml: xmlString
    })
  }
  return buildXml(parsed, options)
}

/**
 * 从 XML 字符串中提取根节点名称
 */
export const getRootNodeName = (xmlString: string): string | null => {
  const match = xmlString.match(/<([a-zA-Z0-9_-]+)[\s>]/)
  return match ? match[1] : null
}

/**
 * 统计 XML 节点数量
 */
export const countNodes = (obj: ParsedXml): number => {
  let count = 0

  const traverse = (node: any) => {
    if (node === null || typeof node !== 'object') {
      return
    }

    count++

    if (Array.isArray(node)) {
      node.forEach(traverse)
    } else {
      Object.values(node).forEach(traverse)
    }
  }

  traverse(obj)
  return count
}

/**
 * 检查是否有属性
 */
export const hasAttributes = (node: any): boolean => {
  if (!node || typeof node !== 'object') return false
  
  return Object.keys(node).some(key => key.startsWith('@_'))
}

/**
 * 提取属性对象
 */
export const extractAttributes = (node: any): Record<string, string> => {
  if (!node || typeof node !== 'object') return {}
  
  const attrs: Record<string, string> = {}
  Object.keys(node).forEach(key => {
    if (key.startsWith('@_')) {
      const attrName = key.substring(2)
      attrs[attrName] = node[key]
    }
  })
  
  return attrs
}

/**
 * 获取文本内容
 */
export const getTextContent = (node: any): string | null => {
  if (!node || typeof node !== 'object') {
    return typeof node === 'string' ? node : null
  }
  
  return node['#text'] || null
}

/**
 * 判断是否为空节点
 */
export const isEmptyNode = (node: any): boolean => {
  if (node === null || node === undefined) return true
  if (typeof node !== 'object') return false
  
  const keys = Object.keys(node)
  return keys.length === 0 || 
         (keys.length === 1 && keys[0].startsWith('@_'))
}

/**
 * 为已解析的 XML 数据（preserveOrder: true 格式）按文档顺序（DFS）注解自闭合状态
 * 在每个元素对象上添加 ':selfClosing' 键，供 XmlNode 渲染时直接读取
 * 必须在 parseXml() 之后、渲染前调用一次
 */
export const annotateSelfClosingInfo = (data: any[], originalXml: string): void => {
  const occurrences = extractSelfClosingOccurrences(originalXml)
  const counters = new Map<string, number>()

  const annotate = (nodeArray: any[]) => {
    for (const item of nodeArray) {
      const tagName = Object.keys(item).find(
        key => !key.startsWith(':') && !key.startsWith('#') && !key.startsWith('__') && !key.startsWith('?')
      )
      if (!tagName) continue

      const idx = counters.get(tagName) ?? 0
      counters.set(tagName, idx + 1)
      item[':selfClosing'] = occurrences.get(tagName)?.[idx] ?? false

      const children = item[tagName]
      if (Array.isArray(children) && children.length > 0) {
        annotate(children)
      }
    }
  }

  annotate(data)
}

/**
 * 提取原始 XML 中的自闭合标签信息
 */
export const extractSelfClosingTags = (xmlString: string): Set<string> => {
  const selfClosingTags = new Set<string>()
  // 匹配自闭合标签：<tagName ... />
  const selfClosingRegex = /<([a-zA-Z0-9_-]+)(?:\s[^>]*)?\s*\/>/g
  let match
  while ((match = selfClosingRegex.exec(xmlString)) !== null) {
    selfClosingTags.add(match[1])
  }
  return selfClosingTags
}

/**
 * 按文档顺序提取每个标签每次出现是否为自闭合
 * 返回 Map<tagName, boolean[]>，boolean[] 中第 n 项对应该标签第 n 次出现（DFS 顺序）
 *
 * 与 extractSelfClosingTags 的区别：后者只记录"某标签名是否出现过自闭合"，
 * 当同名标签中有的自闭合、有的非自闭合时会误判所有同名标签。
 * 此函数逐次记录，配合 buildXmlFromArray 中的计数器可精确还原。
 */
const extractSelfClosingOccurrences = (xmlString: string): Map<string, boolean[]> => {
  const result = new Map<string, boolean[]>()
  let i = 0

  while (i < xmlString.length) {
    // 跳过注释
    if (xmlString.startsWith('<!--', i)) {
      const end = xmlString.indexOf('-->', i)
      i = end !== -1 ? end + 3 : xmlString.length
      continue
    }
    // 跳过 CDATA
    if (xmlString.startsWith('<![CDATA[', i)) {
      const end = xmlString.indexOf(']]>', i)
      i = end !== -1 ? end + 3 : xmlString.length
      continue
    }
    // 跳过处理指令（含 XML 声明）
    if (xmlString.startsWith('<?', i)) {
      const end = xmlString.indexOf('?>', i)
      i = end !== -1 ? end + 2 : xmlString.length
      continue
    }
    // 跳过闭合标签
    if (xmlString.startsWith('</', i)) {
      const end = xmlString.indexOf('>', i)
      i = end !== -1 ? end + 1 : xmlString.length
      continue
    }
    // 处理开始标签（可能是自闭合）
    if (xmlString[i] === '<') {
      const tagMatch = xmlString.slice(i + 1).match(/^([a-zA-Z_][a-zA-Z0-9_:.-]*)/)
      if (tagMatch) {
        const tagName = tagMatch[1]
        let j = i + 1 + tagName.length
        let inStr = false
        let strChar = ''

        while (j < xmlString.length) {
          const ch = xmlString[j]
          if (inStr) {
            if (ch === strChar) inStr = false
          } else {
            if (ch === '"' || ch === "'") {
              inStr = true
              strChar = ch
            } else if (ch === '>') {
              // 向前跳过空白，判断是否以 / 结尾（自闭合）
              let k = j - 1
              while (k > i && (xmlString[k] === ' ' || xmlString[k] === '\t' || xmlString[k] === '\n' || xmlString[k] === '\r')) {
                k--
              }
              const isSelfClosing = xmlString[k] === '/'
              if (!result.has(tagName)) result.set(tagName, [])
              result.get(tagName)!.push(isSelfClosing)
              i = j + 1
              break
            }
          }
          j++
        }
        if (j >= xmlString.length) break
        continue
      }
    }
    i++
  }

  return result
}

/**
 * 从 preserveOrder 数组结构构建格式化的 XML 字符串
 */
export const buildXmlFromArray = (
  data: any[],
  options: {
    indent?: string
    level?: number
    format?: boolean
    selfClosingTags?: Set<string>
    selfClosingOccurrences?: Map<string, boolean[]>
    selfClosingCounters?: Map<string, number>
    originalXml?: string
  } = {}
): string => {
  const indent = options.indent !== undefined ? options.indent : '  '
  const level = options.level || 0
  const format = options.format !== false // 默认格式化
  const currentIndent = format ? indent.repeat(level) : ''
  const lineBreak = format ? '\n' : ''

  let selfClosingTags = options.selfClosingTags
  let selfClosingOccurrences = options.selfClosingOccurrences
  let selfClosingCounters = options.selfClosingCounters

  // 顶层调用时初始化自闭合跟踪：优先使用逐次出现信息（精确），回退到标签名集合（可能误判）
  if (level === 0) {
    if (options.originalXml) {
      selfClosingOccurrences = extractSelfClosingOccurrences(options.originalXml)
      selfClosingCounters = new Map()
    } else if (!selfClosingTags && !selfClosingOccurrences) {
      // 既无 originalXml 也无任何自闭合信息，所有空元素一律输出配对标签
    }
  }

  let result = ''

  for (const item of data) {
    // 处理 XML 声明
    if (item['?xml']) {
      const attrs = item[':@'] || {}
      const attrStr = Object.entries(attrs)
        .map(([key, value]) => {
          // 移除 @_ 前缀
          const attrName = key.startsWith('@_') ? key.substring(2) : key
          return `${attrName}="${value}"`
        })
        .join(' ')
      result += `<?xml ${attrStr}?>${lineBreak}`
      continue
    }

    // 处理注释
    if (item['#comment']) {
      const commentValue = item['#comment']
      if (Array.isArray(commentValue) && commentValue.length > 0) {
        const comment = commentValue[0]['#text'] || commentValue[0]
        result += `${currentIndent}<!--${comment}-->${lineBreak}`
      }
      continue
    }

    // 处理普通元素
    const tagName = Object.keys(item).find(key => !key.startsWith(':') && !key.startsWith('#') && !key.startsWith('__'))
    if (!tagName) continue

    // 获取当前元素的出现次序并递增计数器（无论是否为空元素都要计数，以维护文档顺序）
    let occurrenceIndex = 0
    if (selfClosingOccurrences && selfClosingCounters) {
      occurrenceIndex = selfClosingCounters.get(tagName) ?? 0
      selfClosingCounters.set(tagName, occurrenceIndex + 1)
    }

    const children = item[tagName]
    const attributes = item[':@'] || {}

    // 构建属性字符串，移除 @_ 前缀
    const attrStr = Object.entries(attributes)
      .map(([key, value]) => {
        const attrName = key.startsWith('@_') ? key.substring(2) : key
        return `${attrName}="${value}"`
      })
      .join(' ')
    const attrsPart = attrStr ? ' ' + attrStr : ''

    // 检查是否有子元素
    if (!Array.isArray(children) || children.length === 0) {
      // 空元素：根据原始格式决定使用自闭合还是配对标签
      let isSelfClosing: boolean
      if (selfClosingOccurrences) {
        // 精确模式：按当前元素的出现次序查表
        isSelfClosing = selfClosingOccurrences.get(tagName)?.[occurrenceIndex] ?? false
      } else {
        // 回退模式：标签名级别判断（同名元素共享状态）
        isSelfClosing = !!(selfClosingTags && selfClosingTags.has(tagName))
      }
      if (isSelfClosing) {
        result += `${currentIndent}<${tagName}${attrsPart}/>${lineBreak}`
      } else {
        result += `${currentIndent}<${tagName}${attrsPart}></${tagName}>${lineBreak}`
      }
      continue
    }

    // 检查是否为简单文本节点（包括只有空白的节点）
    const hasOnlyText = children.length === 1 && children[0]['#text'] !== undefined
    const textContent = hasOnlyText ? children[0]['#text'] : ''
    const hasCdata = children.some((child: any) => child['__cdata'])

    // 如果文本内容为空字符串（不是只有空格），使用开始和结束标签
    const isEmptyTextNode = hasOnlyText && textContent === ''

    if (hasCdata) {
      // 处理 CDATA
      const cdataChild = children.find((child: any) => child['__cdata'])
      if (cdataChild) {
        const cdataContent = cdataChild['__cdata'][0]['#text'] || ''
        result += `${currentIndent}<${tagName}${attrsPart}><![CDATA[${cdataContent}]]></${tagName}>${lineBreak}`
      }
    } else if (isEmptyTextNode) {
      // 空文本节点 - 使用开始和结束标签（保留原格式）
      result += `${currentIndent}<${tagName}${attrsPart}></${tagName}>${lineBreak}`
    } else if (hasOnlyText) {
      // 简单文本节点（包括只有空白的节点）- 单行显示，保留原始文本
      result += `${currentIndent}<${tagName}${attrsPart}>${textContent}</${tagName}>${lineBreak}`
    } else {
      // 有子元素 - 多行显示；传递共享的自闭合跟踪状态（计数器是引用传递，跨递归共享）
      result += `${currentIndent}<${tagName}${attrsPart}>${lineBreak}`
      result += buildXmlFromArray(children, { indent, level: level + 1, format, selfClosingTags, selfClosingOccurrences, selfClosingCounters })
      result += `${currentIndent}</${tagName}>${lineBreak}`
    }
  }

  return result
}
