import {
    h,
    ref
} from '../../lib/mini-vue.esm.js'
//3 cases:
//1. New array is shorter than old array (deleted)
//1-1. Delete old elements on the left
//1-2. Delete old elements on the right
//2. New array is longer than old array (created)
//2-1. Create new elements on the left
//2-2. Create new elements on the right
//3. Have identical length but different orders or elements(changed)<<<leave it to next example
//3-1 New elements need to be created (in the middle)
//3-2 Old elements need to be deleted (in the middle)
//3-3 Change order of old array

//Q:    Why we think add/delete elements on both sides and in the middle are 2 different cases?
//A:    For html, elements in the middle are changed most frequently since in most of cases they are rounded by div.container 

//0,1,2,  3, 4
//A,B,C
//A,B,C,(XX,YY)
//i   e1    e2
const shortArray = [
    h('p', {
        hash: 'A'
    }, 'A'),
    h('p', {
        hash: 'B'
    }, 'B'),
    h('p', {
        hash: 'C'
    }, 'C'),
]
const longArrayOnRight = [
    h('p', {
        hash: 'A'
    }, 'A'),
    h('p', {
        hash: 'B'
    }, 'B'),
    h('p', {
        hash: 'C'
    }, 'C'),
    h('p', {
        hash: 'XX'
    }, 'XX'),
    h('p', {
        hash: 'YY'
    }, 'YY'),
]
// 0,  1, 2,3,4
// A,  B, C
//(XX,YY),A,B,C
//i   e2
//e1=-1 since undefined!==YY

const longArrayOnLeft = [
    h('p', {
        hash: 'XX'
    }, 'XX'),
    h('p', {
        hash: 'YY'
    }, 'YY'),
    h('p', {
        hash: 'A'
    }, 'A'),
    h('p', {
        hash: 'B'
    }, 'B'),
    h('p', {
        hash: 'C'
    }, 'C'),
]









const Array2Array = {
    render() {
        return (this.isChanged === true ?
            h('div', {}, longArrayOnLeft) :
            h('div', {}, shortArray))
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