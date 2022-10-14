import { createVNode } from "./vnode";
//h as alias of createVNode
export function h(type: any, attributes?: any, content?: any) {
	return createVNode(type, attributes, content);
}
