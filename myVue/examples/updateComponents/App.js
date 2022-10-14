import {
    h,
    ref
} from '../../lib/mini-vue.esm.js'
const Child = {
    render() {
        return h('div', {}, `latest message of child component is:   ${this.$props.childMsg}`)
    },
    setup() {}
}
//before:
//a new child component is created
//app component has also been recreated even though we change its own prop (since App is a component mounted on div#app as well) 

export const App = {
    render() {
        return h('div', {}, [
            h('div', {}, `latest count of app component is:     ${this.count}`),
            h(Child, {
                childMsg: this.msg
            }),
            h('button', {
                onClick: this.changeChildMsg
            }, 'change child component message'),
            h('button', {
                onClick: this.addAppCount
            }, 'add App component count')
        ])
    },
    setup() {
        const msg = ref('child msg')
        const count = ref(0)

        window.msg = msg
        const changeChildMsg = () => {
            msg.value = 'new ' + msg.value
        }
        const addAppCount = () => {
            count.value++
        }

        return {
            msg,
            count,
            changeChildMsg,
            addAppCount
        }
    }
}