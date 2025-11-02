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
  preserveOrder: false,           // 不保留顺序（使用对象结构）
  parseAttributeValue: false,     // 不解析属性值（保持字符串）
  trimValues: true,               // 去除首尾空白
  parseTagValue: false,           // 不解析标签值（保持字符串）
  processEntities: true,          // 处理实体
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
 * 验证 XML 字符串
 */
export const validateXml = (xmlString: string): { valid: boolean; error?: string } => {
  try {
    const result = XMLValidator.validate(xmlString, {
      allowBooleanAttributes: true,
    })

    if (result === true) {
      return { valid: true }
    } else {
      return {
        valid: false,
        error: `Line ${result.err.line}: ${result.err.msg}`,
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
export const compressXml = (obj: ParsedXml): string => {
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
