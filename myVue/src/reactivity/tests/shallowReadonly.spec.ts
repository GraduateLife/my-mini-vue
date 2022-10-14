import { isProxy, isReactive, isReadonly, shallowReadonly } from "../reactive";
describe('shallowReadonly',()=>{
    it('should only be readonly in the outer shell',()=>{
        const rawObj={
            baz:1,
            don:{kom:10}
        };
        const recObj=shallowReadonly(rawObj)
        //expect a raw object becomes readonly
        expect(recObj).not.toBe(rawObj)
        //expect a reactive object reserves data from its original object
        expect(isReadonly(recObj)).toBe(true)
        expect(isReadonly(recObj.baz)).toBe(false)
        expect(isReactive(recObj.baz)).toBe(false)
        console.warn=jest.fn()
        recObj.baz++
        expect(console.warn).toBeCalled()

        expect(isProxy(recObj)).toBe(true)


    })

})
