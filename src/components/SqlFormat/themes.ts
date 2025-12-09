/**
 * SQL 格式化主题配置
 * 基于现有主题，扩展了 SQL 特有的颜色
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
    hoverBackground: '#f3f4f6',

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

    // SQL 语法高亮
    sqlKeyword: '#cf222e',        // 关键字 - 红色
    sqlFunction: '#8250df',       // 函数 - 紫色
    sqlString: '#0a3069',         // 字符串 - 深蓝
    sqlNumber: '#0550ae',         // 数字 - 蓝色
    sqlComment: '#6e7781',        // 注释 - 灰色
    sqlOperator: '#cf222e',       // 操作符 - 红色
    sqlIdentifier: '#24292f',     // 标识符 - 黑色
    sqlPunctuation: '#24292f',    // 标点 - 黑色

    // 折叠效果
    collapsedBackground: '#ddf4ff', // 折叠信息背景色 - 浅蓝
    collapsedText: '#0969da',       // 折叠信息文本色 - 蓝色

    // 缩进指示线
    indentLine: '#d0d7de',          // 对齐线 - 灰色
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
    hoverBackground: '#30363d',

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

    // SQL 语法高亮
    sqlKeyword: '#ff7b72',        // 关键字 - 红色
    sqlFunction: '#d2a8ff',       // 函数 - 紫色
    sqlString: '#a5d6ff',         // 字符串 - 淡蓝色
    sqlNumber: '#79c0ff',         // 数字 - 亮蓝色
    sqlComment: '#8b949e',        // 注释 - 灰色
    sqlOperator: '#ff7b72',       // 操作符 - 红色
    sqlIdentifier: '#c9d1d9',     // 标识符 - 白色
    sqlPunctuation: '#c9d1d9',    // 标点 - 白色

    // 折叠效果
    collapsedBackground: '#1c2d41', // 折叠信息背景色 - 深蓝
    collapsedText: '#58a6ff',       // 折叠信息文本色 - 蓝色

    // 缩进指示线
    indentLine: '#30363d',          // 对齐线 - 灰色
  },
}

/**
 * Min Light 主题
 */
const minLight: ThemeConfig = {
  name: 'min-light',
  colors: {
    // 背景色
    background: '#ffffff',
    surfaceBackground: '#fafafa',
    hoverBackground: '#f5f5f5',

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

    // SQL 语法高亮
    sqlKeyword: '#dc2626',        // 关键字 - 红色
    sqlFunction: '#9333ea',       // 函数 - 紫色
    sqlString: '#1e40af',         // 字符串 - 深蓝
    sqlNumber: '#2563eb',         // 数字 - 蓝色
    sqlComment: '#737373',        // 注释 - 灰色
    sqlOperator: '#dc2626',       // 操作符 - 红色
    sqlIdentifier: '#171717',     // 标识符 - 深灰
    sqlPunctuation: '#171717',    // 标点 - 深灰

    // 折叠效果
    collapsedBackground: '#dbeafe', // 折叠信息背景色 - 浅蓝
    collapsedText: '#1d4ed8',       // 折叠信息文本色 - 蓝色

    // 缩进指示线
    indentLine: '#e0e0e0',          // 对齐线 - 灰色
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
    hoverBackground: '#f9f0e5',

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

    // SQL 语法高亮
    sqlKeyword: '#e01e5a',        // 关键字 - 红色
    sqlFunction: '#8b2eff',       // 函数 - 紫色
    sqlString: '#0b4c8c',         // 字符串 - 深蓝
    sqlNumber: '#1264a3',         // 数字 - 蓝色
    sqlComment: '#616061',        // 注释 - 灰色
    sqlOperator: '#e01e5a',       // 操作符 - 红色
    sqlIdentifier: '#3d3c40',     // 标识符 - 深色
    sqlPunctuation: '#3d3c40',    // 标点 - 深色

    // 折叠效果
    collapsedBackground: '#d8eaf5', // 折叠信息背景色 - 浅蓝
    collapsedText: '#0b4c8c',       // 折叠信息文本色 - 深蓝

    // 缩进指示线
    indentLine: '#3e4348',          // 对齐线 - 灰色
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
 * 获取所有主题名称
 */
export const getThemeNames = (): ThemeType[] => {
  return Object.keys(themes) as ThemeType[]
}

/**
 * 导出所有主题
 */
export { githubLight, githubDark, minLight, slackOchin, themes }
