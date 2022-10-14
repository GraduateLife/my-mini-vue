import { AstNodeTypes } from "./astNodeTypes";
import {
	CREATE_ELEMENT_NODE,
	HelperMap,
	TO_DISPLAY_STRING,
} from "./transformHelpers";

export function generate(ast) {
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
		default:
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
	processElementArray(
		mustNotReturnUndefined([tag, attributes, branches]),
		context
	);
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
		} else {
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
		} else {
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
