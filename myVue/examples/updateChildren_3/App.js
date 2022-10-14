import {
    h,
    ref
} from '../../lib/mini-vue.esm.js'

//A     B   (Xp   Y     K)   C   D
//A     B   (Xc   Z)         C   D
//update props is achieved, expect to do nothing on X update 
//expect Y K are removed
const oldArray = [
    h('p', {
        hash: 'A'
    }, 'A'),
    h('p', {
        hash: 'B'
    }, 'B'),
    h('p', {
        hash: 'XX',
        class: 'prev-x'
    }, 'XX'),
    h('p', {
        hash: 'YY'
    }, 'YY'),
    h('p', {
        hash: 'KK'
    }, 'KK'),
    h('p', {
        hash: 'C'
    }, 'C'),
    h('p', {
        hash: 'D'
    }, 'D'),

]
//updated X class and replace Z with Y
const newArray = [
    h('p', {
        hash: 'A'
    }, 'A'),
    h('p', {
        hash: 'B'
    }, 'B'),
    h('p', {
        hash: 'XX',
        class: 'curr-x'
    }, 'XX'),
    h('p', {
        hash: 'ZZ'
    }, 'ZZ'),
    h('p', {
        hash: 'C'
    }, 'C'),
    h('p', {
        hash: 'D'
    }, 'D'),
]
//expect Z moves
const ZonLeftArray = [
    h('p', {
        hash: 'A'
    }, 'A'),
    h('p', {
        hash: 'B'
    }, 'B'),
    h('p', {
        hash: 'ZZ',
    }, 'ZZ'),
    h('p', {
        hash: 'XX',
    }, 'XX'),
    h('p', {
        hash: 'YY'
    }, 'YY'),
    h('p', {
        hash: 'C'
    }, 'C'),
    h('p', {
        hash: 'D'
    }, 'D'),
]

const ZonRightArray = [
    h('p', {
        hash: 'A'
    }, 'A'),
    h('p', {
        hash: 'B'
    }, 'B'),
    h('p', {
        hash: 'XX',
    }, 'XX'),
    h('p', {
        hash: 'YY'
    }, 'YY'),
    h('p', {
        hash: 'ZZ',
    }, 'ZZ'),
    h('p', {
        hash: 'C'
    }, 'C'),
    h('p', {
        hash: 'D'
    }, 'D'),
]

//A     B   ( XX   YY   )   C   D
//A     B   (YY   XX  GG )  C   D
//expect swap X Y, create G
const prevComplexArray = [
    h('p', {
        hash: 'A'
    }, 'A'),
    h('p', {
        hash: 'B'
    }, 'B'),
    h('p', {
        hash: 'XX'
    }, 'XX'),
    h('p', {
        hash: 'YY'
    }, 'YY'),
    h('p', {
        hash: 'C'
    }, 'C'),
    h('p', {
        hash: 'D'
    }, 'D'),

]

const currComplexArray = [
    h('p', {
        hash: 'A'
    }, 'A'),
    h('p', {
        hash: 'B'
    }, 'B'),
    h('p', {
        hash: 'YY'
    }, 'YY'),
    h('p', {
        hash: 'XX'
    }, 'XX'),
    h('p', {
        hash: 'GG'
    }, 'GG'),
    h('p', {
        hash: 'C'
    }, 'F'),
    h('p', {
        hash: 'D'
    }, 'G'),
]




const Array2Array = {
    render() {
        return (this.isChanged === true ?
            h('div', {}, currComplexArray) :
            h('div', {}, prevComplexArray))
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
            h(Array2Array)
        ])

    },
    setup() {}

}