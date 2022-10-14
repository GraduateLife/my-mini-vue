import {
    getCurrentInstance,
    h,
    ref,
    nextTick
} from '../../lib/mini-vue.esm.js'
//before:update element for 100 times
export const App = {
    render() {
        return h('div', {
            onClick: this.updateCount
        }, `current count is:    ${this.count}`)
    },
    setup() {
        const count = ref(0)
        const ci = getCurrentInstance()
        const updateCount = () => {
            //sync function
            while (count.value < 100) {
                count.value++
            }
            // debugger
            console.log(ci.vnode.el.innerHTML) //expect 0
            // debugger
            nextTick(() => {
                console.log(ci.vnode.el.innerHTML) //expect 100
            })
        }
        return {
            count,
            updateCount
        }
    }
}