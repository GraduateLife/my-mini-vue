import {
    h,
    provide,
    inject
} from '../../lib/mini-vue.esm.js'

const GrandFather = {
    compoName: 'grandFather',
    render() {
        return h('div', {}, [h('p', {}, 'GrandFather'), h(Father)])
    },
    setup() {
        provide('stuff1', 'grandfather1')
        provide('stuff2', 'grandfather2')
        provide('gift', 'grandfather3')
    }
}

const Father = {
    compoName: 'Father',
    render() {
        return h('div', {}, [h('p', {}, `Father:from father's father:   ${this.stuff1},   ${this.stuff2},  ${this.gift}`), h(Son)])
    },
    //expect all things from grandfather
    setup() {

        provide('stuff1', 'father1')
        provide('stuff2', 'father2') //<=try to overwrite grandfather provides
        const stuff1 = inject('stuff1')
        const stuff2 = inject('stuff2')
        const gift = inject('gift')
        return {
            stuff1,
            stuff2,
            gift
        }
    }
}
const Son = {
    compoName: 'son',
    render() {
        return h('p', {}, [
            h('p', {}, `Son:stuff from father:   ${this.stuff1},   ${this.stuff2}`),
            h('p', {}, `Son:stuff from grandfather:   ${this.stuff1},   ${this.stuff2}, ${this.gift}`),
        ])
        //expect stuff1 stuff2 from father and gift from grandfather


    },
    setup() {
        const stuff1 = inject('stuff1')
        const stuff2 = inject('stuff2')
        const gift = inject('gift')
        return {
            stuff1,
            stuff2,
            gift
        }
    }
}


export const App = { //root component

    render() {
        return h(GrandFather)
    },
    setup() {}
}