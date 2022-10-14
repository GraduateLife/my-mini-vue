import {
    h,
    ref
} from '../../lib/mini-vue.esm.js'

// 4 cases in children update:
//1. text ->text(√)
//2. text ->array(√)
//3. array ->text(√)
//4. array ->array   <<<diff algorithm(leave it to next part)


const ArrayChild = [h('div', {}, 'arrayChild 1'), h('div', {}, 'arrayChild 2')]
const OldTextChild = 'old text child'
const NewTextChild = 'new text child'

const Array2Text = {
    render() {
        return (this.isChanged === true ? h('div', {}, NewTextChild) : h('div', {}, ArrayChild))
    },
    setup() {
        const isChanged = ref(false)
        window.isChanged = isChanged
        return {
            isChanged
        }

    }
}

const Text2Text = {
    render() {
        return this.isChanged === true ? h('div', {}, NewTextChild) : h('div', {}, OldTextChild)
    },
    setup() {
        const isChanged = ref(false)
        window.isChanged = isChanged
        return {
            isChanged
        }

    }
}

const Text2Array = {
    render() {
        return this.isChanged === true ? h('div', {}, ArrayChild) : h('div', {}, OldTextChild)
    },
    setup() {
        const isChanged = ref(false)
        window.isChanged = isChanged
        return {
            isChanged
        }

    }
}




export const App = {
    render() {
        return h('div', {}, [
            // h(Array2Text),
            // h(Text2Text),
            h(Text2Array)

        ])

    },
    setup() {}

}