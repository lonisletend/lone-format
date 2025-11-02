export { default as JsonFormat } from './JsonFormat/index.vue'
export { default as XmlFormat } from './XmlFormat/index.vue'

// 导出共享的类型（从 JsonFormat）
export type { FilterConfig, FilterType, ThemeConfig, ThemeType } from './JsonFormat/types'

// 导出 XML 特有的类型
export type { XmlNode, XmlNodeType, ParsedXml, XmlFormatOptions } from './XmlFormat/types'
