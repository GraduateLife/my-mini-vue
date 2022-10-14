import { isObject } from "../shared/index";
import {
	reactiveHandler,
	readonlyHandler,
	shallowReadonlyHandler,
} from "./baseHandlers";
export enum ReactivityFlags { //???似乎放在这里不太合理
	__IS__REACTIVE__ = "--v--IS--THIS--REACTIVE?",
	__IS__READONLY__ = "--v--IS--THIS--READONLY?",
}

export function reactive(rawObj) {
	return createProxy(rawObj, reactiveHandler);
}
export function readonly(rawObj) {
	return createProxy(rawObj, readonlyHandler);
}

export function shallowReadonly(rawObj) {
	return createProxy(rawObj, shallowReadonlyHandler);
}
function createProxy(input, proxyHandler) {
	if (!isObject(input)) {
		console.warn(
			`Reactive Objects cannot be created if input is not an object, please check ${input}`
		);
		return input;
	}
	return new Proxy(input, proxyHandler);
}

/* LOG
!!也会把undefined转成false来避免不存在的情况，学到了
*/
export function isReactive(obj): boolean {
	return !!obj[ReactivityFlags.__IS__REACTIVE__];
}
export function isReadonly(obj): boolean {
	return !!obj[ReactivityFlags.__IS__READONLY__];
}

export function isProxy(obj) {
	return isReactive(obj) || isReadonly(obj);
}
