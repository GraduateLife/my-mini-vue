import { AstNodeTypes } from "./astNodeTypes";
import { TO_DISPLAY_STRING } from "./transformHelpers";

export function transform(rootNode, options = {}) {
	const context = createTransformContext(rootNode, options);

	dfs(rootNode, context);
	createRootCodeGenNode(rootNode);
	rootNode.helpers = [...context.helpers.keys()];
}
function createRootCodeGenNode(rootNode) {
	const firstChild = rootNode.branches[0];
	if (firstChild.type === AstNodeTypes.ELEMENT) {
		rootNode.codeGenNode = firstChild.codeGenNode;
	} else {
		rootNode.codeGenNode = firstChild;
	}
}

function dfs(node, context) {
	// if (node.type === AstNodeTypes.TEXT) {
	// 	node.content = "this is transformed message";
	// }
	//execute plugins before go into it
	const { nodeTransforms } = context;
	const onLeaveExecutionLIFO: any = [];
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
		default:
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
