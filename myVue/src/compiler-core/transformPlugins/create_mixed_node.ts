import { AstNodeTypes } from "../astNodeTypes";
const isLiteralNode = (someNode) => {
	return (
		someNode.type === AstNodeTypes.INTERPOLATION ||
		someNode.type === AstNodeTypes.TEXT
	);
};
//node1,    node2,      node3,
//A         B           C             <<<before
//A+B       C                         <<<after

export function create_mixed_node(node) {
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
						} else {
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
