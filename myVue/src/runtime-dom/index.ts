import { customizeRenderer } from "../runtime-core";

//创建dom元素
function createElement(elementType) {
	return document.createElement(elementType);
}
//设置一个属性
function setElementAttribute(
	element,
	attributeName,
	prevAttributeVal,
	currentAttributeVal
) {
	const isEvent = (x) => /^on[A-Z]/.test(x);
	if (isEvent(attributeName)) {
		const event = attributeName.slice(2).toLowerCase();
		element.addEventListener(event, currentAttributeVal);
	} else {
		if (currentAttributeVal === null || currentAttributeVal === undefined) {
			element.removeAttribute(attributeName);
		} else {
			element.setAttribute(attributeName, currentAttributeVal);
		}
	}
}
//将元素加入视图
function insertElement(element, container, anchor = null) {
	// container.append(element);
	//extra, have to specify the position of new element need to be inserted for update
	container.insertBefore(element, anchor);
}

//移除一个元素
function removeElement(element) {
	const container = element.parentNode;
	if (container) {
		container.removeChild(element);
	}
}
//修改元素内部的文字
function setElementText(element, text) {
	element.textContent = text;
}

const domRendererOptions = {
	createElement,
	setElementAttribute,
	insertElement,
	removeElement,
	setElementText,
};

const domRenderer = customizeRenderer(domRendererOptions) as any;
//正如在renderer.ts最后讲的，因此需要封装一下
export function createApp(...args) {
	return domRenderer._createApp(...args);
}

export * from "../runtime-core";
