import { hasProperty } from "../shared/index";
//公共属性
const PublicPropertiesMap = {
	$el: (somewhat) => {
		return somewhat.vnode.el;
	}, //返回vue容器挂载的位置，也就是树根的真实元素

	$slots: (somewhat) => {
		return somewhat.slots;
	}, //返回当前实例的插槽
	$props: (somewhat) => {
		return somewhat.props;
	},
};

export const PublicInstanceProxyHandler = {
	get({ whatever: instance }, key) {
		const { setupState, props } = instance;
		//访问setup函数返回值对象的值
		if (hasProperty(setupState, key)) {
			return setupState[key];
		}
		if (hasProperty(props, key)) {
			//访问组件prop的值
			return props[key];
		}
		//访问公共属性
		const publicProperty = PublicPropertiesMap[key];
		if (publicProperty) {
			return publicProperty(instance);
		}
	},
};
