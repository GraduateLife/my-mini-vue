import { Dependency } from "./effect";

class ComputedImpl {
	// private _func: Function;
	private _isLocked: boolean = false;
	private _value;
	private _dep: Dependency;
	constructor(func: Function) {
		// this._func = func;
		this._dep = new Dependency(func, () => {
			if (this._isLocked) {
				//##响应式对象重新赋值时解锁
				//##同样的，重新赋值触发trigger，trigger执行调度者（此时有值）
				//Q:如果不写调度者呢？ A：触发内部函数啊笨，那就不会缓存了，每次访问都会执行内部函数
				this._isLocked = false;
			}
		});
		//##由于响应式对象的重新赋值（set）会触发trigger，也就是执行依赖函数池的函数，但我们没有track过所以池是空的，
		//##那最好是交给effect来进行赋值而不是代理对象的set，因为在Dependency类中的run考虑到了没有依赖函数情况(此时会把构造器中的函数扔到依赖池里):
		//##g_activatedDep = this; //in Dependency INSTANCE.run
		//##depsSet.add(g_activatedDep); //addDependency in track
	}
	get value() {
		if (!this._isLocked) {
			//first access
			this._value = this._dep.run();
			this._isLocked = true;
		}
		return this._value;
	}
}

export function computed(func) {
	return new ComputedImpl(func);
}
