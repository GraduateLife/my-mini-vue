import { createVNode, FRAGMENT } from "../vnode";
export function renderSlots(slots, slotName, slotScopes) {
	if (slots[slotName]) {
		if (typeof slots[slotName] === "function") {
			//你会发现需要有一个元素将其包裹来作为元素类型,但是其实我们只需要渲染他的儿子
			return createVNode(FRAGMENT, {}, slots[slotName](slotScopes));
		}
	}
}
