let g_shouldTrack: boolean;
let g_activatedDep; //##存储将要运行的依赖函数以告知runner
const g_ReactiveMap = new Map(); //存储所有响应式对象-》它的所有键-》将会访问这个键的所有依赖函数
export class Dependency {
	private _func: Function;
	private _isStopped = false;
	public allRegisteredDeps: Array<Dependency> = [];
	public scheduler?: Function;
	onStop?: () => void;
	constructor(_func: Function, scheduler?: Function) {
		this._func = _func;
		this.scheduler = scheduler;
	}
	run() {
		if (this._isStopped) {
			return this._func();
		}
		g_shouldTrack = true;
		//Q:为什么不直接用 _isStopped 而要另外再创建一个全局变量？
		//A:因为不只run,track函数也需要知道是否runner已被停止,不然停止runner后响应式对象在被属性访问时一旦触发track把所有依赖函数扔进set里就又没用了

		/* LOG
        不知道我的理解对不对，响应式对象需要处理的部分：get（track）和set（trigger）， 以及涉及set和get的函数（也就是写进effect函数的回调），把回调扔到deps池里面
        当runner被停止的时候，会把deps池给清空，并且向外声明已经被停止
        */

		g_activatedDep = this;
		const res = this._func();
		g_shouldTrack = false;
		return res;
	}

	stop() {
		//##清空set并且保持清空状态直到runner被调用
		if (!this._isStopped) {
			//##若已经被stop过了并且runner还未被调用（例如连续调用stop），就不用再清空set了，因为本来就是空的
			clearDepsSet(this);
			this._isStopped = true;
			//Q:为什么写里面？ A：可能是因为就算多次调用stop也只会调用一次onstop
			if (this.onStop) {
				//##若在调度者的onstop选项内写了函数，在stop的同时执行onstop
				this.onStop();
			}
		}
	}
}
function clearDepsSet(activatedDep: Dependency) {
	activatedDep.allRegisteredDeps.forEach((dep: any) => {
		dep.delete(activatedDep);
		dep.length = 0;
	});
}

export function track(target, key) {
	if (isDirectlyAccessed()) {
		return;
	}
	let KeysMap = g_ReactiveMap.get(target);
	if (!KeysMap) {
		//first get
		KeysMap = new Map();
		g_ReactiveMap.set(target, KeysMap);
	}
	let DepsSet = KeysMap.get(key);
	if (!DepsSet) {
		//first get
		DepsSet = new Set();
		KeysMap.set(key, DepsSet);
	}
	addDependency(DepsSet);
}
export function addDependency(depsSet: Set<Dependency>) {
	if (depsSet.has(g_activatedDep)) {
		return; //Q：向一个set里加一个已经有的值会触发add吗
	}
	depsSet.add(g_activatedDep);
	g_activatedDep.allRegisteredDeps.push(depsSet); //反向收集所有在set里的依赖函数以便在Dep对象中清空set（stop）
}

export function isDirectlyAccessed(): boolean {
	//eg : let v=aew.bou
	// if(!g_activatedDep){return true}//##直接访问属性（get）不会有依赖函数被触发，直接交给反射去读值
	// if(!g_shouldTrack){return true}//##已经被停止时也不用track
	return !(g_activatedDep && g_shouldTrack);
}

//##trigger 应该逻辑并不复杂，他只是执行在set中对应的函数（即被effect控制的函数），而把函数扔进set里是track的工作
export function trigger(target, key) {
	let KeysMap = g_ReactiveMap.get(target);
	let deps: Set<Dependency> = KeysMap.get(key);
	activateDependency(deps);
}
export function activateDependency(depsSet: Set<Dependency>) {
	for (const dep of depsSet) {
		if (dep.scheduler) {
			//##若同时传入调度者（配置对象），会调用调度者内部的函数而不是effect控制的函数
			dep.scheduler();
		} else {
			dep.run();
		}
	}
}
//##effect 现在看起来是创建Dependency类的高级形式，因为他在创建后会直接返回一个控制依赖函数调用的跑者，同时追加调度者
export function effect(func: Function, configurations: any = {}) {
	//##被effect控制的函数会在条件满足时被调用
	const scheduler: () => {} = configurations.scheduler; //##调度者可作为配置项传进来
	const _dep = new Dependency(func, scheduler);
	Object.assign(_dep, configurations);
	// _dep.onStop=configurations.onStop
	_dep.run();

	const runner: any = _dep.run.bind(_dep); //##所谓的条件就是，当runner被调用时，effect控制的函数才会被调用，是函数式捏
	runner._dep = _dep; //##临时挂载依赖实例以调用依赖实例的方法，例如stop和run
	return runner;
}
export function stop(runner) {
	runner._dep.stop();
}
