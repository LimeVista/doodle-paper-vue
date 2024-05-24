import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import DoodlePaperVue from '@/packages'

const app = createApp(App)

app.use(DoodlePaperVue)

app.mount('#app')
