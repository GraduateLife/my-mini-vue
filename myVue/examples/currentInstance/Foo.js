import {
    h,
    getCurrentInstance
} from '../../lib/mini-vue.esm.js'
export const Foo = {

    render() {
        return h('div', {}, [h('p', {}, 'try to get foo currentInstance')])

    },
    setup() {
        const inst = getCurrentInstance()
        console.log('FOO', inst)
        return {}

    }
}