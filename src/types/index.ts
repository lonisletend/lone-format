// 导出所有类型定义
export * from './components'

// 导出组件类型
declare module 'vue' {
  interface GlobalComponents {
    JsonFormat: typeof import('../components/JsonFormat/index.vue')['default']
  }
}
