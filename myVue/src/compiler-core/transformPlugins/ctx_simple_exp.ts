import { AstNodeTypes } from "../astNodeTypes";

export function ctx_simple_exp(node) {
	if (node.type === AstNodeTypes.INTERPOLATION) {
		node.content = add_ctx(node.content);
		// node.content.content = "_ctx." + node.content.content;
	}
}
function add_ctx(insideIPcontent: any) {
	insideIPcontent.content = `_ctx.${insideIPcontent.content}`;
	return insideIPcontent;
}
