//我觉得vue的参数声明有点疑惑性，所以我会用我自己的变量名
import { isObject } from "../shared/index";
import { Shapes } from "./Shapes";

export const FRAGMENT = Symbol("FRAGMENT");
export const TEXT = Symbol("TEXT");
export { createVNode as createElementNode };

export function createVNode(family, attributes?, content?) {
	const vnode = {
		family,
		attributes,
		content,
		shape: getShape(family), //提高查询family的效率，非核心逻辑
		el: null, //由于vue3依然可用vue2语法，依然需要加上公共属性，尽管vue本体的实例已经不存在了
		hash: attributes?.hash,
		instance: null,
	};

	//add shape flags based on vnode children
	if (typeof vnode.content === "string") {
		vnode.shape |= Shapes.TEXT_CHILD;
	} else if (Array.isArray(vnode.content)) {
		vnode.shape |= Shapes.ARRAY_CHILDREN;
	} else if (isObject(vnode.content)) {
		vnode.shape |= Shapes.OBJECT_CHILDREN;
	}

	return vnode;
}
export function createTextVNode(text: string) {
	return createVNode(TEXT, {}, text);
}

function getShape(family) {
	return isObject(family) ? Shapes.STATEFUL_COMPONENT : Shapes.ELEMENT;
}
