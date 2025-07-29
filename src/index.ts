import type { App } from 'vue'
import DemoFormat from './components/DemoFormat/index.vue'
import JsonFormat from './components/JsonFormat/index.vue'

// 单个组件导出
export { DemoFormat, JsonFormat }

// 所有组件列表
const components = [DemoFormat, JsonFormat]

// 定义 install 方法，接收 Vue 实例作为参数
const install = (app: App): void => {
  components.forEach((component) => {
    const name = component.name || component.__name || 'UnknownComponent'
    app.component(name, component)
  })
}

// 默认导出插件对象
export default {
  install,
  ...components
}

// 支持按需加载，导出所有组件
export * from './components'
