import {
    ref
} from '../../lib/mini-vue.esm.js'

export const App = {
    template: `<div>hi,{{message}}</div>`,
    setup() {
        return {
            message: 'mini-vue'
        }
    }
}