import {
    h,
    createTextVNode
} from '../../lib/mini-vue.esm.js'
import {
    Foo
} from './Foo.js'

export const App = {

    render() {
        const AppDiv = h('div', {}, 'APP')

        const FooComp = h(Foo, {}, {
            firstSlot: (param) => h('p', {}, 'this is slot1+' + param + 1),
            secondSlot: () => [
                h('p', {}, 'this is slot2'),
                h('p', {}, 'this is also slot2'),
                createTextVNode('TEXT NODE')
            ]
        })
        return h('div', {}, [AppDiv, FooComp])
    },
    setup() {
        return {}
    }
}