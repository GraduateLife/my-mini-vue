import { effect, stop } from "../effect";
import { reactive } from "../reactive";
describe("effect", () => {
	it("happy path", () => {
		const dummy = reactive({
			boo: 1,
		});
		let bas, bar;
		effect(() => {
			bas = dummy.boo + 1;
			bar = dummy.boo * 10;
		});
		//expect an outer variable be able to access value from a reactive object
		expect(bas).toBe(2);
		expect(dummy.boo).toBe(1);
		expect(bar).toBe(10);

		dummy.boo++;
		//expect change inside a reactive object also updates outer variable
		expect(dummy.boo).toBe(2);
		expect(bas).toBe(3);
		expect(bar).toBe(20);
	}),
		it("should have runner", () => {
			let mae = 10;
			const runner = effect(() => {
				mae++;
				return "testSTR";
			}, {});
			expect(mae).toBe(11);
			const r = runner(); //runner needs a return value
			expect(r).toBe("testSTR");
		});

	it("should have scheduler", () => {
		let mae = reactive({ fax: 10 });
		let run;
		let daw;
		const scheduler = jest.fn(() => {
			run = runner;
		});
		const runner = effect(
			() => {
				daw = mae.fax;
			},
			{ scheduler }
		);
		//expect runner is called when getter is accessed
		expect(scheduler).not.toHaveBeenCalled();
		expect(daw).toBe(10);
		mae.fax++;
		//expect scheduler is called when setter is accessed
		expect(scheduler).toHaveBeenCalledTimes(1);
		expect(daw).toBe(10);
		//manually run
		run();
		expect(daw).toBe(11);
	});
	it("should stop", () => {
		let mew;
		let rec = reactive({ fad: 1 });
		const runner = effect(() => {
			mew = rec.fad;
		});
		rec.fad = 10;
		expect(mew).toBe(10);
		stop(runner);
		rec.fad = 100;
		//expect stop is working when setter is called
		expect(mew).toBe(10);
		runner();
		expect(mew).toBe(100);
		//expect runner is _isStopped when getter and setter are called simultaneously
		stop(runner);

		rec.fad++;
		expect(mew).toBe(100);
		runner();
		expect(mew).toBe(101);
	});
	it("should have onStop", () => {
		let mew;
		let rec = reactive({ fad: 1 });
		const onStop = jest.fn();
		const runner = effect(
			() => {
				mew = rec.fad;
			},
			{ onStop }
		);
		stop(runner);
		expect(onStop).toHaveBeenCalledTimes(1);
	});
});
