/**
 * XML 格式化主题配置
 * 基于 JSON 格式化的主题，扩展了 XML 特有的颜色
 */

import type { ThemeConfig, ThemeType } from './types'

/**
 * GitHub Light 主题
 */
const githubLight: ThemeConfig = {
  name: 'github-light',
  colors: {
    // 背景色
    background: '#ffffff',
    surfaceBackground: '#f6f8fa',

    // 边框色
    border: '#d0d7de',

    // 文本色
    text: '#24292f',
    textSecondary: '#57606a',

    // 按钮样式
    buttonBackground: '#f6f8fa',
    buttonBackgroundHover: '#f3f4f6',
    buttonBorder: '#d0d7de',
    buttonText: '#24292f',
    buttonPrimary: '#1f883d',
    buttonPrimaryHover: '#1a7f37',

    // 状态指示
    success: '#1f883d',
    successBackground: '#dafbe1',
    error: '#cf222e',
    errorBackground: '#ffebe9',

    // XML 语法高亮
    xmlTag: '#116329',          // 标签名 - 绿色
    xmlAttribute: '#0550ae',    // 属性名 - 蓝色
    xmlAttributeValue: '#0a3069', // 属性值 - 深蓝
    xmlText: '#24292f',         // 文本内容 - 黑色
    xmlComment: '#6e7781',      // 注释 - 灰色
    xmlCdata: '#8250df',        // CDATA - 紫色
    xmlDeclaration: '#953800',  // 声明 - 橙色
    xmlBracket: '#6e7781',      // 括号 - 灰色
    xmlEquals: '#6e7781',       // 等号 - 灰色
    xmlQuote: '#0550ae',        // 引号 - 蓝色

    // 折叠效果
    collapsedBackground: '#ddf4ff', // 折叠信息背景色 - 浅蓝
    collapsedText: '#0969da',       // 折叠信息文本色 - 蓝色
  },
}

/**
 * GitHub Dark 主题
 */
const githubDark: ThemeConfig = {
  name: 'github-dark',
  colors: {
    // 背景色
    background: '#0d1117',
    surfaceBackground: '#161b22',

    // 边框色
    border: '#30363d',

    // 文本色
    text: '#c9d1d9',
    textSecondary: '#8b949e',

    // 按钮样式
    buttonBackground: '#21262d',
    buttonBackgroundHover: '#30363d',
    buttonBorder: '#30363d',
    buttonText: '#c9d1d9',
    buttonPrimary: '#238636',
    buttonPrimaryHover: '#2ea043',

    // 状态指示
    success: '#3fb950',
    successBackground: '#0f2e1c',
    error: '#f85149',
    errorBackground: '#3d1319',

    // XML 语法高亮
    xmlTag: '#7ee787',          // 标签名 - 亮绿色
    xmlAttribute: '#79c0ff',    // 属性名 - 亮蓝色
    xmlAttributeValue: '#a5d6ff', // 属性值 - 淡蓝色
    xmlText: '#c9d1d9',         // 文本内容 - 白色
    xmlComment: '#8b949e',      // 注释 - 灰色
    xmlCdata: '#d2a8ff',        // CDATA - 紫色
    xmlDeclaration: '#ffa657',  // 声明 - 橙色
    xmlBracket: '#8b949e',      // 括号 - 灰色
    xmlEquals: '#8b949e',       // 等号 - 灰色
    xmlQuote: '#79c0ff',        // 引号 - 亮蓝色

    // 折叠效果
    collapsedBackground: '#1c2d41', // 折叠信息背景色 - 深蓝
    collapsedText: '#58a6ff',       // 折叠信息文本色 - 亮蓝
  },
}

/**
 * Minimal Light 主题
 */
const minLight: ThemeConfig = {
  name: 'min-light',
  colors: {
    // 背景色
    background: '#ffffff',
    surfaceBackground: '#fafafa',

    // 边框色
    border: '#e5e5e5',

    // 文本色
    text: '#171717',
    textSecondary: '#737373',

    // 按钮样式
    buttonBackground: '#fafafa',
    buttonBackgroundHover: '#f5f5f5',
    buttonBorder: '#e5e5e5',
    buttonText: '#171717',
    buttonPrimary: '#22c55e',
    buttonPrimaryHover: '#16a34a',

    // 状态指示
    success: '#22c55e',
    successBackground: '#dcfce7',
    error: '#ef4444',
    errorBackground: '#fee2e2',

    // XML 语法高亮
    xmlTag: '#16a34a',          // 标签名 - 绿色
    xmlAttribute: '#2563eb',    // 属性名 - 蓝色
    xmlAttributeValue: '#1e40af', // 属性值 - 深蓝
    xmlText: '#171717',         // 文本内容 - 黑色
    xmlComment: '#737373',      // 注释 - 灰色
    xmlCdata: '#9333ea',        // CDATA - 紫色
    xmlDeclaration: '#ea580c',  // 声明 - 橙色
    xmlBracket: '#737373',      // 括号 - 灰色
    xmlEquals: '#737373',       // 等号 - 灰色
    xmlQuote: '#2563eb',        // 引号 - 蓝色

    // 折叠效果
    collapsedBackground: '#dbeafe', // 折叠信息背景色 - 浅蓝
    collapsedText: '#1d4ed8',       // 折叠信息文本色 - 蓝色
  },
}

/**
 * Slack Ochin 主题
 */
const slackOchin: ThemeConfig = {
  name: 'slack-ochin',
  colors: {
    // 背景色
    background: '#fef5ed',
    surfaceBackground: '#fef9f3',

    // 边框色
    border: '#e9dcc9',

    // 文本色
    text: '#3d3c40',
    textSecondary: '#616061',

    // 按钮样式
    buttonBackground: '#fef9f3',
    buttonBackgroundHover: '#f9f0e5',
    buttonBorder: '#e9dcc9',
    buttonText: '#3d3c40',
    buttonPrimary: '#007a5a',
    buttonPrimaryHover: '#006644',

    // 状态指示
    success: '#007a5a',
    successBackground: '#d1f4e0',
    error: '#e01e5a',
    errorBackground: '#ffdbea',

    // XML 语法高亮
    xmlTag: '#007a5a',          // 标签名 - 绿色
    xmlAttribute: '#1264a3',    // 属性名 - 蓝色
    xmlAttributeValue: '#0b4c8c', // 属性值 - 深蓝
    xmlText: '#3d3c40',         // 文本内容 - 黑色
    xmlComment: '#616061',      // 注释 - 灰色
    xmlCdata: '#8b2eff',        // CDATA - 紫色
    xmlDeclaration: '#e8912d',  // 声明 - 橙色
    xmlBracket: '#616061',      // 括号 - 灰色
    xmlEquals: '#616061',       // 等号 - 灰色
    xmlQuote: '#1264a3',        // 引号 - 蓝色

    // 折叠效果
    collapsedBackground: '#d8eaf5', // 折叠信息背景色 - 浅蓝
    collapsedText: '#0b4c8c',       // 折叠信息文本色 - 深蓝
  },
}

/**
 * 主题映射表
 */
const themes: Record<ThemeType, ThemeConfig> = {
  'github-light': githubLight,
  'github-dark': githubDark,
  'min-light': minLight,
  'slack-ochin': slackOchin,
}

/**
 * 获取主题配置
 */
export const getTheme = (themeName: ThemeType): ThemeConfig => {
  return themes[themeName] || themes['github-light']
}

/**
 * 导出所有主题
 */
export { githubLight, githubDark, minLight, slackOchin, themes }
