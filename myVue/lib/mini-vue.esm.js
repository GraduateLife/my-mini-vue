function toDisplayString(val) {
    return String(val);
}

const isObject = (val) => {
    return val !== null && val !== undefined && typeof val === "object";
};
const isChanged = (newValue, oldValue) => {
    return !Object.is(newValue, oldValue);
};
const hasProperty = (objectName, keyName) => Object.prototype.hasOwnProperty.call(objectName, keyName);
const formatEventName = (str) => str ? "on" + capitalize(camelize(str)) : "";
//aaa=>Aaa
const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
//kebab-case-good=>kebabCaseGood
const camelize = (kebabStr) => {
    return kebabStr.replace(/-[a-z]/g, (matched, index) => {
        return matched.charAt(1).toUpperCase();
    });
};

var Shapes;
(function (Shapes) {
    Shapes[Shapes["ELEMENT"] = 1] = "ELEMENT";
    Shapes[Shapes["STATEFUL_COMPONENT"] = 2] = "STATEFUL_COMPONENT";
    Shapes[Shapes["TEXT_CHILD"] = 4] = "TEXT_CHILD";
    Shapes[Shapes["ARRAY_CHILDREN"] = 8] = "ARRAY_CHILDREN";
    Shapes[Shapes["OBJECT_CHILDREN"] = 16] = "OBJECT_CHILDREN";
})(Shapes || (Shapes = {}));
//位运算比对象属性效率高

//我觉得vue的参数声明有点疑惑性，所以我会用我自己的变量名
const FRAGMENT = Symbol("FRAGMENT");
const TEXT = Symbol("TEXT");
function createVNode(family, attributes, content) {
    const vnode = {
        family,
        attributes,
        content,
        shape: getShape(family),
        el: null,
        hash: attributes === null || attributes === void 0 ? void 0 : attributes.hash,
        instance: null,
    };
    //add shape flags based on vnode children
    if (typeof vnode.content === "string") {
        vnode.shape |= Shapes.TEXT_CHILD;
    }
    else if (Array.isArray(vnode.content)) {
        vnode.shape |= Shapes.ARRAY_CHILDREN;
    }
    else if (isObject(vnode.content)) {
        vnode.shape |= Shapes.OBJECT_CHILDREN;
    }
    return vnode;
}
function createTextVNode(text) {
    return createVNode(TEXT, {}, text);
}
function getShape(family) {
    return isObject(family) ? Shapes.STATEFUL_COMPONENT : Shapes.ELEMENT;
}

//h as alias of createVNode
function h(type, attributes, content) {
    return createVNode(type, attributes, content);
}

function renderSlots(slots, slotName, slotScopes) {
    if (slots[slotName]) {
        if (typeof slots[slotName] === "function") {
            //你会发现需要有一个元素将其包裹来作为元素类型,但是其实我们只需要渲染他的儿子
            return createVNode(FRAGMENT, {}, slots[slotName](slotScopes));
        }
    }
}

let g_shouldTrack;
let g_activatedDep; //##存储将要运行的依赖函数以告知runner
const g_ReactiveMap = new Map(); //存储所有响应式对象-》它的所有键-》将会访问这个键的所有依赖函数
class Dependency {
    constructor(_func, scheduler) {
        this._isStopped = false;
        this.allRegisteredDeps = [];
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
function clearDepsSet(activatedDep) {
    activatedDep.allRegisteredDeps.forEach((dep) => {
        dep.delete(activatedDep);
        dep.length = 0;
    });
}
function track(target, key) {
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
function addDependency(depsSet) {
    if (depsSet.has(g_activatedDep)) {
        return; //Q：向一个set里加一个已经有的值会触发add吗
    }
    depsSet.add(g_activatedDep);
    g_activatedDep.allRegisteredDeps.push(depsSet); //反向收集所有在set里的依赖函数以便在Dep对象中清空set（stop）
}
function isDirectlyAccessed() {
    //eg : let v=aew.bou
    // if(!g_activatedDep){return true}//##直接访问属性（get）不会有依赖函数被触发，直接交给反射去读值
    // if(!g_shouldTrack){return true}//##已经被停止时也不用track
    return !(g_activatedDep && g_shouldTrack);
}
//##trigger 应该逻辑并不复杂，他只是执行在set中对应的函数（即被effect控制的函数），而把函数扔进set里是track的工作
function trigger(target, key) {
    let KeysMap = g_ReactiveMap.get(target);
    let deps = KeysMap.get(key);
    activateDependency(deps);
}
function activateDependency(depsSet) {
    for (const dep of depsSet) {
        if (dep.scheduler) {
            //##若同时传入调度者（配置对象），会调用调度者内部的函数而不是effect控制的函数
            dep.scheduler();
        }
        else {
            dep.run();
        }
    }
}
//##effect 现在看起来是创建Dependency类的高级形式，因为他在创建后会直接返回一个控制依赖函数调用的跑者，同时追加调度者
function effect(func, configurations = {}) {
    //##被effect控制的函数会在条件满足时被调用
    const scheduler = configurations.scheduler; //##调度者可作为配置项传进来
    const _dep = new Dependency(func, scheduler);
    Object.assign(_dep, configurations);
    // _dep.onStop=configurations.onStop
    _dep.run();
    const runner = _dep.run.bind(_dep); //##所谓的条件就是，当runner被调用时，effect控制的函数才会被调用，是函数式捏
    runner._dep = _dep; //##临时挂载依赖实例以调用依赖实例的方法，例如stop和run
    return runner;
}

//由于一共就四种，所以希望一开始就创建好然后用现成的就行了
const _createGetter = createGetter(true);
const _createSetter = createSetter();
const _createROGetter = createGetter(false);
const _createSROGetter = createGetter(false, true);
function createGetter(isReactive, isShallow = false) {
    return function (target, key) {
        //##偏函数，根据是响应式设置创建对应getter和setter
        //##判断响应式等级（姑且这么称呼）就是访问一个已经预设好的键，返回偏函数的预先设置
        if (key === ReactivityFlags.__IS__REACTIVE__) {
            return isReactive;
            /*  LOG
            他如果是只读那isReactive当然是false啊，isReadonly是true没毛病，我怎么会在这里卡住的。。。
        */
        }
        else if (key === ReactivityFlags.__IS__READONLY__) {
            return !isReactive;
        }
        const res = Reflect.get(target, key);
        if (isObject(res)) {
            //##一般情况下会将内部所有属性（复杂类型）转为响应式
            return isReactive ? reactive(res) : readonly(res);
        }
        if (isReactive) {
            track(target, key);
        } //##如果是只读对象，不track
        if (isShallow) {
            return res;
        } //##如果是浅响应，里面的内容交给反射就行，不用转响应式
        return res;
    };
}
function createSetter() {
    return function (target, key, value) {
        const res = Reflect.set(target, key, value);
        trigger(target, key);
        return res;
    };
}
const reactiveHandler = {
    get: _createGetter,
    set: _createSetter,
};
const readonlyHandler = {
    get: _createROGetter,
    set(target, key, value) {
        console.warn(`you are trying to change a readonly property: ${key} to ${value}`);
        return true;
    },
};
const shallowReadonlyHandler = Object.assign({}, readonlyHandler, {
    get: _createSROGetter,
});

var ReactivityFlags;
(function (ReactivityFlags) {
    ReactivityFlags["__IS__REACTIVE__"] = "--v--IS--THIS--REACTIVE?";
    ReactivityFlags["__IS__READONLY__"] = "--v--IS--THIS--READONLY?";
})(ReactivityFlags || (ReactivityFlags = {}));
function reactive(rawObj) {
    return createProxy(rawObj, reactiveHandler);
}
function readonly(rawObj) {
    return createProxy(rawObj, readonlyHandler);
}
function shallowReadonly(rawObj) {
    return createProxy(rawObj, shallowReadonlyHandler);
}
function createProxy(input, proxyHandler) {
    if (!isObject(input)) {
        console.warn(`Reactive Objects cannot be created if input is not an object, please check ${input}`);
        return input;
    }
    return new Proxy(input, proxyHandler);
}

function componentEmit(instance, eventName, ...args) {
    // console.log("Emitted event name:", eventName);
    const { props } = instance;
    const formattedEventName = formatEventName(eventName);
    props[formattedEventName](...args);
}

function initProps(instance, rawProps) {
    rawProps ? (instance.props = rawProps) : {}; //考虑到一个组件可能没有prop(至少根组件一定没有)，所以要做好保底
}

//公共属性
const PublicPropertiesMap = {
    $el: (somewhat) => {
        return somewhat.vnode.el;
    },
    $slots: (somewhat) => {
        return somewhat.slots;
    },
    $props: (somewhat) => {
        return somewhat.props;
    },
};
const PublicInstanceProxyHandler = {
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

function initSlots(instance, rawSlotObj) {
    //其实就干了一件事情，把组件的slot儿子扔到公有对象统一管理，外加套了层Array的壳
    if (instance.vnode.shape & Shapes.OBJECT_CHILDREN) {
        addSlots(rawSlotObj, instance.slots);
    }
}
function addSlots(input, output) {
    for (const name in input) {
        output[name] = (scopes) => handleOnlyChild(input[name](scopes));
    }
}
function handleOnlyChild(slotChildren) {
    //to handle arbitrary number of h() in one slot
    //since h()innercontent only supports Array of h() instead of just another h()
    return Array.isArray(slotChildren) ? slotChildren : [slotChildren];
}

class RefImpl {
    constructor(input) {
        this.__IS__REF__ = true;
        this._rawInput = input;
        this._input = isObject(input) ? reactive(input) : input;
        this.valueDep = new Set();
    }
    get value() {
        if (!isDirectlyAccessed()) {
            addDependency(this.valueDep);
        }
        return this._input;
    }
    set value(newVal) {
        if (isChanged(newVal, this._rawInput)) {
            this._rawInput = newVal;
            this._input = isObject(newVal) ? reactive(newVal) : newVal;
            activateDependency(this.valueDep);
        }
    }
}
function ref(input) {
    return new RefImpl(input);
}
function isRef(input) {
    return !!input.__IS__REF__;
}
function unRef(input) {
    //##去除最后一层.value,就是说unref后无所谓ref的还是普通的
    return isRef(input) ? input.value : input;
}
// expect(proxied.v).toBe(30);
//##也就是说，当你想给一个proxyref 设置值的时候，你给他一个普通类型，
// expect(ref.v.value).toBe(30);
function proxyRef(obj) {
    return new Proxy(obj, {
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },
        set(target, key, newVal) {
            //##生对象的属性是ref然而你想给他一个普通类型时，直接修改属性的.value
            if (isRef(target[key]) && !isRef(newVal)) {
                return (target[key].value = newVal);
            }
            else {
                //##生对象的属性是ref然而你想给他一个ref类型时,直接改成新的ref就行了
                return Reflect.set(target, key, newVal);
            }
        },
    });
}

let g_currentInstance = null;
function createComponentInstance(vnode, parentInstance) {
    const instance = {
        vnode,
        setupState: {},
        proxy: {},
        props: {},
        slots: {},
        emit: () => { },
        provides: parentInstance ? parentInstance.provides : {},
        parentInstance,
        isMounted: false,
        currentVNode: null,
        reCreateVNode: () => { },
    };
    instance.emit = componentEmit.bind(null, instance); //先传入第一个参数，这样用户不必传入有emit的组件了
    return instance;
}
function setupComponent(instance) {
    initProps(instance, instance.vnode.attributes);
    initSlots(instance, instance.vnode.content);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    instance.proxy = new Proxy({ whatever: instance }, PublicInstanceProxyHandler);
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
function handleSetupRes(instance, setupRes) {
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
    }
    else {
        console.log("other cases");
        instance.render = componentObj.render;
    }
    //##目前我们假设render函数里一定有值
    // if (component.render) {
    // 	instance.render = component.render;
    // }
}
function getCurrentInstance() {
    return g_currentInstance;
}
function setCurrentInstance(something) {
    g_currentInstance = something;
}
let g_renderFunction;
function receiveRenderFunction(something) {
    g_renderFunction = something;
}

function provide(provideKey, provideVal) {
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
function inject(provideKey) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const { parentInstance } = currentInstance;
        return parentInstance.provides[provideKey];
    }
}

//现在initRenderer(pullTheTrigger)是createApp的别名
function initRenderer(pullTheTrigger) {
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

function getSequenceIndexes(arr) {
    const p = arr.slice(); //复制输入数组
    const result = [0];
    let left, right, u, v, c;
    const len = arr.length;
    for (left = 0; left < len; left++) {
        if (arr[left] !== 0) {
            right = result[result.length - 1];
            if (arr[right] < arr[left]) {
                p[left] = right;
                result.push(left);
                continue;
            }
            //二分查找来推连在一起的递增子串（的索引）
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1; //<= middle
                if (arr[result[c]] < arr[left]) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arr[left] < arr[result[u]]) {
                if (u > 0) {
                    p[left] = result[u - 1];
                }
                result[u] = left;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

function shouldUpdateComponent(vnode1, vnode2) {
    const { attributes: prevAttrs } = vnode1;
    const { attributes: currAttrs } = vnode2;
    for (const key in currAttrs) {
        if (prevAttrs[key] !== currAttrs[key]) {
            return true;
        }
    }
    return false; //probably means the component is itself
}

const queue = []; // micro task queue
let shouldStartFlush = true;
const p = Promise.resolve(); //only need on promise object
function addQueueJob(jobName) {
    if (!queue.includes(jobName)) {
        queue.push(jobName);
    }
    //only need to execute once
    if (shouldStartFlush) {
        flushQueue();
    }
}
function nextTick(fn) {
    return fn ? p.then(fn) : p;
}
function flushQueue() {
    shouldStartFlush = false;
    nextTick(doTheJobs);
}
function doTheJobs() {
    let job;
    while ((job = queue.shift())) {
        job && job();
    }
}

function customizeRenderer(options) {
    const { createElement: api_createElement, setElementAttribute: api_setElementAttribute, insertElement: api_insertElement, removeElement: api_removeElement, setElementText: api_setElementText, } = options;
    function startRendering(rootVNode, container) {
        patch(null, rootVNode, container, null, null);
    }
    function patch(n1, vnode, container, parentInstance, anchor) {
        const { shape, family } = vnode;
        switch (family) {
            case FRAGMENT:
                processFragment(n1, vnode, container, parentInstance, anchor);
                break;
            case TEXT:
                processText(n1, vnode, container);
                break;
            default:
                if (shape & Shapes.STATEFUL_COMPONENT) {
                    processComponent(n1, vnode, container, parentInstance, anchor);
                }
                else if (shape & Shapes.ELEMENT) {
                    processElement(n1, vnode, container, parentInstance, anchor);
                }
                break;
        }
    }
    //对于组件类型，我们可以发现其实我们没有访问他的attributes，我们把这份工作交给了publicInstance
    //处理组件类型
    function processComponent(n1, n2, container, parentInstance, anchor) {
        if (!n1) {
            mountComponent(n2, container, parentInstance, anchor);
        }
        else {
            updateComponent(n1, n2);
        }
    }
    function mountComponent(parentVNode, container, parentInstance, anchor) {
        const instance = createComponentInstance(parentVNode, parentInstance); //组件类型的attributes（prop&emit）对应元素类型的attributes（class%event）
        parentVNode.instance = instance;
        setupComponent(instance); //组件对象的代理对象在这里创建
        setupRenderEffect(instance, parentVNode, container, anchor);
    }
    function updateComponent(n1, n2) {
        n2.instance = n1.instance; //we create instance in mountComponent, so we should do similar thing
        const currentInstance = n2.instance; //tbh we don't really care about whose instance is this, we only need somebody to restart renderer
        if (shouldUpdateComponent(n1, n2)) {
            console.log("about to update a child component");
            currentInstance.currentVNode = n2; //property 'vnode' becomes previous vnode, need to temporarily store current vnode
            currentInstance.reCreateVNode(); // the same as setupRenderEffect()
        }
        else {
            //returns false means the component is itself
            n2.el = n1.el; // we pass el value in setupRenderEffect, so we do similar thing
            currentInstance.vnode = n2; //coz we give n1 values to n2, need to update vnode
            //hey wait! shouldn't we use currentVNode?
            //A: nah since there is no new vnode need to be created, just need to pass necessary information
        }
    }
    function setupRenderEffect(instance, parentVNode, container, anchor) {
        //temporary property to restart render (by get effect runner)
        instance.reCreateVNode = effect(() => {
            if (!instance.isMounted) {
                //this component has never appeared on the page before
                const { render, proxy } = instance; //get render() in a component (the thing returns h()s)
                instance.currentTree = render.call(proxy, proxy); //to get that bunch of h()s and twist executor pointer
                const HTree = instance.currentTree;
                //go deeper
                patch(null, HTree, container, instance, anchor);
                parentVNode.el = HTree.el;
                instance.isMounted = true;
            }
            else {
                //if we are here,means a component needs update, and we are sure this is a child component of it
                const { currentVNode, vnode } = instance;
                if (currentVNode) {
                    currentVNode.el = vnode.el;
                    updateComponentProps(instance, currentVNode);
                }
                const { render, proxy } = instance; //获取组件的render函数
                const prevTree = instance.currentTree; //that bunch of h()s are previous
                const HTree = render.call(proxy, proxy); //get latest h()s
                instance.currentTree = HTree;
                patch(prevTree, HTree, container, instance, anchor); //start a new round of comparison
            }
        }, {
            scheduler() {
                addQueueJob(instance.reCreateVNode);
            },
        });
    }
    //we actually turns a component into a child component of it
    function updateComponentProps(instance, currentVNode) {
        instance.vnode = currentVNode;
        instance.props = currentVNode.attributes;
        instance.currentVNode = null;
    }
    //we will finally get here sooner or later
    function processElement(n1, n2, container, parentInstance, anchor) {
        if (!n1) {
            console.log("mount logic");
            mountElement(n1, n2, container, parentInstance, anchor);
        }
        else {
            console.log("update logic");
            updateElement(n1, n2, container, parentInstance, anchor);
        }
    }
    function mountElement(n1, vnode, container, parentInstance, anchor) {
        //这里进来的vnode是HTree
        //process family
        const element = api_createElement(vnode.family); //创建真实元素
        vnode.el = element; //说明这个vnode的真实元素是这个元素，而非根元素
        //get what we need
        const { content, shape, attributes } = vnode;
        //process content
        if (shape & Shapes.TEXT_CHILD) {
            //means it's innertext
            element.textContent = content;
        }
        else if (shape & Shapes.ARRAY_CHILDREN) {
            //means it's an array of h(), aka child elements/components
            mountContent(vnode.content, element, parentInstance, anchor);
        }
        //process attributes(and events)
        for (const key in attributes) {
            api_setElementAttribute(element, key, null, attributes[key]);
        }
        //add new element to window
        api_insertElement(element, container, anchor);
    }
    //分发元素子内容
    function mountContent(content, container, parentInstance, anchor) {
        content.forEach((innerVNode) => {
            patch(null, innerVNode, container, parentInstance, anchor);
        });
    }
    function updateElement(n1, n2, container, parentInstance, anchor) {
        const prevAttrs = n1.attributes ? n1.attributes : {};
        const currentAttrs = n2.attributes ? n2.attributes : {};
        n2.el = n1.el; //更新时候el属性还没有赋值，从之前的vnode中获取el
        const element = n2.el; //n2最后都会变回n1，因此需要取n2.el
        updateContent(n1, n2, element, parentInstance, anchor);
        updateAttributes(element, prevAttrs, currentAttrs);
    }
    function updateContent(n1, n2, element, parentInstance, anchor) {
        const currentTextContent = n2.content;
        //n2 child is checked to be text
        if (n2.shape & Shapes.TEXT_CHILD) {
            //n1 child is checked to be array
            if (n1.shape & Shapes.ARRAY_CHILDREN) {
                //case of array->text
                unmountContent(n1.content);
            }
            //n1 child is inferred to be text at this stage
            const prevTextContent = n1.content;
            //now element content is either old text or blank(array type,unmounted from webpage)
            if (currentTextContent !== prevTextContent) {
                api_setElementText(element, currentTextContent);
            }
        } //n2 child is ensured to be array at this stage
        else {
            //n1 child is checked to be text
            //case of text->array
            if (n1.shape & Shapes.TEXT_CHILD) {
                //clear element innertext
                api_setElementText(element, "");
                mountContent(n2.content, element, parentInstance, anchor);
            }
            else {
                //n1 child is ensured to be array
                //case of array->array
                updateKeyedChildren(n1.content, n2.content, element, parentInstance, anchor);
            }
        }
    }
    function updateKeyedChildren(prevContent, currContent, container, parentInstance, anchor) {
        let left = 0;
        let end1 = prevContent.length - 1;
        let end2 = currContent.length - 1;
        function isTheSameVNode(vnode1, vnode2) {
            return vnode1.family === vnode2.family && vnode1.hash === vnode2.hash;
        }
        //move i(left pointer) to the right to look for the first different element index(on the left)
        while (left <= end1 && left <= end2) {
            const n1 = prevContent[left];
            const n2 = currContent[left];
            if (isTheSameVNode(n1, n2)) {
                patch(n1, n2, container, parentInstance, anchor); //call patch to go further (check content of these 2 vnodes)
            }
            else {
                break;
            }
            left++;
        }
        //move right pointers to look for the first different element (on the right)
        while (left <= end1 && left <= end2) {
            const n1 = prevContent[end1];
            const n2 = currContent[end2];
            if (isTheSameVNode(n1, n2)) {
                patch(n1, n2, container, parentInstance, anchor); //call patch to go further (check content of these 2 vnodes)
            }
            else {
                break;
            }
            end1--;
            end2--;
        }
        //case 1:first different element on the left is on the right of old array
        //TODO: mount element on both sides
        if (left > end1 && left <= end2) {
            //#region version with a bug
            //first different element on the right is on the right of first different element on the left(different element part located)
            //is i=e2 possible? Ye, means only one different element
            // const nextPos = i + 1; //the index on the right of first left different element
            //if this index is out of index of current array(means there is nothing on the right),element is appended at the end
            //else,there is something extra on the right, means the new element occurs on the left side, insert it thru anchor
            // const anchor =i + 1 < currContent.length ? currContent[nextPos].el : null;<<<a bug here
            //Q:what's the bug? A:it only prove something on its right, what if it's a new element need to be inserted as well?
            //hence we shouldn't look for the right of first left new element, but the first element doesn't need to be updated.
            //#endregion
            //↓I’d like to say it's somewhere safe (not the concept in math), cannot figure out much better variable name:(
            const stationaryPoint = end2 + 1; //e2 is the index of first different element on the right, so e2+1 is surly first unchanged element
            const contentAnchor = stationaryPoint < currContent.length
                ? currContent[stationaryPoint].el
                : anchor;
            //mount element by calling patch
            while (left <= end2) {
                patch(null, currContent[left], container, parentInstance, contentAnchor);
                left++;
            }
        } //case2:first left different element is on the right of first right different element,sounds weird?
        //if we swap the position of e2 and e1 the case becomes clear, means current array is shorter than before
        //TODO: remove elements on both sides
        else if (left > end2 && left <= end1) {
            while (left <= end1) {
                api_removeElement(prevContent[left].el);
                left++;
            }
        } //case 3:e1=e2, leads to comparison in the middle
        else {
            //to specify we are about to process the middle part
            let start1 = left;
            let start2 = left;
            const OverAllCurrentVNodeCnt = end2 - left + 1;
            let handledPreviousVNodeCnt = 0;
            const ContentVNodeHashMap = new Map();
            const ContentMiddlePartMappingArray = new Array(OverAllCurrentVNodeCnt).fill(Infinity);
            for (let i = start2; i <= end2; i++) {
                //sign up every current content vnode into a map by its hashCode
                ContentVNodeHashMap.set(currContent[i].hash, i);
            }
            for (let i = start1; i <= end1; i++) {
                //if new array has less vnodes than the old one, after the amount of vnodes we processed is exactly the overall amount of new array vnodes,
                //we can then simply remove exceeded old vnodes
                if (handledPreviousVNodeCnt >= OverAllCurrentVNodeCnt) {
                    api_removeElement(prevContent[i].el);
                    continue;
                }
                let updatedPrevContentVNodeIndex; //to store where the old vnode is right now
                //find out if the vnode appears in previous content array as well
                if (prevContent[i].hash) {
                    //provided vnode hashCode is given
                    updatedPrevContentVNodeIndex = ContentVNodeHashMap.get(prevContent[i].hash);
                } //if vnode hashCode is not given, have to go through new content array to compare
                else {
                    for (let j = start2; j <= end2; j++) {
                        if (isTheSameVNode(prevContent[i], currContent[j])) {
                            updatedPrevContentVNodeIndex = j;
                            break; //if we find it, go out
                        }
                    }
                } //old vnode no longer exists in new array
                //TODO:remove element in the middle
                if (!updatedPrevContentVNodeIndex) {
                    api_removeElement(prevContent[i].el);
                } //old vnode still exists in new array
                else {
                    //record the order of old elements in new array,like: map index: current order(in middle part scale), map value:old order
                    //remind that 'updatedPrevContentVNodeIndex' is in the range of newArray length,but we'd like to begin with the middle part
                    ContentMiddlePartMappingArray[updatedPrevContentVNodeIndex - start2] =
                        i;
                    patch(
                    //go further
                    prevContent[i], currContent[updatedPrevContentVNodeIndex], container, parentInstance, null //don't have to assign anchor since we only care about remove right now
                    );
                }
                handledPreviousVNodeCnt++; //means process of one old vnode is done
            }
            //LIS>>>Longest Increasing Sequence
            const MappingArrayLISindexes = getSequenceIndexes(ContentMiddlePartMappingArray);
            //since elements mount before another element, so should go from the right side
            let LISpointer = MappingArrayLISindexes.length - 1;
            for (let mappingArrPointer = ContentMiddlePartMappingArray.length - 1; mappingArrPointer >= 0; mappingArrPointer--) {
                //remember to add the length of the left part,that's the last middle part index, so +1
                const stationaryPoint = mappingArrPointer + start2 + 1;
                const currentVNode = currContent[mappingArrPointer + start2];
                //similarly,to check if this safety place really exists or not, if not, append
                const contentAnchor = stationaryPoint < currContent.length
                    ? currContent[stationaryPoint].el
                    : anchor;
                //===infinity,old order of this element hasn't been mapped,proves it should be created in new array
                //TODO:mount element in the middle
                if (ContentMiddlePartMappingArray[mappingArrPointer] === Infinity) {
                    patch(null, currentVNode, container, parentInstance, contentAnchor);
                }
                //index of the element is not in LIS, means it should be moved
                //TODO:change order of existing element in the middle
                if (mappingArrPointer !== MappingArrayLISindexes[LISpointer]) {
                    api_insertElement(currentVNode.el, container, contentAnchor);
                }
                else {
                    LISpointer--;
                }
            }
        }
    }
    function unmountContent(prevContent) {
        //prevContent is an array
        for (let i = 0; i < prevContent.length; i++) {
            const prevElement = prevContent[i].el;
            api_removeElement(prevElement);
        }
    }
    function updateAttributes(element, prevAttrs, currentAttrs) {
        if (prevAttrs !== currentAttrs) {
            for (const key in currentAttrs) {
                //reset attribute value
                if (currentAttrs[key] !== prevAttrs[key]) {
                    api_setElementAttribute(element, key, prevAttrs[key], currentAttrs[key]);
                }
            }
        }
        if (JSON.stringify(prevAttrs) !== "{}") {
            for (const key in prevAttrs) {
                //remove an attribute
                if (!currentAttrs[key]) {
                    api_setElementAttribute(element, key, prevAttrs[key], null);
                }
            }
        }
    }
    //#region process special type elements
    function processFragment(n1, vnode, container, parentInstance, anchor) {
        //对于FRAGMENT类型，只会渲染他的子内容
        mountContent(vnode.content, container, parentInstance, anchor);
    }
    function processText(n1, vnode, container) {
        const textNode = document.createTextNode(vnode.content);
        vnode.el = textNode;
        container.append(textNode);
    }
    //#endregion
    return {
        //用户是createApp（App）这样来创建应用的
        //但是现在的状态是customizeRenderer.createApp这种形式
        _createApp: initRenderer(startRendering),
        //你会发现createApp应该是一个等待被调用的状态（等待传入根节点），因此initRenderer是一个闭包,预设参数是分发根元素的函数startRendering，
        //然后当然，startRendering也等着被传入参数，这可以在函数作用域内做到
    };
}

//创建dom元素
function createElement(elementType) {
    return document.createElement(elementType);
}
//设置一个属性
function setElementAttribute(element, attributeName, prevAttributeVal, currentAttributeVal) {
    const isEvent = (x) => /^on[A-Z]/.test(x);
    if (isEvent(attributeName)) {
        const event = attributeName.slice(2).toLowerCase();
        element.addEventListener(event, currentAttributeVal);
    }
    else {
        if (currentAttributeVal === null || currentAttributeVal === undefined) {
            element.removeAttribute(attributeName);
        }
        else {
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
const domRenderer = customizeRenderer(domRendererOptions);
//正如在renderer.ts最后讲的，因此需要封装一下
function createApp(...args) {
    return domRenderer._createApp(...args);
}

var runtimeDom = /*#__PURE__*/Object.freeze({
    __proto__: null,
    createApp: createApp,
    h: h,
    renderSlots: renderSlots,
    createTextVNode: createTextVNode,
    createElementNode: createVNode,
    getCurrentInstance: getCurrentInstance,
    receiveRenderFunction: receiveRenderFunction,
    provide: provide,
    inject: inject,
    customizeRenderer: customizeRenderer,
    nextTick: nextTick,
    toDisplayString: toDisplayString
});

const TO_DISPLAY_STRING = Symbol("toDisplayString");
const CREATE_ELEMENT_NODE = Symbol("createElementNode");
const HelperMap = {
    [TO_DISPLAY_STRING]: "toDisplayString",
    [CREATE_ELEMENT_NODE]: "createElementNode",
};

var AstNodeTypes;
(function (AstNodeTypes) {
    AstNodeTypes[AstNodeTypes["INTERPOLATION"] = 0] = "INTERPOLATION";
    AstNodeTypes[AstNodeTypes["SIMPLE_EXPRESSION"] = 1] = "SIMPLE_EXPRESSION";
    AstNodeTypes[AstNodeTypes["ELEMENT"] = 2] = "ELEMENT";
    AstNodeTypes[AstNodeTypes["TEXT"] = 3] = "TEXT";
    AstNodeTypes[AstNodeTypes["ROOT"] = 4] = "ROOT";
    AstNodeTypes[AstNodeTypes["MIXED_EXPRESSION"] = 5] = "MIXED_EXPRESSION";
})(AstNodeTypes || (AstNodeTypes = {}));
function createElementCodeGenNode(transformCxt, tag, attributes, content) {
    transformCxt.addHelper(CREATE_ELEMENT_NODE);
    return {
        type: AstNodeTypes.ELEMENT,
        tag: tag,
        attributes: attributes,
        branches: content,
    };
}

function transform(rootNode, options = {}) {
    const context = createTransformContext(rootNode, options);
    dfs(rootNode, context);
    createRootCodeGenNode(rootNode);
    rootNode.helpers = [...context.helpers.keys()];
}
function createRootCodeGenNode(rootNode) {
    const firstChild = rootNode.branches[0];
    if (firstChild.type === AstNodeTypes.ELEMENT) {
        rootNode.codeGenNode = firstChild.codeGenNode;
    }
    else {
        rootNode.codeGenNode = firstChild;
    }
}
function dfs(node, context) {
    // if (node.type === AstNodeTypes.TEXT) {
    // 	node.content = "this is transformed message";
    // }
    //execute plugins before go into it
    const { nodeTransforms } = context;
    const onLeaveExecutionLIFO = [];
    for (let i = 0; i <= nodeTransforms.length - 1; i++) {
        const _exec = nodeTransforms[i];
        const deferred = _exec(node, context);
        if (deferred) {
            onLeaveExecutionLIFO.push(deferred);
        }
    }
    switch (node.type) {
        case AstNodeTypes.INTERPOLATION:
            context.addHelper(TO_DISPLAY_STRING);
            break;
        case AstNodeTypes.ROOT:
        case AstNodeTypes.ELEMENT:
            passThoughBranch(node, context);
            break;
    }
    let i = onLeaveExecutionLIFO.length;
    while (i--) {
        onLeaveExecutionLIFO[i]();
    }
}
function passThoughBranch(node, context) {
    // console.log("branch is like", node.branches);
    const branches = node.branches;
    for (let i = 0; i < branches.length; i++) {
        const nextNode = branches[i];
        dfs(nextNode, context);
    }
}
//transform configurations
function createTransformContext(rootNode, options) {
    const context = {
        root: rootNode,
        nodeTransforms: options.nodeTransforms || [],
        helpers: new Map(),
        addHelper(helperName) {
            context.helpers.set(helperName, null);
        },
    };
    return context;
}

function generate(ast) {
    const context = createCodeGenContext();
    const { helpers } = ast;
    const { concat } = context;
    const functionName = "render";
    const functionArgs = ["_ctx", "_cache"].join(", ");
    if (helpers.length > 0) {
        importFunctionHelpers(ast, context);
    }
    concat("return function ");
    concat(`${functionName}(${functionArgs}){`);
    concat("return ");
    processCodeGenNode(ast.codeGenNode, context);
    concat("}");
    // console.log("code be like", context.code);
    return {
        code: context.code,
    };
}
function processCodeGenNode(node, context) {
    // console.log("genNode is like", node);
    switch (node.type) {
        case AstNodeTypes.TEXT:
            processTextNode(node, context);
            break;
        case AstNodeTypes.INTERPOLATION:
            processInterpolationNode(node, context);
            break;
        case AstNodeTypes.SIMPLE_EXPRESSION:
            processSimpleExp(node, context);
            break;
        case AstNodeTypes.ELEMENT:
            processElementNode(node, context);
            break;
        case AstNodeTypes.MIXED_EXPRESSION:
            processMixedExpression(node, context);
            break;
        // throw new Error("impossible node type");
    }
}
function processTextNode(node, context) {
    const stuff = node.content;
    context.concat(`'${stuff}'`);
}
function processInterpolationNode(node, context) {
    const { concat, getHelper } = context;
    concat(getHelper(TO_DISPLAY_STRING));
    concat("(");
    processCodeGenNode(node.content, context);
    concat(")");
}
function processSimpleExp(node, context) {
    context.concat(`${node.content}`);
}
function processElementNode(node, context) {
    // console.log("multi", node.branches);
    const { concat, getHelper } = context;
    const { tag, attributes, branches } = node;
    concat(getHelper(CREATE_ELEMENT_NODE));
    concat("(");
    processElementArray(mustNotReturnUndefined([tag, attributes, branches]), context);
    // concat(`'${tag}'`);
    // concat(`, ${attributes}, `);
    // const insideElement = node.branches[0]; //DONE:not good
    // processCodeGenNode(branches, context); //since we know there is only one node
    // concat(`'this is', +_toDisplayString(_ctx.message)`);
    // for (let i = 0; i < node.branches.length; i++) {
    // 	processCodeGenNode(node.branches[i], context);
    // }
    concat(")");
}
const mustNotReturnUndefined = (someArray) => {
    return someArray.map((item) => item || "null");
};
function processElementArray(elementArr, context) {
    const { concat } = context;
    for (let i = 0; i < elementArr.length; i++) {
        if (typeof elementArr[i] === "string") {
            concat(elementArr[i]);
        }
        else {
            processCodeGenNode(elementArr[i], context);
        }
        if (i < elementArr.length - 1) {
            concat(", ");
        }
    }
}
function processMixedExpression(node, context) {
    for (let i = 0; i < node.branches.length; i++) {
        const { concat } = context;
        const currNode = node.branches[i];
        if (typeof currNode !== "string") {
            processCodeGenNode(currNode, context);
        }
        else {
            concat(currNode);
        }
    }
}
function createCodeGenContext() {
    const context = {
        code: "",
        concat(something) {
            context.code += something;
        },
        getHelper(helperName) {
            return `_${HelperMap[helperName]}`;
        },
    };
    return context;
}
function importFunctionHelpers(ast, context) {
    const { concat } = context;
    const Vue = "Vue";
    const { helpers } = ast;
    const setHelperAlias = (helperSymbol) => {
        return `${HelperMap[helperSymbol]}: _${HelperMap[helperSymbol]}`;
    };
    concat(`const { ${helpers.map(setHelperAlias)} } = ${Vue}`);
    concat("\n");
}

var ElementTagsIdentifiers;
(function (ElementTagsIdentifiers) {
    ElementTagsIdentifiers[ElementTagsIdentifiers["START"] = 0] = "START";
    ElementTagsIdentifiers[ElementTagsIdentifiers["END"] = 1] = "END";
})(ElementTagsIdentifiers || (ElementTagsIdentifiers = {}));
function baseParse(input) {
    const context = createParseContext(input);
    return createRoot(parseBranches(context, []));
}
function parseBranches(context, recentElements) {
    // console.log(
    // 	"start parsing context branch,current source is,,",
    // 	context.source
    // );
    const nodes = [];
    let node;
    while (!shouldTerminateParse(context, recentElements)) {
        // console.log("current element stack", recentElements);
        if (/^\{\{/.test(context.source)) {
            // {{something...
            node = parseInterpolation(context);
        }
        else if (/^\<\w/.test(context.source)) {
            // <something...
            node = parseElement(context, recentElements);
        }
        else {
            node = parseText(context);
        }
        nodes.push(node);
    }
    return nodes;
}
function parseInterpolation(context) {
    const openBrace = "{{";
    const closeBrace = "}}";
    const closeBraceIndex = context.source.indexOf(closeBrace, openBrace.length);
    proceedByLength(context, openBrace.length); //proceed to right by 2(  {{  )
    //console.log("do we have problem when we at {{?>>>", context.source);
    const parsedInterpolationContent = processWordContent(context, closeBraceIndex - openBrace.length).trim();
    //console.log(
    //"do we have problem when we are inside interpolation?>>>",
    //parsedInterpolationContent,
    //",,should be parsed expression,",
    //context.source,
    //",,is current source"
    //);
    proceedByLength(context, closeBrace.length); //move to the end of }}
    //console.log(
    //"do we have problem when we at }}?>>>",
    //context.source,
    //",,is current source"
    //);
    // console.log("ip ends", context.source);
    return {
        type: AstNodeTypes.INTERPOLATION,
        content: {
            type: AstNodeTypes.SIMPLE_EXPRESSION,
            content: parsedInterpolationContent,
        },
    };
}
function parseElement(context, recentElements) {
    const element = parseElementTags(context, ElementTagsIdentifiers.START);
    recentElements.push(element);
    // console.log(
    // 	"current element stack after parsing element tag start",
    // 	recentElements
    // );
    element.branches = parseBranches(context, recentElements);
    recentElements.pop();
    // console.log(
    // 	"current element stack after parsing element tag",
    // 	recentElements
    // );
    if (hasCorrespondingCloseTag(context, element)) {
        // console.log("start parsing close tag");
        parseElementTags(context, ElementTagsIdentifiers.END);
    }
    else {
        throw new Error("lost close tag");
    }
    return element;
}
function hasCorrespondingCloseTag(someCxt, someEle) {
    return (someCxt.source.slice(2, someEle.tag.length + 2) === someEle.tag &&
        someCxt.source.startsWith("</"));
}
function parseElementTags(context, elementTagsIdentifier) {
    const matches = /^\<\/?(\w+)\>/.exec(context.source);
    // //console.log("tag matches results", matches);
    const parsedElementTagName = matches[1];
    // console.log(
    // 	"do we have problems when we parsing tag names?>>>",
    // 	parsedElementTagName,
    // 	",,should be parsed tag"
    // );
    proceedByLength(context, matches[0].length);
    // console.log("current source", context.source);
    if (elementTagsIdentifier === ElementTagsIdentifiers.END) {
        return;
    }
    return {
        type: AstNodeTypes.ELEMENT,
        tag: parsedElementTagName,
    };
}
function parseText(context) {
    let textEndIndex = context.source.length;
    const textEndSymbols = ["{{", "<"];
    for (let i = 0; i < textEndSymbols.length; i++) {
        const temp = context.source.indexOf(textEndSymbols[i]);
        // console.log("qqqqqqqqqqqqq", temp);
        if (temp !== -1 && temp < textEndIndex) {
            textEndIndex = temp;
        }
    }
    const parsedText = processWordContent(context, textEndIndex);
    //console.log(
    //"parsed text is,,",
    //parsedText,
    //"current source is,,",
    //context.source
    //);
    return {
        type: AstNodeTypes.TEXT,
        content: parsedText,
    };
}
function processWordContent(context, someLength) {
    const parsedText = context.source.slice(0, someLength);
    proceedByLength(context, someLength);
    return parsedText;
}
function shouldTerminateParse(context, recentElements) {
    if (context.source.startsWith("</")) {
        for (let i = recentElements.length - 1; i >= 0; i--) {
            let lastElement = recentElements[i];
            // console.log("aaaaaaaaa", lastElement);
            if (hasCorrespondingCloseTag(context, lastElement)) {
                // console.log("out");
                return true;
            }
        }
    }
    if (context.source.length === 0) {
        return true;
    }
    return false;
}
//to proceed string pointer
function proceedByLength(someCxt, length) {
    someCxt.source = someCxt.source.slice(length);
}
function createRoot(branches) {
    return {
        type: AstNodeTypes.ROOT,
        branches,
    };
}
function createParseContext(input) {
    return {
        source: input,
    };
}

const isLiteralNode = (someNode) => {
    return (someNode.type === AstNodeTypes.INTERPOLATION ||
        someNode.type === AstNodeTypes.TEXT);
};
//node1,    node2,      node3,
//A         B           C             <<<before
//A+B       C                         <<<after
function create_mixed_node(node) {
    // console.log("node is like", node);
    let mixedExpContainer;
    if (node.type === AstNodeTypes.ELEMENT) {
        return () => {
            for (let i = 0; i < node.branches.length; i++) {
                const currNode = node.branches[i];
                if (isLiteralNode(currNode)) {
                    // console.log("currrrrrrr", currNode);
                    for (let j = 1 + i; j < node.branches.length; j++) {
                        const nextNode = node.branches[j];
                        if (isLiteralNode(nextNode)) {
                            // console.log("nexxxxxxxxxxt", nextNode);
                            if (!mixedExpContainer) {
                                //init
                                mixedExpContainer = {
                                    type: AstNodeTypes.MIXED_EXPRESSION,
                                    branches: [currNode],
                                };
                                node.branches[i] = mixedExpContainer; //replace current node to mixed-exp container and ready to push new members
                            }
                            mixedExpContainer.branches.push(" + "); //push +
                            mixedExpContainer.branches.push(nextNode); // push its neighbor
                            node.branches.splice(j, 1); //remove this node(the neighbour) from current branch
                            j--; //rollback pointer
                        }
                        else {
                            mixedExpContainer = null;
                            break;
                        }
                    }
                }
            }
        };
    }
    // console.log("container", mixedExpContainer);
}

function ctx_simple_exp(node) {
    if (node.type === AstNodeTypes.INTERPOLATION) {
        node.content = add_ctx(node.content);
        // node.content.content = "_ctx." + node.content.content;
    }
}
function add_ctx(insideIPcontent) {
    insideIPcontent.content = `_ctx.${insideIPcontent.content}`;
    return insideIPcontent;
}

function setup_element_node(node, transformCxt) {
    if (node.type === AstNodeTypes.ELEMENT) {
        return () => {
            //setup element codegenNode
            const elementTag = `'${node.tag}'`;
            let elementAttrs;
            let elementBranches = node.branches[0]; //setup the codegenNode need to be handled
            node.codeGenNode = createElementCodeGenNode(transformCxt, elementTag, elementAttrs, elementBranches);
        };
    }
}

function baseCompile(template) {
    const ast = baseParse(template);
    transform(ast, {
        nodeTransforms: [ctx_simple_exp, setup_element_node, create_mixed_node],
    });
    return generate(ast).code;
}

//mini-vue output file
console.log("ready");
function generateRenderFunction(template) {
    const funcString = baseCompile(template);
    const render = new Function("Vue", funcString)(runtimeDom);
    console.log("render", render);
    return render;
}
receiveRenderFunction(generateRenderFunction);

export { createApp, createVNode as createElementNode, createTextVNode, customizeRenderer, getCurrentInstance, h, inject, nextTick, provide, proxyRef, receiveRenderFunction, ref, renderSlots, toDisplayString };
