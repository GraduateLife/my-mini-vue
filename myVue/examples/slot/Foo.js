import {
    h,
    renderSlots
} from '../../lib/mini-vue.esm.js'

export const Foo = {
    render() {
        const para = h('p', {}, 'fooooooo')
        console.log(this.$slots)
        // return h('div', {}, [para, h('div', {}, this.$slots)]) //<=只要把App组件的写的关于Foo组件的子内容追加到这里的数组就行了
        //$slot作为占位符
        const param = 1000
        return h('div', {
            class: 'test'
        }, [
            renderSlots(this.$slots, 'firstSlot', param),
            para,
            renderSlots(this.$slots, 'secondSlot'),
        ])
    },
    setup() {
        return {}
    }
}