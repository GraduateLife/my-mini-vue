//App.vue
import {
    h
} from '../../lib/mini-vue.esm.js'
import {
    Foo
} from './Foo.js'
export const App = {
    //目前不实现template标签，因为template实际上会转换为render（）
    render() {
        const that = this
        //h函数是createVNode的别名
        return h('div', {
                id: 'yan',
                class: ['dian', 'zi'],
                onClick() { // event test
                    console.log('clicked', that.$el)

                }
            },
            [ //nested elements test
                h('p', {
                        class: 'red'
                    },
                    'red'),
                h('p', {
                        class: 'blue'
                    },
                    this.msg), // read setup result test
                h(Foo, { //prop test
                    wuhu: 15 //give value to prop(prop name defined in Foo.js)
                }) //object vnodes don't have innercontent
            ],
        )
    },
    setup() {
        return {
            msg: 'this is an msg from setup'
        }
    }
}