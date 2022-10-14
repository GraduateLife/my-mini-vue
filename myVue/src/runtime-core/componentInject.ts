import { getCurrentInstance } from "./component";

export function provide(provideKey, provideVal) {
	const currentInstance = getCurrentInstance();
	if (currentInstance) {
		const parentProvides = currentInstance.parentInstance.provides;
		//当一个instance刚刚被生成时, provides: parentInstance ? parentInstance.provides : {} in component.ts
		//当直接===时，即他俩的地址也变成一样的了，变一个属性他俩都会变
		if (currentInstance.provides === parentProvides) {
			//因此只是作为判断条件，需要额外处理
			//我们希望当前实例的provide的原型上是父亲实例的provide，因此增加一个具有相同名字的属性的值不会覆盖原有的值
			let chainedProvides = Object.create(parentProvides);
			Object.assign(chainedProvides, currentInstance.provides);
			currentInstance.provides = chainedProvides;
		}
		/*
		本来： 
		in parentProvide， val：oldVal
		in currentProvide， val:newVal	<<==在这个瞬间！
		由于两家伙地址是一样的，parentProvide.val=newVal
		现在：
		in currentProvide， val:newVal， 与此同时，in currentProvide.prototype（aka parentProvide）,	 val：oldVal
		虽然没找到任何资料，但我觉得对象和他的原型100%不是一个地址！
		*/

		currentInstance.provides[provideKey] = provideVal;
	}
}

export function inject(provideKey) {
	const currentInstance = getCurrentInstance();
	if (currentInstance) {
		const { parentInstance } = currentInstance;
		return parentInstance.provides[provideKey];
	}
}
