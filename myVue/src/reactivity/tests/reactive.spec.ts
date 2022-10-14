import { isProxy, isReactive, isReadonly, reactive } from "../reactive";
describe("reactive", () => {
	it("happy path", () => {
		const rawObj = { baz: 1 };
		const recObj = reactive(rawObj);
		//expect a raw object becomes reactive
		expect(recObj).not.toBe(rawObj);
		//expect a reactive object reserves data from its original object
		expect(recObj.baz).toBe(1);
		expect(isReactive(recObj)).toBe(true);
		expect(isReactive(rawObj)).toBe(false);
		expect(isReadonly(recObj)).toBe(false);

		expect(isProxy(recObj)).toBe(true);
	});
	it("nested reactive case", () => {
		const nestedRec = reactive({
			dof: 10,
			foe: [{ foc: 12 }],
			fiz: { aor: 30 },
		});
		expect(isReactive(nestedRec)).toBe(true);
		expect(isReactive(nestedRec.foe[0])).toBe(true);
		expect(isReactive(nestedRec.fiz)).toBe(true);
	});
});
