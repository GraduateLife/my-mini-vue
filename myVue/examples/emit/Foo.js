import {
    h
} from "../../lib/mini-vue.esm.js";

export const Foo = {

    render() {
        const btn = h('button', {
                onClick: this.emitBtn
            },
            'emit test'
        )
        return btn
    },
    setup(whatever, {
        emit
    }) {
        const emitBtn = () => {
            console.log('button emitted')
            emit('yahoo', 10, 20)
            emit('kebab-is-good')
        }
        return {
            emitBtn
        }
    },
}