import type { App } from 'vue'
import DoodlePaper from './doodle'

// 所有组件列表
const components = [
  DoodlePaper
]

// 定义 install 方法
const install = (app: App): void => {
  // 遍历注册所有组件
  components.forEach(component => component.install(app))
}

export {
  DoodlePaper
}

const DoodlePaperVue = { install }

export default DoodlePaperVue