import type { App } from 'vue'
import DoodlePaper from './DoodlePaper.vue'

DoodlePaper.install = (app: App) => app.component(DoodlePaper.name as string, DoodlePaper)

export default DoodlePaper