import type { App } from 'vue'
import { JsonFormat } from './components'

const components = [JsonFormat]

const install = (app: App): void => {
  components.forEach((component) => {
    const name = component.name || (component as any).__name || 'UnknownComponent'
    app.component(name, component)
  })
}

export default {
  install
}

export * from './components'
