import { createVNode } from "./vnode";
//现在initRenderer(pullTheTrigger)是createApp的别名
export function initRenderer(pullTheTrigger: Function) {
	return function (rootComponent) {
		return {
			//createApp.mount
			mount(rootContainer) {
				//基于虚拟节点处理内容
				const rootVNode = createVNode(rootComponent);
				pullTheTrigger(rootVNode, rootContainer);
			},
		};
	};
}
