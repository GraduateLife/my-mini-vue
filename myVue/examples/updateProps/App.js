import {
    h,
    ref
} from '../../lib/mini-vue.esm.js'

export const App = {
    render() {
        return h('div', {
                ...this.msg
            },
            [
                //在此时触发相应式对象的get（track），把effect包围的函数扔进set
                //渲染vnode的函数在此时被扔进， in setupRenderEffect，renderer.ts
                h('button', {
                    onClick: this.changeMsg1
                }, 'change msg1'),
                h('button', {
                    onClick: this.resetMsg1
                }, 'remove msg1'),
                h('button', {
                    onClick: this.removeMsg2
                }, 'remove msg2')

            ]
        )
    },
    setup() {
        const msg = ref({
            msg1: 'this is msg1',
            msg2: 'this is msg2'
        })
        const changeMsg1 = () => {
            if (msg.value.msg1) {
                msg.value.msg1 = 'new!  ' + msg.value.msg1
            }

        }
        //reset msg1 to undefined
        const resetMsg1 = () => {
            msg.value.msg1 = undefined;
        }
        //remove msg2 by overwrite msg ref exclude msg2
        const removeMsg2 = () => {
            msg.value = {
                msg1: 'this is msg1'
            }
        }

        return {
            msg,
            changeMsg1,
            resetMsg1,
            removeMsg2

        }
    }
}