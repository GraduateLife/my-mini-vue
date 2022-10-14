import { isChanged, isObject } from "../shared/index";
import {
	activateDependency,
	addDependency,
	isDirectlyAccessed,
} from "./effect";
import { reactive } from "./reactive";

class RefImpl {
	private _input: any;
	public valueDep: Set<typeof this._input>;
	private _rawInput: typeof this._input; //##如果输入一个对象，我们希望与生对象比较而不是响应式的
	public readonly __IS__REF__ = true;
	constructor(input: any) {
		this._rawInput = input;
		this._input = isObject(input) ? reactive(input) : input;
		this.valueDep = new Set();
	}
	get value() {
		if (!isDirectlyAccessed()) {
			addDependency(this.valueDep);
		}

		return this._input;
	}
	set value(newVal) {
		if (isChanged(newVal, this._rawInput)) {
			this._rawInput = newVal;
			this._input = isObject(newVal) ? reactive(newVal) : newVal;
			activateDependency(this.valueDep);
		}
	}
}

export function ref(input: any): RefImpl {
	return new RefImpl(input);
}
export function isRef(input) {
	return !!input.__IS__REF__;
}

export function unRef(input) {
	//##去除最后一层.value,就是说unref后无所谓ref的还是普通的
	return isRef(input) ? input.value : input;
}
// expect(proxied.v).toBe(30);
//##也就是说，当你想给一个proxyref 设置值的时候，你给他一个普通类型，
// expect(ref.v.value).toBe(30);
export function proxyRef(obj) {
	return new Proxy(obj, {
		get(target, key) {
			return unRef(Reflect.get(target, key));
		},
		set(target, key, newVal) {
			//##生对象的属性是ref然而你想给他一个普通类型时，直接修改属性的.value
			if (isRef(target[key]) && !isRef(newVal)) {
				return (target[key].value = newVal);
			} else {
				//##生对象的属性是ref然而你想给他一个ref类型时,直接改成新的ref就行了
				return Reflect.set(target, key, newVal);
			}
		},
	});
}
