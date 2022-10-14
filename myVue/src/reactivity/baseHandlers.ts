import { isObject } from "../shared/index";
import { track, trigger } from "./effect";
import { reactive, ReactivityFlags, readonly } from "./reactive";

//由于一共就四种，所以希望一开始就创建好然后用现成的就行了
const _createGetter = createGetter(true);
const _createSetter = createSetter();
const _createROGetter = createGetter(false);
const _createSROGetter = createGetter(false, true);

function createGetter(isReactive: boolean, isShallow: boolean = false) {
	return function (target, key) {
		//##偏函数，根据是响应式设置创建对应getter和setter

		//##判断响应式等级（姑且这么称呼）就是访问一个已经预设好的键，返回偏函数的预先设置
		if (key === ReactivityFlags.__IS__REACTIVE__) {
			return isReactive;
			/*  LOG
            他如果是只读那isReactive当然是false啊，isReadonly是true没毛病，我怎么会在这里卡住的。。。
        */
		} else if (key === ReactivityFlags.__IS__READONLY__) {
			return !isReactive;
		}

		const res = Reflect.get(target, key);
		if (isObject(res)) {
			//##一般情况下会将内部所有属性（复杂类型）转为响应式
			return isReactive ? reactive(res) : readonly(res);
		}
		if (isReactive) {
			track(target, key);
		} //##如果是只读对象，不track
		if (isShallow) {
			return res;
		} //##如果是浅响应，里面的内容交给反射就行，不用转响应式
		return res;
	};
}
function createSetter() {
	return function (target, key, value) {
		const res = Reflect.set(target, key, value);
		trigger(target, key);
		return res;
	};
}

export const reactiveHandler = {
	get: _createGetter,
	set: _createSetter,
};
export const readonlyHandler = {
	get: _createROGetter,
	set(target, key, value) {
		console.warn(
			`you are trying to change a readonly property: ${key} to ${value}`
		);
		return true;
	},
};

export const shallowReadonlyHandler = Object.assign({}, readonlyHandler, {
	get: _createSROGetter,
});
