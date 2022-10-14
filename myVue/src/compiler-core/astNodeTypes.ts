import { CREATE_ELEMENT_NODE } from "./transformHelpers";

export enum AstNodeTypes {
	INTERPOLATION,
	SIMPLE_EXPRESSION,
	ELEMENT,
	TEXT,
	ROOT,
	MIXED_EXPRESSION,
}

export function createElementCodeGenNode(
	transformCxt,
	tag,
	attributes,
	content
) {
	transformCxt.addHelper(CREATE_ELEMENT_NODE);
	return {
		type: AstNodeTypes.ELEMENT,
		tag: tag,
		attributes: attributes,
		branches: content,
	};
}
