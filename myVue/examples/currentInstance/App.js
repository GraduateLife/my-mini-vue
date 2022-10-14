import {
    h,
    getCurrentInstance
} from '../../lib/mini-vue.esm.js'
import {
    Foo
} from './Foo.js'
export const App = { //root component
    render() {

        return h('div', {}, [h('p', {}, 'try to get app currentInstance'), h(Foo)])

    },
    setup() {
        const inst = getCurrentInstance()
        console.log('APP', inst)
        return {}

    }
}