import { Shapes } from "./Shapes";

export function initSlots(instance, rawSlotObj) {
	//其实就干了一件事情，把组件的slot儿子扔到公有对象统一管理，外加套了层Array的壳
	if (instance.vnode.shape & Shapes.OBJECT_CHILDREN) {
		addSlots(rawSlotObj, instance.slots);
	}
}
function addSlots(input: Object, output: Object) {
	for (const name in input) {
		output[name] = (scopes) => handleOnlyChild(input[name](scopes));
	}
}

function handleOnlyChild(slotChildren) {
	//to handle arbitrary number of h() in one slot
	//since h()innercontent only supports Array of h() instead of just another h()
	return Array.isArray(slotChildren) ? slotChildren : [slotChildren];
}
