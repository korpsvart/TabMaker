import { createApp } from 'vue'
import App from './App.vue'

import './assets/base.css'
import Notifications from '@kyvg/vue3-notification'

const app = createApp(App)
app.use(Notifications)
// test
app.mount('#app')
