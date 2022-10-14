//与vue3的main.js文件一样,作为入口文件
import {
    createApp
} from '../../lib/mini-vue.esm.js'
import {
    App
} from './App.js'
const rootContainer = document.querySelector('#app')
createApp(App).mount(rootContainer)