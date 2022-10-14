import { shallowReadonly } from "../reactivity/reactive";
import { isObject } from "../shared/index";
import { componentEmit } from "./componentEmit";
import { initProps } from "./componentProps";
import { PublicInstanceProxyHandler } from "./componentInstanceProxyHandler";
import { initSlots } from "./componentSlots";
import { proxyRef } from "../reactivity";
import { baseCompile } from "../compiler-core/baseCompile";

let g_currentInstance: any = null;

export function createComponentInstance(vnode: any, parentInstance) {
	const instance = {
		vnode, //current vnode in mount logic,previous vnode in update logic
		setupState: {}, //用于接收setup（）的返回值以及公共属性
		proxy: {}, //在handleSetupRes中被赋值，使render可以接收setup的返回值
		props: {}, //对应元素的属性
		slots: {}, //对应元素的子内容
		emit: () => {}, //对应元素的属性（会做是否是事件的检查）
		provides: parentInstance ? parentInstance.provides : {}, //复制父亲组件的provide
		parentInstance, //父亲组件公共对象的引用（临时挂载）
		isMounted: false,
		currentVNode: null,
		reCreateVNode: () => {},
	};
	instance.emit = componentEmit.bind(null, instance) as any; //先传入第一个参数，这样用户不必传入有emit的组件了
	return instance;
}
export function setupComponent(instance) {
	initProps(instance, instance.vnode.attributes);
	initSlots(instance, instance.vnode.content);

	setupStatefulComponent(instance);
}

function setupStatefulComponent(instance) {
	instance.proxy = new Proxy(
		{ whatever: instance },
		PublicInstanceProxyHandler
	);
	const { setup } = instance.vnode.family;
	if (setup) {
		//如果用户写了setup
		setCurrentInstance(instance);
		const setupRes = setup(shallowReadonly(instance.props), {
			emit: instance.emit,
		}); //因为绝大部分时间prop都是基本类型
		handleSetupRes(instance, setupRes);
	}
	g_currentInstance = null;
}
function handleSetupRes(instance, setupRes: any) {
	if (isObject(setupRes)) {
		instance.setupState = proxyRef(setupRes);
	}
	finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
	const componentObj = instance.vnode.family;
	if (g_renderFunction && !componentObj.render) {
		console.log("received render", g_renderFunction);
		if (componentObj.template) {
			instance.render = g_renderFunction(componentObj.template);
		}
	} else {
		console.log("other cases");
		instance.render = componentObj.render;
	}

	//##目前我们假设render函数里一定有值
	// if (component.render) {
	// 	instance.render = component.render;
	// }
}

export function getCurrentInstance() {
	return g_currentInstance;
}

function setCurrentInstance(something) {
	g_currentInstance = something;
}

let g_renderFunction;
export function receiveRenderFunction(something) {
	g_renderFunction = something;
}
