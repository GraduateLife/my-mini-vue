import {
    h
} from '../../lib/mini-vue.esm.js'
import {
    Foo
} from './Foo.js'
window.app = null
export const App = { //root component

    render() {
        return h('div', {}, [h(Foo, { //similar as element events
            onYahoo(para1, para2) { //receive emitted events,eventNames based on emitted name
                console.log('yahooooooooooo', para1, para2)
            },
            onKebabIsGood() { //test emitted names in kebab-case 
                console.log('yummy yummy')
            }
        })])
    },
    setup() {
        return {

        }
    }
}