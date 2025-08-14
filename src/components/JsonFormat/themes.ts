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
 * 预定义主题集合
 */
export const themes: Record<ThemeType, ThemeConfig> = {
  'github-light': githubLightTheme,
  'github-dark': githubDarkTheme
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
