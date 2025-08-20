import type { ThemeConfig, ThemeType } from './types'

/**
 * GitHub Light 主题配置
 */
export const githubLightTheme: ThemeConfig = {
  name: 'github-light',
  colors: {
    // 背景色
    background: '#ffffff',
    surfaceBackground: '#f6f8fa',

    // 边框色
    border: '#d0d7de',

    // 文本色
    text: '#24292f',
    textSecondary: '#656d76',

    // 按钮样式
    buttonBackground: '#f6f8fa',
    buttonBackgroundHover: '#f3f4f6',
    buttonBorder: '#d0d7de',
    buttonText: '#24292f',
    buttonPrimary: '#2da44e',
    buttonPrimaryHover: '#2c974b',

    // 状态指示
    success: '#1a7f37',
    successBackground: '#dafbe1',
    error: '#cf222e',
    errorBackground: '#ffebe9',

    // JSON 语法高亮
    syntaxString: '#0a3069',
    syntaxNumber: '#0969da',
    syntaxBoolean: '#8250df',
    syntaxNull: '#656d76',
    syntaxKey: '#0969da',
    syntaxBracket: '#24292f',

    // 滚动条
    scrollbarTrack: '#f6f8fa',
    scrollbarThumb: '#d0d7de',
    scrollbarThumbHover: '#afb8c1',

    // 悬停效果
    hoverBackground: '#f6f8fa',

    // 缩进线
    indentLine: '#d0d7de'
  }
}

/**
 * GitHub Dark 主题配置
 */
export const githubDarkTheme: ThemeConfig = {
  name: 'github-dark',
  colors: {
    // 背景色
    background: '#0d1117',
    surfaceBackground: '#161b22',

    // 边框色
    border: '#30363d',

    // 文本色
    text: '#e6edf3',
    textSecondary: '#7d8590',

    // 按钮样式
    buttonBackground: '#21262d',
    buttonBackgroundHover: '#30363d',
    buttonBorder: '#30363d',
    buttonText: '#e6edf3',
    buttonPrimary: '#238636',
    buttonPrimaryHover: '#2ea043',

    // 状态指示
    success: '#3fb950',
    successBackground: '#0f2419',
    error: '#f85149',
    errorBackground: '#381921',

    // JSON 语法高亮
    syntaxString: '#a5d6ff',
    syntaxNumber: '#79c0ff',
    syntaxBoolean: '#d2a8ff',
    syntaxNull: '#7d8590',
    syntaxKey: '#79c0ff',
    syntaxBracket: '#e6edf3',

    // 滚动条
    scrollbarTrack: '#161b22',
    scrollbarThumb: '#30363d',
    scrollbarThumbHover: '#6e7681',

    // 悬停效果
    hoverBackground: '#161b22',

    // 缩进线
    indentLine: '#30363d'
  }
}

/**
 * Min Light 主题配置 - 极简浅色主题
 */
export const minLightTheme: ThemeConfig = {
  name: 'min-light',
  colors: {
    // 背景色 - 纯白简洁
    background: '#ffffff',
    surfaceBackground: '#fafafa',

    // 边框色 - 极浅灰
    border: '#e5e5e5',

    // 文本色 - 深灰而非纯黑
    text: '#333333',
    textSecondary: '#888888',

    // 按钮样式 - 简约设计
    buttonBackground: '#f8f8f8',
    buttonBackgroundHover: '#eeeeee',
    buttonBorder: '#e0e0e0',
    buttonText: '#333333',
    buttonPrimary: '#007acc',
    buttonPrimaryHover: '#005a9e',

    // 状态指示 - 柔和色彩
    success: '#22c55e',
    successBackground: '#f0fdf4',
    error: '#ef4444',
    errorBackground: '#fef2f2',

    // JSON 语法高亮 - 简约配色
    syntaxString: '#22c55e',
    syntaxNumber: '#3b82f6',
    syntaxBoolean: '#8b5cf6',
    syntaxNull: '#6b7280',
    syntaxKey: '#1f2937',
    syntaxBracket: '#374151',

    // 滚动条 - 极简
    scrollbarTrack: '#f5f5f5',
    scrollbarThumb: '#d1d5db',
    scrollbarThumbHover: '#9ca3af',

    // 悬停效果
    hoverBackground: '#f9f9f9',

    // 缩进线
    indentLine: '#e5e7eb'
  }
}

/**
 * Slack Ochin 主题配置 - 温暖橙色主题
 */
export const slackOchinTheme: ThemeConfig = {
  name: 'slack-ochin',
  colors: {
    // 背景色 - 温暖的米色调
    background: '#fefbf6',
    surfaceBackground: '#faf6f0',

    // 边框色 - 暖橙色调
    border: '#e8d5b7',

    // 文本色 - 深棕色
    text: '#4a3b2a',
    textSecondary: '#8b7355',

    // 按钮样式 - Slack 风格橙色
    buttonBackground: '#f4ede4',
    buttonBackgroundHover: '#efe5d8',
    buttonBorder: '#e8d5b7',
    buttonText: '#4a3b2a',
    buttonPrimary: '#ff6b35',
    buttonPrimaryHover: '#e55a2b',

    // 状态指示 - 暖色调
    success: '#ff9500',
    successBackground: '#fff8f0',
    error: '#d73502',
    errorBackground: '#ffeee8',

    // JSON 语法高亮 - 温暖配色
    syntaxString: '#d73502',
    syntaxNumber: '#ff6b35',
    syntaxBoolean: '#b7472a',
    syntaxNull: '#8b7355',
    syntaxKey: '#4a3b2a',
    syntaxBracket: '#6b5444',

    // 滚动条 - 暖色调
    scrollbarTrack: '#f4ede4',
    scrollbarThumb: '#e8d5b7',
    scrollbarThumbHover: '#d4c4a8',

    // 悬停效果
    hoverBackground: '#f8f2eb',

    // 缩进线
    indentLine: '#e8d5b7'
  }
}

/**
 * 预定义主题集合
 */
export const themes: Record<ThemeType, ThemeConfig> = {
  'github-light': githubLightTheme,
  'github-dark': githubDarkTheme,
  'min-light': minLightTheme,
  'slack-ochin': slackOchinTheme
}

/**
 * 获取主题配置
 */
export function getTheme(theme: ThemeType = 'github-light'): ThemeConfig {
  return themes[theme] || githubLightTheme
}

/**
 * 获取所有可用主题名称
 */
export function getAvailableThemes(): ThemeType[] {
  return Object.keys(themes) as ThemeType[]
}
