import { effect } from "../effect";
import { isRef, proxyRef, ref, unRef } from "../ref";

describe("ref", () => {
	it("happy path", () => {
		const basic = ref(10);
		expect(basic.value).toBe(10);
	});

	it("should be reactive", () => {
		const basic = ref(10);
		let calls = 0;
		let waw;
		effect(() => {
			calls++;
			waw = basic.value;
		});
		expect(calls).toBe(1);
		expect(waw).toBe(10);

		basic.value = 100;
		expect(calls).toBe(2);
		expect(waw).toBe(100);

		basic.value = 100;
		expect(calls).toBe(2);
		expect(waw).toBe(100);
	});
	it("object case", () => {
		let doo;
		const nestedRec = ref({
			dof: 10,
			foe: [{ foc: 12 }],
			fiz: { aor: 30 },
		});
		effect(() => {
			doo = nestedRec.value.dof; //Q:vue里是这样的吗 A:是的
		});
		expect(doo).toBe(10);
		nestedRec.value.dof = 100;
		expect(doo).toBe(100);
	});
	it("isRef", () => {
		let da = 1;
		const dao = ref(da);
		expect(isRef(da)).toBe(false);
		expect(isRef(dao)).toBe(true);
	});
	it("unRef", () => {
		let da = 1;
		const dao = ref(da);
		expect(unRef(da)).toBe(1);
		expect(unRef(dao)).toBe(1);
	});
	it("proxyRef", () => {
		const doo = {
			aew: 10,
			fer: ref(12),
		};
		const foo = proxyRef(doo);
		expect(doo.fer.value).toBe(12);
		expect(foo.fer).toBe(12);
		expect(foo.aew).toBe(10);

		foo.fer = 30;
		expect(foo.fer).toBe(30);
		expect(doo.fer.value).toBe(30);

		foo.fer = ref(100);
		expect(foo.fer).toBe(100);
		expect(doo.fer.value).toBe(100);
	});
});
