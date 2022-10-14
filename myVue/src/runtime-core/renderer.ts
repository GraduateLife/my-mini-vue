import { Shapes } from "./Shapes";
import { createComponentInstance, setupComponent } from "./component";
import { FRAGMENT, TEXT } from "./vnode";
import { initRenderer } from "./createApp";
import { effect } from "../reactivity/effect";
import { getSequenceIndexes } from "./utils/getSequenceIndexes";
import { shouldUpdateComponent } from "./utils/shouldUpdateComponent";
import { addQueueJob } from "./rendererScheduler";

export function customizeRenderer(options) {
	const {
		createElement: api_createElement,
		setElementAttribute: api_setElementAttribute,
		insertElement: api_insertElement,
		removeElement: api_removeElement,
		setElementText: api_setElementText,
	} = options;

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
				} else if (shape & Shapes.ELEMENT) {
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
		} else {
			updateComponent(n1, n2);
		}
	}
	function mountComponent(parentVNode: any, container, parentInstance, anchor) {
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
		} else {
			//returns false means the component is itself
			n2.el = n1.el; // we pass el value in setupRenderEffect, so we do similar thing
			currentInstance.vnode = n2; //coz we give n1 values to n2, need to update vnode
			//hey wait! shouldn't we use currentVNode?
			//A: nah since there is no new vnode need to be created, just need to pass necessary information
		}
	}

	function setupRenderEffect(instance, parentVNode, container, anchor) {
		//temporary property to restart render (by get effect runner)
		instance.reCreateVNode = effect(
			() => {
				if (!instance.isMounted) {
					//this component has never appeared on the page before
					const { render, proxy } = instance; //get render() in a component (the thing returns h()s)
					instance.currentTree = render.call(proxy, proxy); //to get that bunch of h()s and twist executor pointer
					const HTree = instance.currentTree;
					//go deeper
					patch(null, HTree, container, instance, anchor);
					parentVNode.el = HTree.el;
					instance.isMounted = true;
				} else {
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
			},
			{
				scheduler() {
					addQueueJob(instance.reCreateVNode);
				},
			}
		);
	}
	//we actually turns a component into a child component of it
	function updateComponentProps(instance, currentVNode) {
		instance.vnode = currentVNode;
		instance.props = currentVNode.attributes;
		instance.currentVNode = null;
	}

	//we will finally get here sooner or later
	function processElement(n1, n2: any, container: any, parentInstance, anchor) {
		if (!n1) {
			console.log("mount logic");
			mountElement(n1, n2, container, parentInstance, anchor);
		} else {
			console.log("update logic");
			updateElement(n1, n2, container, parentInstance, anchor);
		}
	}

	function mountElement(
		n1,
		vnode: any,
		container: any,
		parentInstance,
		anchor
	) {
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
		} else if (shape & Shapes.ARRAY_CHILDREN) {
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

	function updateElement(
		n1: any,
		n2: any,
		container: any,
		parentInstance,
		anchor
	) {
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
			const prevTextContent: string = n1.content;
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
			} else {
				//n1 child is ensured to be array
				//case of array->array
				updateKeyedChildren(
					n1.content,
					n2.content,
					element,
					parentInstance,
					anchor
				);
			}
		}
	}
	function updateKeyedChildren(
		prevContent,
		currContent,
		container,
		parentInstance,
		anchor
	) {
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
			} else {
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
			} else {
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
			const contentAnchor =
				stationaryPoint < currContent.length
					? currContent[stationaryPoint].el
					: anchor;
			//mount element by calling patch
			while (left <= end2) {
				patch(
					null,
					currContent[left],
					container,
					parentInstance,
					contentAnchor
				);
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
			const ContentMiddlePartMappingArray = new Array(
				OverAllCurrentVNodeCnt
			).fill(Infinity);

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
					updatedPrevContentVNodeIndex = ContentVNodeHashMap.get(
						prevContent[i].hash
					);
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
						prevContent[i],
						currContent[updatedPrevContentVNodeIndex],
						container,
						parentInstance,
						null //don't have to assign anchor since we only care about remove right now
					);
				}
				handledPreviousVNodeCnt++; //means process of one old vnode is done
			}
			//LIS>>>Longest Increasing Sequence
			const MappingArrayLISindexes = getSequenceIndexes(
				ContentMiddlePartMappingArray
			);
			//since elements mount before another element, so should go from the right side
			let LISpointer = MappingArrayLISindexes.length - 1;
			for (
				let mappingArrPointer = ContentMiddlePartMappingArray.length - 1;
				mappingArrPointer >= 0;
				mappingArrPointer--
			) {
				//remember to add the length of the left part,that's the last middle part index, so +1
				const stationaryPoint = mappingArrPointer + start2 + 1;
				const currentVNode = currContent[mappingArrPointer + start2];
				//similarly,to check if this safety place really exists or not, if not, append
				const contentAnchor =
					stationaryPoint < currContent.length
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
				} else {
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
					api_setElementAttribute(
						element,
						key,
						prevAttrs[key],
						currentAttrs[key]
					);
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
	function processFragment(
		n1,
		vnode: any,
		container: any,
		parentInstance,
		anchor
	) {
		//对于FRAGMENT类型，只会渲染他的子内容
		mountContent(vnode.content, container, parentInstance, anchor);
	}
	function processText(n1, vnode: any, container: any) {
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
