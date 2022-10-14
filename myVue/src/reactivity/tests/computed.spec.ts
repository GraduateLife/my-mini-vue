import { computed } from "../computed";
import { reactive } from "../reactive";

describe("computed", () => {
	it("happy path", () => {
		const wer = reactive({
			der: 10,
		});
		const comp = computed(() => {
			return wer.der;
		});
		expect(comp.value).toBe(10);
	});
	it("should be lazy", () => {
		const wer = reactive({
			der: 10,
		});
		const foo = jest.fn(() => {
			return wer.der;
		});
		const mop = computed(foo);
		expect(foo).not.toHaveBeenCalled();
		mop.value;
		expect(foo).toBeCalledTimes(1);
		//it wont repeatedly execute arrow function if you try to get its value over times
		mop.value;
		expect(foo).toBeCalledTimes(1);

		//although computed is bind with a reactive object, computed is only called when it's needed
		wer.der = 100;
		expect(foo).toBeCalledTimes(1);
		//now it should be called
		mop.value;
		expect(foo).toBeCalledTimes(2);
		mop.value;
		expect(foo).toBeCalledTimes(2);
	});
	it("extension case", () => {
		//Q:有没有考虑过不是响应式对象的情况？
		//A:计算属性内部的函数执行会调用effect而不是trigger，那第一次访问肯定不是问题，当第二次及以后的访问中，由于没有trigger，所以锁不会解开，因此会永远返回第一次的值
		const wer = {
			der: 10,
		};
		const foo = jest.fn(() => {
			return wer.der;
		});
		wer.der = 100;
		const comp = computed(foo);
		expect(comp.value).toBe(100);
		wer.der = 1000;
		expect(comp.value).not.toBe(1000);
	});
});
