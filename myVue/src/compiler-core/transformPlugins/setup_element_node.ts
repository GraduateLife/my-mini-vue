import { AstNodeTypes, createElementCodeGenNode } from "../astNodeTypes";

export function setup_element_node(node, transformCxt) {
	if (node.type === AstNodeTypes.ELEMENT) {
		return () => {
			//setup element codegenNode
			const elementTag = `'${node.tag}'`;
			let elementAttrs;
			let elementBranches = node.branches[0]; //setup the codegenNode need to be handled

			node.codeGenNode = createElementCodeGenNode(
				transformCxt,
				elementTag,
				elementAttrs,
				elementBranches
			);
		};
	}
}
