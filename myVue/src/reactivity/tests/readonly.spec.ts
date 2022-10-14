import { isProxy, isReadonly, readonly } from "../reactive"

describe('readonly',()=>{
    it('happy path',()=>{
        const rawObj={baz:1,don:{kom:10}};
        const recObj=readonly(rawObj)
        //expect a raw object becomes readonly
        expect(recObj).not.toBe(rawObj)
        //expect a reactive object reserves data from its original object
        expect(recObj.baz).toBe(1)
        expect(isReadonly(recObj)).toBe(true)
        expect(isReadonly(rawObj)).toBe(false)

        expect(isProxy(recObj)).toBe(true)
    })
    it('should not be mutable',()=>{
        const recObj=readonly({baz:1,don:{kom:10}})
        console.warn=jest.fn()
        recObj.baz++
        expect(console.warn).toBeCalled()
    })
    it('nested case',()=>{
        const nestedRo=readonly({
            dof:10,
            foe:[{foc:12}],
            fiz:{aor:30}
        })
        expect(isReadonly(nestedRo)).toBe(true)
        expect(isReadonly(nestedRo.foe[0])).toBe(true)
        expect(isReadonly(nestedRo.fiz)).toBe(true)
    })
})