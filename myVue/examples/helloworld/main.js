//与vue3的main.js文件一样,作为入口文件
import {
    createApp
} from '../../lib/mini-vue.esm.js'
import {
    App
} from './App.js'
//注意这里的引入是浏览器引入不是node引入，所以名字要写全
const rootContainer = document.querySelector('#app')
createApp(App).mount(rootContainer)