import {
    h
} from "../../lib/mini-vue.esm.js";

export const Foo = {
    setup(props) {
        console.log(props)
        props.wuhu++ //expect it doesn't work
    },
    render() {
        return h('div', {}, 'wuhu:  ' + this.wuhu)
    }
}